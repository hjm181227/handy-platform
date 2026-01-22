/**
 * 손톱 측정 관련 타입 정의
 */

// 손톱 세그멘테이션 결과
export interface NailSegmentationResult {
  mask: number[][];  // 256x256 binary mask (0 or 1)
  confidence: number;
  processingTimeMs: number;
  croppedImageUri?: string;  // 크롭된 이미지 URI (file://)
}

// 개별 손톱 영역
export interface NailRegion {
  id: number;
  boundingBox: BoundingBox;
  widthPixels: number;
  heightPixels: number;
  centerX: number;
  centerY: number;
  area: number;
}

export interface BoundingBox {
  x: number;      // 좌상단 x
  y: number;      // 좌상단 y
  width: number;
  height: number;
}

// 손가락별 손톱 측정 결과
export interface FingerNailMeasurement {
  finger: FingerType;
  widthMm: number;
  widthPixels: number;
  confidence: number;
  boundingBox: BoundingBox;  // 모델 공간(256x256)에서의 감지 영역
}

export type FingerType = 'thumb' | 'index' | 'middle' | 'ring' | 'little';

// 전체 측정 결과
export interface NailMeasurementResult {
  measurements: FingerNailMeasurement[];
  referenceCardDetected: boolean;
  pixelToMmRatio: number;  // 1픽셀 = X mm
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number;
  mask?: number[][];  // 256x256 세그멘테이션 마스크 (0-1)
  croppedImageUri?: string;  // 크롭된 이미지 URI (file://)
}

// 신용카드 기준 정보
export const CREDIT_CARD_WIDTH_MM = 85.6;  // ISO/IEC 7810 규격
export const CREDIT_CARD_HEIGHT_MM = 53.98;

// 모델 설정
export const MODEL_INPUT_SIZE = 256;
export const SEGMENTATION_THRESHOLD = 0.5;

// 카메라 가이드라인 설정 - 고정 픽셀 크기
// 화면 비율 대신 고정 픽셀로 카드 가이드 설정
export const CARD_GUIDE_WIDTH_MOBILE = 280;  // 모바일용 (< 600px 화면)
export const CARD_GUIDE_WIDTH_TABLET = 400;  // 태블릿용 (>= 600px 화면)
export const TABLET_BREAKPOINT = 600;        // 태블릿 판단 기준 (화면 폭)

// 신용카드 비율 (ISO/IEC 7810)
export const CARD_ASPECT_RATIO = 85.60 / 53.98; // 약 1.586

// pixel-to-mm 비율 계산 헬퍼
// cardGuideWidth: 화면에서 카드 가이드 폭 (고정 픽셀)
// screenWidth: 화면 폭
// 반환: 256px 모델 입력에서 1픽셀당 mm
export function calculatePixelToMmRatio(cardGuideWidth: number, screenWidth: number): number {
  const cardToScreenRatio = cardGuideWidth / screenWidth;
  const cardPixelsInModel = MODEL_INPUT_SIZE * cardToScreenRatio;
  return CREDIT_CARD_WIDTH_MM / cardPixelsInModel;
}
