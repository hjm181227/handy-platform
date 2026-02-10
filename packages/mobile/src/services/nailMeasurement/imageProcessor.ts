/**
 * 이미지 처리 및 후처리 유틸리티
 * - 마스크에서 손톱 영역 추출
 * - 손톱 폭 계산
 * - 신용카드 기준 실제 크기 환산
 */

import {
  NailRegion,
  BoundingBox,
  FingerNailMeasurement,
  FingerType,
  CREDIT_CARD_WIDTH_MM,
  MODEL_INPUT_SIZE,
  SEGMENTATION_THRESHOLD,
  RegionValidationResult,
  ValidatedRegion,
  RegionValidationConfig,
  DEFAULT_VALIDATION_CONFIG,
  CalibrationValidationResult,
} from './types';

/**
 * Connected Component Labeling (4-connectivity)
 * 마스크에서 연결된 영역들을 분리
 */
export function findConnectedComponents(mask: number[][]): NailRegion[] {
  const height = mask.length;
  const width = mask[0].length;
  const visited = Array(height).fill(null).map(() => Array(width).fill(false));
  const regions: NailRegion[] = [];
  let regionId = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] >= SEGMENTATION_THRESHOLD && !visited[y][x]) {
        const region = floodFill(mask, visited, x, y, regionId);
        if (region.area > 100) {  // 최소 면적 필터 (노이즈 제거)
          regions.push(region);
          regionId++;
        }
      }
    }
  }

  return regions;
}

/**
 * Flood Fill로 연결된 영역 찾기
 */
function floodFill(
  mask: number[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  regionId: number
): NailRegion {
  const height = mask.length;
  const width = mask[0].length;
  const stack: [number, number][] = [[startX, startY]];

  let minX = startX, maxX = startX;
  let minY = startY, maxY = startY;
  let sumX = 0, sumY = 0;
  let area = 0;

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x] || mask[y][x] < SEGMENTATION_THRESHOLD) continue;

    visited[y][x] = true;
    area++;
    sumX += x;
    sumY += y;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    // 4-connectivity
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  const boundingBox: BoundingBox = {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };

  return {
    id: regionId,
    boundingBox,
    widthPixels: boundingBox.width,
    heightPixels: boundingBox.height,
    centerX: sumX / area,
    centerY: sumY / area,
    area,
  };
}

/**
 * X좌표 기준으로 손톱 영역을 손가락별로 분류
 * 왼손 기준: 엄지(가장 왼쪽) → 새끼(가장 오른쪽)
 * 오른손 기준: 새끼(가장 왼쪽) → 엄지(가장 오른쪽)
 */
export function classifyFingersByPosition(
  regions: NailRegion[],
  isThumbOnly: boolean = false,
  selectedHand: 'left' | 'right' = 'right'
): Map<FingerType, NailRegion> {
  const result = new Map<FingerType, NailRegion>();

  if (regions.length === 0) return result;

  // X좌표 기준 정렬 (왼쪽 → 오른쪽)
  const sortedRegions = [...regions].sort((a, b) => a.centerX - b.centerX);

  if (isThumbOnly) {
    // 엄지만 촬영한 경우
    if (sortedRegions.length >= 1) {
      result.set('thumb', sortedRegions[0]);
    }
  } else {
    // 4손가락 촬영한 경우 (검지, 중지, 약지, 새끼)
    // 왼손: 카메라 기준 좌→우 = 소지→약지→중지→검지
    // 오른손: 카메라 기준 좌→우 = 검지→중지→약지→소지
    const fingerOrder: FingerType[] = selectedHand === 'left'
      ? ['little', 'ring', 'middle', 'index']
      : ['index', 'middle', 'ring', 'little'];

    for (let i = 0; i < Math.min(sortedRegions.length, 4); i++) {
      result.set(fingerOrder[i], sortedRegions[i]);
    }
  }

  return result;
}

/**
 * 마스크에서 손톱의 정확한 폭 계산
 * 각 행에서 손톱 픽셀의 좌우 경계를 찾아 최대 폭 계산
 */
export function calculateNailWidth(
  mask: number[][],
  region: NailRegion
): number {
  const { boundingBox } = region;
  let maxWidth = 0;

  // 바운딩박스 내에서 각 행의 폭 계산
  for (let y = boundingBox.y; y < boundingBox.y + boundingBox.height; y++) {
    let leftEdge = -1;
    let rightEdge = -1;

    for (let x = boundingBox.x; x < boundingBox.x + boundingBox.width; x++) {
      if (mask[y][x] >= SEGMENTATION_THRESHOLD) {
        if (leftEdge === -1) leftEdge = x;
        rightEdge = x;
      }
    }

    if (leftEdge !== -1 && rightEdge !== -1) {
      const width = rightEdge - leftEdge + 1;
      maxWidth = Math.max(maxWidth, width);
    }
  }

  return maxWidth;
}

/**
 * 신용카드 영역에서 픽셀-mm 비율 계산
 * 신용카드가 이미지에서 차지하는 폭(픽셀)을 기준으로 환산
 */
