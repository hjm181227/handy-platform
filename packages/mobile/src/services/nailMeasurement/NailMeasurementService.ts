/**
 * 손톱 측정 서비스
 *
 * 전체 측정 플로우 관리:
 * 1. 이미지 촬영/선택
 * 2. 서버 AI 모델로 손톱 영역 세그멘테이션
 * 3. 신용카드 기준 실제 크기 계산
 * 4. 손가락별 측정 결과 반환
 *
 * Lambda 서버 API (ONNX Runtime) 사용
 */

// NailSegmentationAPI를 lazy import
let segmentationAPIModule: typeof import('./NailSegmentationAPI') | null = null;
const getSegmentationAPI = () => {
  if (!segmentationAPIModule) {
    segmentationAPIModule = require('./NailSegmentationAPI');
  }
  return segmentationAPIModule.nailSegmentationAPI;
};

import {
  processNailMeasurement,
  findConnectedComponents,
  classifyFingersByPosition,
  validateNailRegions,
  validateCalibration,
  calculatePixelToMmRatio,
  pixelsToMm,
} from './imageProcessor';
import {
  NailMeasurementResult,
  NailRegion,
  FingerNailMeasurement,
  CREDIT_CARD_WIDTH_MM,
  MODEL_INPUT_SIZE,
  RegionValidationResult,
  CalibrationValidationResult,
} from './types';

class NailMeasurementService {

  /**
   * 엄지 손톱 측정
   * @param imageUri - 촬영된 이미지 URI (file:// 형식)
   * @param cardWidthPixels - 이미지 내 신용카드 폭 (픽셀)
   */
  async measureThumb(
    imageUri: string,
    cardWidthPixels: number
  ): Promise<NailMeasurementResult> {
    return this.measureNails(imageUri, cardWidthPixels, true);
  }

  /**
   * 4손가락 손톱 측정 (검지, 중지, 약지, 새끼)
   * @param imageUri - 촬영된 이미지 URI (file:// 형식)
   * @param cardWidthPixels - 이미지 내 신용카드 폭 (픽셀)
   */
  async measureFourFingers(
    imageUri: string,
    cardWidthPixels: number,
    selectedHand: 'left' | 'right' = 'right'
  ): Promise<NailMeasurementResult> {
    return this.measureNails(imageUri, cardWidthPixels, false, selectedHand);
  }

