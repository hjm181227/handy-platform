/**
 * 손톱 측정 서비스 모듈
 *
 * Lambda 서버 API (ONNX Runtime) 기반.
 *
 * 사용법:
 * ```typescript
 * import { nailMeasurementService } from '@/services/nailMeasurement';
 *
 * // 엄지 측정
 * const thumbResult = await nailMeasurementService.measureThumb(imageUri, cardWidth);
 *
 * // 4손가락 측정
 * const fingersResult = await nailMeasurementService.measureFourFingers(imageUri, cardWidth);
 * ```
 */

export { nailMeasurementService } from './NailMeasurementService';
export * from './types';
export * from './imageProcessor';

// Stage 3 & 4: 검증 함수 명시적 export
export {
  validateNailRegions,
  validateCalibration,
  validateMeasurement,
} from './imageProcessor';