export function calculatePixelToMmRatio(
  cardWidthPixels: number
): number {
  return CREDIT_CARD_WIDTH_MM / cardWidthPixels;
}

/**
 * 픽셀 폭을 실제 mm로 변환
 */
export function pixelsToMm(
  pixels: number,
  pixelToMmRatio: number
): number {
  return pixels * pixelToMmRatio;
}

/**
 * 전체 측정 파이프라인
 */
export function processNailMeasurement(
  mask: number[][],
  cardWidthPixels: number,
  isThumbOnly: boolean = false,
  selectedHand: 'left' | 'right' = 'right'
): FingerNailMeasurement[] {
  // 1. 연결된 손톱 영역 찾기
  const regions = findConnectedComponents(mask);

  // 2. 손가락별 분류
  const fingerRegions = classifyFingersByPosition(regions, isThumbOnly, selectedHand);

  // 3. 픽셀-mm 비율 계산
  const pixelToMmRatio = calculatePixelToMmRatio(cardWidthPixels);

  // 4. 각 손가락별 폭 계산
  const measurements: FingerNailMeasurement[] = [];

  fingerRegions.forEach((region, finger) => {
    const widthPixels = calculateNailWidth(mask, region);
    const widthMm = pixelsToMm(widthPixels, pixelToMmRatio);

    measurements.push({
      finger,
      widthMm: Math.round(widthMm * 10) / 10,  // 소수점 1자리
      widthPixels,
      confidence: 0.9,  // TODO: 실제 confidence 계산
      boundingBox: region.boundingBox,  // 감지된 영역
    });
  });

  return measurements;
}

/**
 * 모델 입력 크기에 맞게 이미지 좌표 스케일링
 */
export function scaleCoordinates(
  value: number,
  originalSize: number,
  targetSize: number = MODEL_INPUT_SIZE
): number {
  return (value / originalSize) * targetSize;
}

/**
 * 모델 출력 좌표를 원본 이미지 좌표로 역변환
 */
export function unscaleCoordinates(
  value: number,
  originalSize: number,
  modelSize: number = MODEL_INPUT_SIZE
): number {
  return (value / modelSize) * originalSize;
}

// ============================================
// Stage 3: 영역 검증 함수들
// ============================================

/**
 * 감지된 손톱 영역 검증
 * Stage 3: 영역 검증
 *
 * @param regions - 감지된 영역들
 * @param isThumbOnly - 엄지만 촬영했는지 여부
 * @param config - 검증 설정 (선택)
 */
export function validateNailRegions(
  regions: NailRegion[],
  isThumbOnly: boolean = true,
  config: Partial<RegionValidationConfig> = {}
): RegionValidationResult {
  const fullConfig: RegionValidationConfig = {
    ...DEFAULT_VALIDATION_CONFIG,
    ...config,
    expectedRegionCount: isThumbOnly ? 1 : 4,
  };

  console.log('[Stage 3] ========================================');
  console.log('[Stage 3] Validating nail regions...');
  console.log('[Stage 3] Expected count:', fullConfig.expectedRegionCount, isThumbOnly ? '(thumb only)' : '(4 fingers)');
  console.log('[Stage 3] Detected count:', regions.length);

  const invalidReasons: string[] = [];
  const validRegions: ValidatedRegion[] = [];

  // 영역 개수 검증
  if (regions.length === 0) {
    invalidReasons.push('No nail regions detected');
  } else if (regions.length !== fullConfig.expectedRegionCount) {
    invalidReasons.push(`Expected ${fullConfig.expectedRegionCount} regions, got ${regions.length}`);
  }

  // 각 영역 검증
  regions.forEach((region, index) => {
    const isValidSize = region.area >= fullConfig.minAreaPixels &&
                        region.area <= fullConfig.maxAreaPixels;

    // 중앙 오프셋 계산 (0 ~ 1 범위)
    const centerOffsetX = Math.abs(region.centerX - MODEL_INPUT_SIZE / 2) / (MODEL_INPUT_SIZE / 2);
    const centerOffsetY = Math.abs(region.centerY - MODEL_INPUT_SIZE / 2) / (MODEL_INPUT_SIZE / 2);
    const maxOffset = Math.max(centerOffsetX, centerOffsetY);
    const isValidPosition = maxOffset <= fullConfig.maxCenterOffsetRatio;

    console.log(`[Stage 3] Region ${index}: area=${region.area}px, center=(${region.centerX.toFixed(1)}, ${region.centerY.toFixed(1)})`);
    console.log(`[Stage 3] Region ${index}: bbox=(${region.boundingBox.x}, ${region.boundingBox.y}, ${region.boundingBox.width}x${region.boundingBox.height})`);
    console.log(`[Stage 3] Region ${index}: validSize=${isValidSize}, validPosition=${isValidPosition}`);

    if (!isValidSize) {
      if (region.area < fullConfig.minAreaPixels) {
        invalidReasons.push(`Region ${index}: Too small (${region.area}px < ${fullConfig.minAreaPixels}px)`);
      } else {
        invalidReasons.push(`Region ${index}: Too large (${region.area}px > ${fullConfig.maxAreaPixels}px)`);
      }
    }

    if (!isValidPosition) {
      invalidReasons.push(`Region ${index}: Too far from center (offset=${maxOffset.toFixed(2)})`);
    }

    validRegions.push({
      regionId: region.id,
      area: region.area,
      centerX: region.centerX,
      centerY: region.centerY,
      boundingBox: region.boundingBox,
      isValidSize,
      isValidPosition,
    });
  });

  const isValid = invalidReasons.length === 0 &&
                  regions.length === fullConfig.expectedRegionCount;

  console.log('[Stage 3] Validation:', isValid ? 'PASS' : 'FAIL');
  if (!isValid) {
    invalidReasons.forEach(reason => console.log('[Stage 3] Reason:', reason));
  }
  console.log('[Stage 3] ========================================');

  return {
    isValid,
    expectedCount: fullConfig.expectedRegionCount,
    actualCount: regions.length,
    validRegions,
    invalidReasons,
  };
}