  /**
   * 손톱 측정 메인 로직
   * 서버 API를 사용하여 마스크 오버레이를 생성합니다.
   */
  private async measureNails(
    imageUri: string,
    cardWidthPixels: number,
    isThumbOnly: boolean,
    selectedHand: 'left' | 'right' = 'right'
  ): Promise<NailMeasurementResult> {
    const startTime = Date.now();

    // 1. 서버 API로 세그멘테이션 + 오버레이 생성
    console.log('[NailMeasurementService] Running server segmentation with overlay...');
    const segmentationResult = await getSegmentationAPI().predictWithOverlay(imageUri, cardWidthPixels);

    // 2. 영역 감지 및 검증 (Stage 3)
    // Lambda는 mask를 빈 배열로 반환하고 대신 serverRegions를 제공
    console.log('[NailMeasurementService] Processing measurements...');
    let regions: NailRegion[];
    let measurements: FingerNailMeasurement[];

    const hasMask = segmentationResult.mask && segmentationResult.mask.length > 0;
    const hasServerRegions = segmentationResult.serverRegions && segmentationResult.serverRegions.length > 0;

    if (hasMask) {
      // Dev server (FastAPI): 2D mask array → 로컬 처리
      console.log('[NailMeasurementService] Using local mask processing...');
      regions = findConnectedComponents(segmentationResult.mask);
      measurements = processNailMeasurement(
        segmentationResult.mask,
        cardWidthPixels,
        isThumbOnly,
        selectedHand
      );
    } else if (hasServerRegions) {
      // Lambda: 서버에서 감지한 영역 사용
      console.log('[NailMeasurementService] Using server-detected regions:', segmentationResult.serverRegions!.length);
      regions = segmentationResult.serverRegions!;

      // 손가락별 분류
      const fingerRegions = classifyFingersByPosition(regions, isThumbOnly, selectedHand);
      // 카드 실측 검출값이 있으면 그것으로 스케일 계산 (가정 기반 가이드 추정치 대체).
      // 검출 실패 시 기존 가이드 추정치로 폴백.
      const effectiveCardWidth =
        segmentationResult.cardSource === 'detected' && segmentationResult.cardWidthPixelsDetected
          ? segmentationResult.cardWidthPixelsDetected
          : cardWidthPixels;
      if (segmentationResult.cardSource === 'detected') {
        console.log('[NailMeasurementService] Using DETECTED card width:', effectiveCardWidth,
          '(guide estimate was', cardWidthPixels + ')');
      }
      const pixelToMmRatio = calculatePixelToMmRatio(effectiveCardWidth);

      measurements = [];
      fingerRegions.forEach((region, finger) => {
        const widthMm = pixelsToMm(region.widthPixels, pixelToMmRatio);
        measurements.push({
          finger,
          widthMm: Math.round(widthMm * 10) / 10,
          widthPixels: region.widthPixels,
          confidence: 0.9,
          boundingBox: region.boundingBox,
        });
      });
    } else {
      // 영역 없음
      regions = [];
      measurements = [];
    }

    const regionValidation = validateNailRegions(regions, isThumbOnly);
    if (!regionValidation.isValid) {
      console.warn('[NailMeasurementService] Region validation warnings:', regionValidation.invalidReasons);
    }

    // 3. 캘리브레이션 검증 (Stage 4)
    const calibrationValidation = validateCalibration(cardWidthPixels);

    if (!calibrationValidation.isValid) {
      console.warn('[NailMeasurementService] Calibration validation failed');
    }

    const processingTimeMs = Date.now() - startTime;

    console.log('[NailMeasurementService] Server measurement complete:', {
      fingerCount: measurements.length,
      processingTimeMs,
      hasOverlay: !!segmentationResult.maskOverlayBase64,
      usedServerRegions: !hasMask && hasServerRegions,
      regionValidation: regionValidation.isValid ? 'PASS' : 'FAIL',
      calibrationValidation: calibrationValidation.isValid ? 'PASS' : 'FAIL',
    });

    if (measurements.length === 0) {
      throw new Error('손톱을 감지하지 못했습니다.\n\n다시 촬영해 주세요:\n• 손톱이 잘 보이도록 밝은 곳에서 촬영\n• 신용카드와 손톱이 함께 보이게 배치\n• 손톱에 반사광이 없도록 각도 조절');
    }

    return {
      measurements,
      referenceCardDetected: cardWidthPixels > 0,
      pixelToMmRatio: calibrationValidation.pixelToMmRatio,
      imageWidth: MODEL_INPUT_SIZE,
      imageHeight: MODEL_INPUT_SIZE,
      processingTimeMs,
      mask: segmentationResult.mask,
      croppedImageUri: undefined,  // 서버 방식에서는 base64 사용
      // 서버에서 생성된 오버레이 이미지 (base64)
      croppedImageBase64: segmentationResult.croppedImageBase64,
      maskOverlayBase64: segmentationResult.maskOverlayBase64,
    };
  }

  /**
   * 신용카드 폭 추정 (가이드라인 기준)
   * 사용자가 가이드라인에 맞춰 카드를 배치했을 때
   * 예상되는 카드 폭 (픽셀)
   *
   * @param imageWidth - 이미지 전체 폭
   * @param guidelineWidthRatio - 가이드라인이 이미지에서 차지하는 비율 (예: 0.8)
   */
  estimateCardWidthFromGuideline(
    imageWidth: number,
    guidelineWidthRatio: number = 0.8
  ): number {
    // 가이드라인 폭 = 이미지 폭 * 비율
    return imageWidth * guidelineWidthRatio;
  }

  /**
   * 측정 결과 검증
   * 손톱 크기가 현실적인 범위인지 확인
   */
  validateMeasurements(measurements: FingerNailMeasurement[]): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // 일반적인 손톱 폭 범위: 8mm ~ 18mm
    const MIN_NAIL_WIDTH_MM = 6;
    const MAX_NAIL_WIDTH_MM = 22;

    for (const m of measurements) {
      if (m.widthMm < MIN_NAIL_WIDTH_MM) {
        warnings.push(`${m.finger}: 측정값(${m.widthMm}mm)이 너무 작습니다.`);
      }
      if (m.widthMm > MAX_NAIL_WIDTH_MM) {
        warnings.push(`${m.finger}: 측정값(${m.widthMm}mm)이 너무 큽니다.`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}

// 싱글톤 인스턴스
export const nailMeasurementService = new NailMeasurementService();
export default nailMeasurementService;
