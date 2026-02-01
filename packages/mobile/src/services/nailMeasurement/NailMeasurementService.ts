/**
 * 손톱 측정 서비스
 *
 * 전체 측정 플로우 관리:
 * 1. 이미지 촬영/선택
 * 2. AI 모델로 손톱 영역 세그멘테이션
 * 3. 신용카드 기준 실제 크기 계산
 * 4. 손가락별 측정 결과 반환
 */

// NailSegmentationModel을 lazy import (Hermes 엔진 호환성 문제 방지)
// 모듈 레벨에서 import하면 react-native-fast-tflite가 즉시 로드되어
// "property is not configurable" 에러 발생
let segmentationModelModule: typeof import('./NailSegmentationModel') | null = null;
const getSegmentationModel = () => {
  if (!segmentationModelModule) {
    segmentationModelModule = require('./NailSegmentationModel');
  }
  return segmentationModelModule.nailSegmentationModel;
};

// NailSegmentationAPI를 lazy import (서버 기반 세그멘테이션용)
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
} from './imageProcessor';
import {
  NailMeasurementResult,
  NailSegmentationResult,
  NailRegion,
  FingerNailMeasurement,
  CREDIT_CARD_WIDTH_MM,
  MODEL_INPUT_SIZE,
  SERVER_MODEL_INPUT_SIZE,
  RegionValidationResult,
  CalibrationValidationResult,
  MeasureWithOverlayResponse,
  ServerCalibrationInfo,
} from './types';

class NailMeasurementService {
  private initialized: boolean = false;

  /**
   * 서비스 초기화 (모델 로드)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    console.log('[NailMeasurementService] Initializing...');

    const success = await getSegmentationModel().loadModel();

    if (success) {
      this.initialized = true;
      console.log('[NailMeasurementService] Initialized successfully with real model');
    } else {
      throw new Error('모델을 로드할 수 없습니다. 앱을 다시 시작해 주세요.');
    }

    return this.initialized;
  }

  /**
   * 엄지 손톱 측정
   * @param imageUri - 촬영된 이미지 URI (file:// 형식)
   * @param cardGuideWidth - 화면상 카드 가이드 폭 (예: 280px)
   * @param screenWidth - 화면 전체 폭 (예: 393px)
   */
  async measureThumb(
    imageUri: string,
    cardGuideWidth: number,
    screenWidth: number
  ): Promise<NailMeasurementResult> {
    return this.measureNails(imageUri, cardGuideWidth, screenWidth, true);
  }

  /**
   * 4손가락 손톱 측정 (검지, 중지, 약지, 새끼)
   * @param imageUri - 촬영된 이미지 URI (file:// 형식)
   * @param cardGuideWidth - 화면상 카드 가이드 폭 (예: 280px)
   * @param screenWidth - 화면 전체 폭 (예: 393px)
   */
  async measureFourFingers(
    imageUri: string,
    cardGuideWidth: number,
    screenWidth: number
  ): Promise<NailMeasurementResult> {
    return this.measureNails(imageUri, cardGuideWidth, screenWidth, false);
  }