// ============================================
// Stage 4: 캘리브레이션 검증 함수들
// ============================================

/**
 * 신용카드 캘리브레이션 검증
 * Stage 4: 픽셀-mm 변환 검증
 *
 * @param cardWidthPixels - 감지된 카드 폭 (픽셀)
 * @param expectedCardWidthMm - 예상 카드 폭 (기본: 85.6mm)
 */
export function validateCalibration(
  cardWidthPixels: number,
  expectedCardWidthMm: number = CREDIT_CARD_WIDTH_MM
): CalibrationValidationResult {
  console.log('[Stage 4] ========================================');
  console.log('[Stage 4] Validating calibration...');
  console.log('[Stage 4] Card width (pixels):', cardWidthPixels);

  // 픽셀-mm 비율 계산
  const pixelToMmRatio = expectedCardWidthMm / cardWidthPixels;
  console.log('[Stage 4] Pixel-to-mm ratio:', pixelToMmRatio.toFixed(4), 'mm/px');

  // 예상 카드 폭 (역산)
  const estimatedCardWidthMm = cardWidthPixels * pixelToMmRatio;
  console.log('[Stage 4] Estimated card width:', estimatedCardWidthMm.toFixed(1), 'mm');

  // 오차율 계산 (카드 폭 기준)
  const errorPercentage = Math.abs(estimatedCardWidthMm - expectedCardWidthMm) / expectedCardWidthMm * 100;
  console.log('[Stage 4] Error percentage:', errorPercentage.toFixed(2), '%');

  // 유효성 검증 (오차 15% 미만)
  const isValid = errorPercentage < 15 && cardWidthPixels > 0;
  console.log('[Stage 4] Calibration:', isValid ? 'VALID' : 'INVALID');

  // 합리적인 범위 확인 (카드가 모델 입력의 30-100% 차지)
  const cardRatio = cardWidthPixels / MODEL_INPUT_SIZE;
  if (cardRatio < 0.3) {
    console.warn('[Stage 4] WARNING: Card appears too small in image (ratio:', cardRatio.toFixed(2), ')');
  } else if (cardRatio > 1.0) {
    console.warn('[Stage 4] WARNING: Card appears larger than image (ratio:', cardRatio.toFixed(2), ')');
  } else {
    console.log('[Stage 4] Card ratio:', cardRatio.toFixed(2), '(good)');
  }

  console.log('[Stage 4] ========================================');

  return {
    isValid,
    cardWidthPixels,
    pixelToMmRatio,
    estimatedCardWidthMm,
    errorPercentage,
  };
}

/**
 * 측정값 검증 및 로깅
 * Stage 4: 측정 결과 정확도 확인
 *
 * @param widthPixels - 측정된 폭 (픽셀)
 * @param pixelToMmRatio - 픽셀-mm 비율
 * @param fingerType - 손가락 유형
 * @param actualMeasurementMm - 실제 측정값 (선택, 검증용)
 */
export function validateMeasurement(
  widthPixels: number,
  pixelToMmRatio: number,
  fingerType: FingerType,
  actualMeasurementMm?: number
): {
  widthMm: number;
  isValid: boolean;
  errorPercentage?: number;
} {
  const widthMm = widthPixels * pixelToMmRatio;

  console.log(`[Stage 4] ${fingerType}: ${widthPixels}px → ${widthMm.toFixed(1)}mm`);

  // 손톱 크기 합리적 범위 확인 (6-22mm)
  const isInRange = widthMm >= 6 && widthMm <= 22;
  if (!isInRange) {
    console.warn(`[Stage 4] WARNING: ${fingerType} measurement (${widthMm.toFixed(1)}mm) outside normal range (6-22mm)`);
  }

  let errorPercentage: number | undefined;
  if (actualMeasurementMm !== undefined) {
    errorPercentage = Math.abs(widthMm - actualMeasurementMm) / actualMeasurementMm * 100;
    console.log(`[Stage 4] ${fingerType}: Actual=${actualMeasurementMm}mm, Error=${errorPercentage.toFixed(1)}%`);
  }

  return {
    widthMm: Math.round(widthMm * 10) / 10,  // 소수점 1자리
    isValid: isInRange,
    errorPercentage,
  };
}
