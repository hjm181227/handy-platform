/**
 * API 기반 손톱 세그멘테이션 서비스
 *
 * TFLite 로컬 추론 대신 서버 API를 호출하여 세그멘테이션 수행.
 *
 * 장점:
 * - ResNet101 기반 고정확도 모델 사용 (IoU ~0.98)
 * - 800x800 고해상도 입력 지원
 * - 모델 업데이트 시 앱 재배포 불필요
 * - 모바일 디바이스 부담 감소
 *
 * 단점:
 * - 네트워크 연결 필수
 * - 서버 지연 시간 추가
 *
 * 사용법:
 * ```typescript
 * import { nailSegmentationAPI } from './NailSegmentationAPI';
 *
 * const result = await nailSegmentationAPI.predict(imageUri);
 * console.log(result.mask); // 800x800 마스크
 * ```
 */

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import {
  NailSegmentationResult,
  MODEL_INPUT_SIZE,
  MeasureWithOverlayResponse,
  FingerNailMeasurement,
  FingerType,
  BoundingBox,
} from './types';

// API 서버 URL 설정
// 개발 환경에서는 호스트 머신의 IP 사용 (실제 디바이스에서 접근 가능)
// 에뮬레이터는 10.0.2.2, 실제 디바이스는 호스트 IP 사용
const DEV_HOST_IP = '172.30.1.80';  // 현재 호스트 IP (ifconfig로 확인)

const API_SERVER_URL = __DEV__
  ? Platform.select({
      // Android 에뮬레이터는 10.0.2.2, 실제 디바이스는 호스트 IP
      android: `http://${DEV_HOST_IP}:8000`,  // 실제 디바이스용
      ios: 'http://localhost:8000',            // iOS 시뮬레이터
      default: 'http://localhost:8000',
    })
  : 'http://15.165.5.64:8000';  // 프로덕션 서버 (TODO: 실제 서버 URL로 변경)

// API 응답 타입
interface SegmentationAPIResponse {
  success: boolean;
  mask: number[][];
  width: number;
  height: number;
  processing_time_ms: number;
  mask_stats: {
    min: number;
    max: number;
    mean: number;
    positive_ratio: number;
  };
}

interface MeasurementAPIResponse {
  success: boolean;
  measurements: Array<{
    finger: string;
    width_mm: number;
    width_pixels: number;
    confidence: number;
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  pixel_to_mm_ratio: number;
  processing_time_ms: number;
  mask?: number[][];
}

interface HealthCheckResponse {
  status: string;
  model_loaded: boolean;
  model_path: string;
  encoder: string;
  input_size: number;
}

// 새로운 API 응답 타입: 세그멘테이션 + 오버레이
interface SegmentWithOverlayAPIResponse {
  success: boolean;
  cropped_image: string;   // base64 PNG of cropped input image
  mask_overlay: string;    // base64 PNG of mask overlay (transparent + green)
  mask: number[][];
  width: number;
  height: number;
  processing_time_ms: number;
  mask_stats: {
    min: number;
    max: number;
    mean: number;
    positive_ratio: number;
  };
}

// 서버 /api/measure-with-overlay 응답 타입 (서버에서 측정까지 완료)
interface MeasureWithOverlayAPIResponse {
  success: boolean;
  measurements: Array<{
    finger: string;
    width_mm: number;
    width_pixels: number;
    confidence: number;
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  calibration: {
    card_guide_width: number;
    screen_width: number;
    card_pixels_in_model: number;
    pixel_to_mm_ratio: number;
    model_input_size: number;
  };
  cropped_image: string;   // base64 PNG
  mask_overlay: string;    // base64 PNG
  processing_time_ms: number;
}

class NailSegmentationAPI {
  private serverUrl: string;
  private isAvailable: boolean | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // 1분마다 체크

  constructor(serverUrl: string = API_SERVER_URL!) {
    this.serverUrl = serverUrl;
    console.log('[NailSegmentationAPI] Initialized with server:', this.serverUrl);
  }