  /**
   * 손톱 측정 메인 로직
   * Stage 1-4: 모든 단계 포함
   *
   * 기본적으로 서버 /api/measure-with-overlay API를 사용
   * - 서버가 640x640 네이티브 해상도로 측정을 완료
   * - 좌표계 불일치 문제 해결 (256 → 640 리사이즈 제거)
   *
   * 서버 연결 실패 시 로컬 모델로 폴백 (256x256 기반)
   */
  private async measureNails(
    imageUri: string,
    cardGuideWidth: number,
    screenWidth: number,
    isThumbOnly: boolean
  ): Promise<NailMeasurementResult> {
    const startTime = Date.now();

    // 1. 서버 /api/measure-with-overlay API 시도 (640x640 기준 측정)
    try {
      console.log('[NailMeasurementService] Trying server measure-with-overlay API...');
      const api = getSegmentationAPI();

      // 서버 상태 확인
      const isAvailable = await api.isServerAvailable();
      if (isAvailable) {
        // 서버에서 측정까지 완료 (640x640 기준)
        const serverResult: MeasureWithOverlayResponse = await api.measureWithOverlay(
          imageUri,
          cardGuideWidth,
          screenWidth,
          isThumbOnly
        );

        console.log('[NailMeasurementService] Server measure-with-overlay succeeded:', {
          fingerCount: serverResult.measurements.length,
          calibration: serverResult.calibration,
        });

        // 손톱을 감지하지 못한 경우 에러 발생
        if (!serverResult.success || serverResult.measurements.length === 0) {
          throw new Error('손톱을 감지하지 못했습니다.\n\n다시 촬영해 주세요:\n• 손톱이 잘 보이도록 밝은 곳에서 촬영\n• 신용카드와 손톱이 함께 보이게 배치\n• 손톱에 반사광이 없도록 각도 조절');
        }

        const processingTimeMs = Date.now() - startTime;

        return {
          measurements: serverResult.measurements,
          referenceCardDetected: true,
          pixelToMmRatio: serverResult.calibration.pixelToMmRatio,
          imageWidth: serverResult.calibration.modelInputSize,  // 640
          imageHeight: serverResult.calibration.modelInputSize, // 640
          processingTimeMs,
          mask: undefined,  // 서버 방식에서는 마스크 배열 불필요 (오버레이 이미지 사용)
          croppedImageUri: undefined,
          croppedImageBase64: serverResult.croppedImageBase64,
          maskOverlayBase64: serverResult.maskOverlayBase64,
          // 서버 캘리브레이션 정보 추가
          serverCalibration: serverResult.calibration,
        };
      } else {
        throw new Error('Server not available');
      }
    } catch (serverError) {
      // 2. 서버 실패 시 로컬 모델로 폴백 (256x256 기반 - 기존 방식)
      console.warn('[NailMeasurementService] Server API failed, falling back to local model:', serverError);

      // 로컬 모델 초기화 확인
      if (!this.initialized) {
        await this.initialize();
      }

      // 로컬 세그멘테이션 실행
      console.log('[NailMeasurementService] Running local segmentation...');
      const segmentationResult: NailSegmentationResult = await getSegmentationModel().predict(imageUri);

      // 256x256 기준으로 카드 폭 계산 (기존 방식)
      const cardToScreenRatio = cardGuideWidth / screenWidth;
      const cardWidthPixels = MODEL_INPUT_SIZE * cardToScreenRatio;

      // 3. 영역 감지 및 검증 (Stage 3)
      console.log('[NailMeasurementService] Processing measurements...');
      const regions = findConnectedComponents(segmentationResult.mask);
      const regionValidation = validateNailRegions(regions, isThumbOnly);

      if (!regionValidation.isValid) {
        console.warn('[NailMeasurementService] Region validation warnings:', regionValidation.invalidReasons);
      }

      // 4. 캘리브레이션 검증 (Stage 4)
      const calibrationValidation = validateCalibration(cardWidthPixels);

      if (!calibrationValidation.isValid) {
        console.warn('[NailMeasurementService] Calibration validation failed');
      }

      // 5. 최종 측정값 계산 (256x256 기준)
      const measurements = processNailMeasurement(
        segmentationResult.mask,
        cardWidthPixels,
        isThumbOnly
      );

      const processingTimeMs = Date.now() - startTime;

      console.log('[NailMeasurementService] Fallback measurement complete:', {
        fingerCount: measurements.length,
        processingTimeMs,
        regionValidation: regionValidation.isValid ? 'PASS' : 'FAIL',
        calibrationValidation: calibrationValidation.isValid ? 'PASS' : 'FAIL',
        mode: 'local (256x256)',
      });

      // 손톱을 감지하지 못한 경우 에러 발생
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
        croppedImageUri: segmentationResult.croppedImageUri,
        croppedImageBase64: segmentationResult.croppedImageBase64,
        maskOverlayBase64: segmentationResult.maskOverlayBase64,
      };
    }
  }

  /**
   * 마스크에서 손톱 영역 시각화 데이터 반환
   * (디버그/미리보기용)
   */
  async getSegmentationPreview(
    imageBase64: string
  ): Promise<{
    mask: number[][];
    regions: NailRegion[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await getSegmentationModel().predict(imageBase64);
    const regions = findConnectedComponents(result.mask);

    return {
      mask: result.mask,
      regions,
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

  /**
   * 서비스 정리
   */
  dispose(): void {
    getSegmentationModel().unloadModel();
    this.initialized = false;
    console.log('[NailMeasurementService] Disposed');
  }
}

// 싱글톤 인스턴스
export const nailMeasurementService = new NailMeasurementService();
export default nailMeasurementService;
