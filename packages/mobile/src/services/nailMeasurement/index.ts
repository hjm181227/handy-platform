/**
 * 손톱 측정 서비스 모듈
 *
 * 사용법:
 * ```typescript
 * import { nailMeasurementService } from '@/services/nailMeasurement';
 *
 * // 초기화
 * await nailMeasurementService.initialize();
 *
 * // 엄지 측정
 * const thumbResult = await nailMeasurementService.measureThumb(imageBase64, cardWidth);
 *
 * // 4손가락 측정
 * const fingersResult = await nailMeasurementService.measureFourFingers(imageBase64, cardWidth);
 * ```
 */

export { nailMeasurementService } from './NailMeasurementService';
// nailSegmentationModel은 NailMeasurementService 내부에서 lazy import로 사용
// 직접 export하면 react-native-fast-tflite가 모듈 로드 시점에 로드되어
// Hermes 엔진에서 "property is not configurable" 에러 발생
// export { nailSegmentationModel } from './NailSegmentationModel';
export * from './types';
export * from './imageProcessor';