  /**
   * 서버 상태 확인
   */
  async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      console.log('[NailSegmentationAPI] Checking server health...');

      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[NailSegmentationAPI] Health check failed:', response.status);
        this.isAvailable = false;
        return null;
      }

      const data: HealthCheckResponse = await response.json();
      this.isAvailable = data.model_loaded;
      this.lastHealthCheck = Date.now();

      console.log('[NailSegmentationAPI] Health check result:', {
        status: data.status,
        modelLoaded: data.model_loaded,
        encoder: data.encoder,
        inputSize: data.input_size,
      });

      return data;
    } catch (error) {
      console.error('[NailSegmentationAPI] Health check error:', error);
      this.isAvailable = false;
      return null;
    }
  }

  /**
   * 서버 사용 가능 여부 확인
   */
  async isServerAvailable(): Promise<boolean> {
    // 캐시된 결과 사용 (일정 시간 내)
    if (
      this.isAvailable !== null &&
      Date.now() - this.lastHealthCheck < this.healthCheckInterval
    ) {
      return this.isAvailable;
    }

    const health = await this.checkHealth();
    return health?.model_loaded ?? false;
  }

  /**
   * 이미지 세그멘테이션 수행
   *
   * @param imageUri - 이미지 파일 URI (file:// 형식)
   * @returns 세그멘테이션 결과
   */
  async predict(imageUri: string): Promise<NailSegmentationResult> {
    const totalStartTime = Date.now();

    console.log('[NailSegmentationAPI] ========================================');
    console.log('[NailSegmentationAPI] Starting API prediction...');
    console.log('[NailSegmentationAPI] Image URI:', imageUri.substring(0, 50) + '...');

    try {
      // 1. 이미지 파일 읽기
      const readStartTime = Date.now();
      const cleanUri = imageUri.replace('file://', '');

      // 파일 존재 확인
      const exists = await RNFS.exists(cleanUri);
      if (!exists) {
        throw new Error(`Image file not found: ${cleanUri}`);
      }

      // 파일을 base64로 읽기
      const base64Data = await RNFS.readFile(cleanUri, 'base64');
      console.log('[NailSegmentationAPI] File read time:', Date.now() - readStartTime, 'ms');
      console.log('[NailSegmentationAPI] Base64 length:', base64Data.length);

      // 2. FormData 생성
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      // 3. API 호출
      const apiStartTime = Date.now();
      console.log('[NailSegmentationAPI] Calling API:', `${this.serverUrl}/api/segment`);

      const response = await fetch(`${this.serverUrl}/api/segment`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('[NailSegmentationAPI] API response time:', Date.now() - apiStartTime, 'ms');
      console.log('[NailSegmentationAPI] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      // 4. 응답 파싱
      const parseStartTime = Date.now();
      const data: SegmentationAPIResponse = await response.json();
      console.log('[NailSegmentationAPI] Parse time:', Date.now() - parseStartTime, 'ms');

      if (!data.success) {
        throw new Error('API returned success=false');
      }

      // 5. 마스크 크기 조정 (서버는 800x800, 모바일은 256x256 기대)
      const resizeStartTime = Date.now();
      const resizedMask = this.resizeMask(data.mask, MODEL_INPUT_SIZE);
      console.log('[NailSegmentationAPI] Resize time:', Date.now() - resizeStartTime, 'ms');

      const totalTime = Date.now() - totalStartTime;

      // 6. 결과 로깅
      console.log('[NailSegmentationAPI] Mask stats:', {
        min: data.mask_stats.min.toFixed(3),
        max: data.mask_stats.max.toFixed(3),
        mean: data.mask_stats.mean.toFixed(3),
        positiveRatio: data.mask_stats.positive_ratio.toFixed(1) + '%',
      });
      console.log('[NailSegmentationAPI] Total time:', totalTime, 'ms');
      console.log('[NailSegmentationAPI] Server processing time:', data.processing_time_ms, 'ms');
      console.log('[NailSegmentationAPI] ========================================');

      return {
        mask: resizedMask,
        confidence: data.mask_stats.mean > 0.1 ? 0.9 : 0.5,
        processingTimeMs: totalTime,
        croppedImageUri: undefined,  // 서버 방식에서는 크롭 이미지 불필요
      };

    } catch (error) {
      console.error('[NailSegmentationAPI] ========================================');
      console.error('[NailSegmentationAPI] Prediction failed:', error);
      console.error('[NailSegmentationAPI] ========================================');
      throw error;
    }
  }

  /**
   * 이미지 세그멘테이션 + 오버레이 이미지 반환 (서버에서 생성)
   *
   * 서버에서 직접 마스크 오버레이 이미지를 생성하여 반환합니다.
   * 장점:
   * - Python/OpenCV의 정확한 이미지 처리 활용
   * - 마스크와 이미지가 동일 좌표계에서 생성되어 완벽한 정렬
   * - 앱 코드 단순화 (PNG 생성 로직 제거)
   *
   * @param imageUri - 이미지 파일 URI (file:// 형식)
   * @returns 세그멘테이션 결과 + 서버 생성 오버레이 이미지
   */
  async predictWithOverlay(imageUri: string): Promise<NailSegmentationResult> {
    const totalStartTime = Date.now();

    console.log('[NailSegmentationAPI] ========================================');
    console.log('[NailSegmentationAPI] Starting API prediction with overlay...');
    console.log('[NailSegmentationAPI] Image URI:', imageUri.substring(0, 50) + '...');

    try {
      // 1. 이미지 파일 읽기
      const readStartTime = Date.now();
      const cleanUri = imageUri.replace('file://', '');

      // 파일 존재 확인
      const exists = await RNFS.exists(cleanUri);
      if (!exists) {
        throw new Error(`Image file not found: ${cleanUri}`);
      }

      console.log('[NailSegmentationAPI] File read time:', Date.now() - readStartTime, 'ms');

      // 2. FormData 생성
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      // 3. API 호출 (새 엔드포인트)
      const apiStartTime = Date.now();
      console.log('[NailSegmentationAPI] Calling API:', `${this.serverUrl}/api/segment-with-overlay`);

      const response = await fetch(`${this.serverUrl}/api/segment-with-overlay`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('[NailSegmentationAPI] API response time:', Date.now() - apiStartTime, 'ms');
      console.log('[NailSegmentationAPI] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      // 4. 응답 파싱
      const parseStartTime = Date.now();
      const data: SegmentWithOverlayAPIResponse = await response.json();
      console.log('[NailSegmentationAPI] Parse time:', Date.now() - parseStartTime, 'ms');

      if (!data.success) {
        throw new Error('API returned success=false');
      }

      // 5. 마스크 크기 조정 (서버는 640x640, 모바일은 256x256 기대)
      const resizeStartTime = Date.now();
      const resizedMask = this.resizeMask(data.mask, MODEL_INPUT_SIZE);
      console.log('[NailSegmentationAPI] Resize time:', Date.now() - resizeStartTime, 'ms');

      const totalTime = Date.now() - totalStartTime;

      // 6. 결과 로깅
      console.log('[NailSegmentationAPI] Mask stats:', {
        min: data.mask_stats.min.toFixed(3),
        max: data.mask_stats.max.toFixed(3),
        mean: data.mask_stats.mean.toFixed(3),
        positiveRatio: data.mask_stats.positive_ratio.toFixed(1) + '%',
      });
      console.log('[NailSegmentationAPI] Cropped image base64 length:', data.cropped_image.length);
      console.log('[NailSegmentationAPI] Mask overlay base64 length:', data.mask_overlay.length);
      console.log('[NailSegmentationAPI] Total time:', totalTime, 'ms');
      console.log('[NailSegmentationAPI] Server processing time:', data.processing_time_ms, 'ms');
      console.log('[NailSegmentationAPI] ========================================');

      return {
        mask: resizedMask,
        confidence: data.mask_stats.mean > 0.1 ? 0.9 : 0.5,
        processingTimeMs: totalTime,
        croppedImageUri: undefined,  // 서버 방식에서는 URI 대신 base64 사용
        croppedImageBase64: data.cropped_image,
        maskOverlayBase64: data.mask_overlay,
      };

    } catch (error) {
      console.error('[NailSegmentationAPI] ========================================');
      console.error('[NailSegmentationAPI] Prediction with overlay failed:', error);
      console.error('[NailSegmentationAPI] ========================================');
      throw error;
    }
  }

  /**
   * 손톱 측정 수행 (서버에서 전체 처리)
   *
   * @param imageUri - 이미지 파일 URI
   * @param cardWidthPixels - 이미지 내 신용카드 폭 (픽셀)
   * @param isThumbOnly - 엄지만 측정 여부
   */
  async measure(
    imageUri: string,
    cardWidthPixels: number,
    isThumbOnly: boolean = true
  ): Promise<MeasurementAPIResponse> {
    console.log('[NailSegmentationAPI] Calling measure API...');

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    const url = new URL(`${this.serverUrl}/api/measure`);
    url.searchParams.append('card_width_pixels', cardWidthPixels.toString());
    url.searchParams.append('is_thumb_only', isThumbOnly.toString());
    url.searchParams.append('include_mask', 'true');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * 서버에서 세그멘테이션 + 측정 + 오버레이를 한 번에 처리 (640x640 기준)
   *
   * 서버가 640x640 네이티브 해상도로 모든 계산을 수행하여
   * 좌표계 불일치 문제를 해결합니다.
   *
   * @param imageUri - 이미지 파일 URI (file:// 형식)
   * @param cardGuideWidth - 화면상 카드 가이드 폭 (예: 280px)
   * @param screenWidth - 화면 전체 폭 (예: 393px)
   * @param isThumbOnly - 엄지만 측정 여부
   * @returns 측정 결과 + 캘리브레이션 정보 + 오버레이 이미지
   */
  async measureWithOverlay(
    imageUri: string,
    cardGuideWidth: number,
    screenWidth: number,
    isThumbOnly: boolean = true
  ): Promise<MeasureWithOverlayResponse> {
    const totalStartTime = Date.now();

    console.log('[NailSegmentationAPI] ========================================');
    console.log('[NailSegmentationAPI] Starting measure-with-overlay API...');
    console.log('[NailSegmentationAPI] Image URI:', imageUri.substring(0, 50) + '...');
    console.log('[NailSegmentationAPI] Calibration params:', {
      cardGuideWidth,
      screenWidth,
      isThumbOnly,
    });

    try {
      // 1. 이미지 파일 존재 확인
      const cleanUri = imageUri.replace('file://', '');
      const RNFS = require('react-native-fs').default;
      const exists = await RNFS.exists(cleanUri);
      if (!exists) {
        throw new Error(`Image file not found: ${cleanUri}`);
      }

      // 2. FormData 생성
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      // 3. API 호출 (쿼리 파라미터로 캘리브레이션 정보 전달)
      const url = new URL(`${this.serverUrl}/api/measure-with-overlay`);
      url.searchParams.append('card_guide_width', cardGuideWidth.toString());
      url.searchParams.append('screen_width', screenWidth.toString());
      url.searchParams.append('is_thumb_only', isThumbOnly.toString());

      console.log('[NailSegmentationAPI] Calling API:', url.toString());

      const apiStartTime = Date.now();
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('[NailSegmentationAPI] API response time:', Date.now() - apiStartTime, 'ms');
      console.log('[NailSegmentationAPI] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      // 4. 응답 파싱
      const data: MeasureWithOverlayAPIResponse = await response.json();

      if (!data.success && data.measurements.length === 0) {
        console.warn('[NailSegmentationAPI] No nails detected');
      }

      // 5. 응답을 클라이언트 타입으로 변환
      const measurements: FingerNailMeasurement[] = data.measurements.map(m => ({
        finger: m.finger as FingerType,
        widthMm: m.width_mm,
        widthPixels: m.width_pixels,
        confidence: m.confidence,
        boundingBox: {
          x: m.bounding_box.x,
          y: m.bounding_box.y,
          width: m.bounding_box.width,
          height: m.bounding_box.height,
        } as BoundingBox,
      }));

      const totalTime = Date.now() - totalStartTime;

      console.log('[NailSegmentationAPI] Calibration from server:', {
        cardGuideWidth: data.calibration.card_guide_width,
        screenWidth: data.calibration.screen_width,
        cardPixelsInModel: data.calibration.card_pixels_in_model,
        pixelToMmRatio: data.calibration.pixel_to_mm_ratio,
        modelInputSize: data.calibration.model_input_size,
      });
      console.log('[NailSegmentationAPI] Measurements:', measurements.map(m =>
        `${m.finger}: ${m.widthPixels}px → ${m.widthMm}mm`
      ));
      console.log('[NailSegmentationAPI] Total time:', totalTime, 'ms');
      console.log('[NailSegmentationAPI] ========================================');

      return {
        success: data.success,
        measurements,
        calibration: {
          cardGuideWidth: data.calibration.card_guide_width,
          screenWidth: data.calibration.screen_width,
          cardPixelsInModel: data.calibration.card_pixels_in_model,
          pixelToMmRatio: data.calibration.pixel_to_mm_ratio,
          modelInputSize: data.calibration.model_input_size,
        },
        croppedImageBase64: data.cropped_image,
        maskOverlayBase64: data.mask_overlay,
        processingTimeMs: totalTime,
      };

    } catch (error) {
      console.error('[NailSegmentationAPI] ========================================');
      console.error('[NailSegmentationAPI] Measure with overlay failed:', error);
      console.error('[NailSegmentationAPI] ========================================');
      throw error;
    }
  }

  /**
   * 마스크 크기 조정 (바이리니어 보간)
   */
  private resizeMask(mask: number[][], targetSize: number): number[][] {
    const srcHeight = mask.length;
    const srcWidth = mask[0]?.length || 0;

    if (srcHeight === targetSize && srcWidth === targetSize) {
      return mask;
    }

    const result: number[][] = [];
    const scaleY = srcHeight / targetSize;
    const scaleX = srcWidth / targetSize;

    for (let y = 0; y < targetSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < targetSize; x++) {
        // 바이리니어 보간
        const srcX = x * scaleX;
        const srcY = y * scaleY;

        const x0 = Math.floor(srcX);
        const x1 = Math.min(x0 + 1, srcWidth - 1);
        const y0 = Math.floor(srcY);
        const y1 = Math.min(y0 + 1, srcHeight - 1);

        const xFrac = srcX - x0;
        const yFrac = srcY - y0;

        const v00 = mask[y0]?.[x0] ?? 0;
        const v01 = mask[y0]?.[x1] ?? 0;
        const v10 = mask[y1]?.[x0] ?? 0;
        const v11 = mask[y1]?.[x1] ?? 0;

        const value =
          v00 * (1 - xFrac) * (1 - yFrac) +
          v01 * xFrac * (1 - yFrac) +
          v10 * (1 - xFrac) * yFrac +
          v11 * xFrac * yFrac;

        row.push(value);
      }
      result.push(row);
    }

    return result;
  }

  /**
   * 서버 URL 변경
   */
  setServerUrl(url: string): void {
    this.serverUrl = url;
    this.isAvailable = null;  // 캐시 초기화
    console.log('[NailSegmentationAPI] Server URL changed to:', url);
  }

  /**
   * 현재 서버 URL 반환
   */
  getServerUrl(): string {
    return this.serverUrl;
  }
}

// 싱글톤 인스턴스
export const nailSegmentationAPI = new NailSegmentationAPI();
export default nailSegmentationAPI;
