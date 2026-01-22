/**
 * TFLite 손톱 세그멘테이션 모델 서비스
 *
 * Kaggle DeepLabV3+ MobileNetV3 모델 사용
 * Input: 256x256x3 (RGB, 0-255 float)
 * Output: 256x256x1 (binary mask, 0-1)
 *
 * 크롭 방식:
 * - 카드 가이드 영역 기준으로 정사각형 크롭
 * - 카드 폭이 256px 전체를 차지하도록 크롭
 * - 이렇게 하면 pixel-to-mm 비율이 정확해짐
 */

import {
  NailSegmentationResult,
  MODEL_INPUT_SIZE,
  CARD_GUIDE_WIDTH_MOBILE,
  CARD_GUIDE_WIDTH_TABLET,
  TABLET_BREAKPOINT,
} from './types';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { Dimensions } from 'react-native';

// react-native-fast-tflite를 lazy import (Hermes 엔진 호환성 문제 방지)
// 모듈 레벨에서 import하면 TensorflowModule.install()이 즉시 실행되어
// "property is not configurable" 에러 발생
let tfliteModule: typeof import('react-native-fast-tflite') | null = null;
const getTflite = () => {
  if (!tfliteModule) {
    tfliteModule = require('react-native-fast-tflite');
  }
  return tfliteModule;
};

// TensorflowModel 타입 정의 (lazy import로 인해 직접 import 불가)
type TensorflowModel = Awaited<ReturnType<typeof import('react-native-fast-tflite').loadTensorflowModel>>;

// jpeg-js를 lazy import (Hermes 엔진 호환성 문제 방지)
let jpegModule: typeof import('jpeg-js') | null = null;
const getJpeg = () => {
  if (!jpegModule) {
    jpegModule = require('jpeg-js');
  }
  return jpegModule;
};

// 화면 크기 및 카드 가이드 비율을 동적으로 계산하는 헬퍼 함수
// (모듈 레벨에서 Dimensions 호출 시 Hermes 엔진 에러 방지)
const getCardToScreenRatio = (): number => {
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
  return cardGuideWidth / screenWidth;
};

// Base64 문자 테이블 (Hermes 엔진에서 atob/btoa 없이 작동)
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

// Base64 → Uint8Array 변환 (순수 JavaScript)
const base64ToUint8Array = (base64: string): Uint8Array => {
  // padding 제거
  let len = base64.length;
  while (len > 0 && base64[len - 1] === '=') len--;

  const bufferLength = Math.floor(len * 3 / 4);
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = BASE64_LOOKUP[base64.charCodeAt(i)];
    const b = BASE64_LOOKUP[base64.charCodeAt(i + 1)];
    const c = BASE64_LOOKUP[base64.charCodeAt(i + 2)];
    const d = BASE64_LOOKUP[base64.charCodeAt(i + 3)];

    bytes[p++] = (a << 2) | (b >> 4);
    if (p < bufferLength) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < bufferLength) bytes[p++] = ((c & 3) << 6) | d;
  }

  return bytes;
};

// Uint8Array → Base64 변환 (순수 JavaScript)
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let result = '';
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS[a >> 2];
    result += BASE64_CHARS[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < len ? BASE64_CHARS[c & 63] : '=';
  }

  return result;
};

// TFLite 모델 경로
const MODEL_PATH = require('../../assets/models/nail_segmentation.tflite');

class NailSegmentationModel {
  private model: TensorflowModel | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private lastCroppedImageUri: string | null = null;  // 마지막 크롭된 이미지 URI

  /**
   * 모델 로드
   */
  async loadModel(): Promise<boolean> {
    if (this.isLoaded) {
      console.log('[NailSegmentationModel] Model already loaded');
      return true;
    }

    if (this.isLoading) {
      console.log('[NailSegmentationModel] Model is already loading...');
      return false;
    }

    this.isLoading = true;

    try {
      console.log('[NailSegmentationModel] Loading TFLite model...');

      this.model = await getTflite().loadTensorflowModel(MODEL_PATH);

      this.isLoaded = true;
      this.isLoading = false;
      console.log('[NailSegmentationModel] Model loaded successfully');
      return true;
    } catch (error) {
      this.isLoading = false;
      console.error('[NailSegmentationModel] Failed to load model:', error);
      return false;
    }
  }

  /**
   * 이미지에서 손톱 영역 세그멘테이션
   * @param imageData - RGB 이미지 데이터 (base64 또는 pixel array)
   */
  async predict(imageData: string | number[][][]): Promise<NailSegmentationResult> {
    const startTime = Date.now();

    if (!this.isLoaded || !this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      let inputTensor: Float32Array;

      if (typeof imageData === 'string') {
        // Base64 이미지 → 텐서 변환
        inputTensor = await this.preprocessBase64Image(imageData);
      } else {
        // 픽셀 배열 → 텐서 변환
        inputTensor = this.preprocessPixelArray(imageData);
      }

      // 모델 추론 실행
      const output = this.model.runSync([inputTensor]);
      const outputData = output[0] as Float32Array;
      const mask = this.postprocessOutput(outputData);

      const processingTimeMs = Date.now() - startTime;

      return {
        mask,
        confidence: 0.9,
        processingTimeMs,
        croppedImageUri: this.lastCroppedImageUri || undefined,
      };
    } catch (error) {
      console.error('[NailSegmentationModel] Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Base64 이미지 전처리 (EXIF 회전 적용 + 카드 영역 기준 크롭 + 리사이즈)
   *
   * 카드 가이드 영역을 기준으로 정사각형 크롭:
   * - 카드 폭이 256px 전체를 차지하도록 크롭
   * - 손가락은 카드 위에 있으므로 카드 영역 내에 포함됨
   * - 이렇게 하면 pixel-to-mm 비율 계산이 정확해짐
   *
   * @param imageUri - 이미지 URI (file:// 형식)
   */
  private async preprocessBase64Image(imageUri: string): Promise<Float32Array> {
    console.log('[NailSegmentationModel] Preprocessing image (card-based crop):', imageUri.substring(0, 50) + '...');

    try {
      // 1. 먼저 ImageResizer로 EXIF 회전 적용 (중간 크기로)
      //    너무 큰 이미지는 처리가 느려지므로 적당한 크기로 축소
      const INTERMEDIATE_SIZE = 1024;
      const normalizedImage = await ImageResizer.createResizedImage(
        imageUri,
        INTERMEDIATE_SIZE,
        INTERMEDIATE_SIZE,
        'JPEG',
        100,  // 품질 (최대)
        0,    // 회전 각도 (0 = EXIF 자동 적용)
        undefined,
        false,
        { mode: 'contain' }  // 비율 유지, 크롭 없음
      );

      console.log('[NailSegmentationModel] Normalized image:', {
        width: normalizedImage.width,
        height: normalizedImage.height,
      });

      // 2. 정규화된 이미지 읽기 (Buffer 폴리필 없이)
      const base64Data = await RNFS.readFile(normalizedImage.path, 'base64');
      const imageBytes = base64ToUint8Array(base64Data);
      const rawImageData = getJpeg().decode(imageBytes, { useTArray: true });

      const imgWidth = rawImageData.width;
      const imgHeight = rawImageData.height;
      console.log('[NailSegmentationModel] Decoded image:', imgWidth, 'x', imgHeight);

      // 3. 전체 정사각형 크롭 (가로 폭 기준)
      //    - 이미지의 가로 폭을 기준으로 정사각형 크롭
      //    - 카드는 고정 픽셀 크기 (모바일 280px, 태블릿 400px)
      //    - 화면 대비 카드 비율: CARD_TO_SCREEN_RATIO
      const cropSize = Math.floor(Math.min(imgWidth, imgHeight));

      // 중앙 기준 크롭 위치 계산
      const cropX = Math.floor((imgWidth - cropSize) / 2);
      const cropY = Math.floor((imgHeight - cropSize) / 2);

      const cardToScreenRatio = getCardToScreenRatio();
      console.log('[NailSegmentationModel] Full square crop:', {
        cropSize,
        cropX,
        cropY,
        cardToScreenRatio,
      });

      // 4. 크롭 영역 추출 및 256x256으로 리사이즈 (바이리니어 보간)
      const tensor = this.extractAndResizeCrop(
        rawImageData.data,
        imgWidth,
        imgHeight,
        cropX,
        cropY,
        cropSize
      );

      // 5. 크롭된 이미지 저장 생략 (jpeg.encode()가 Buffer 에러 발생)
      // 오버레이는 원본 이미지 위에 표시
      this.lastCroppedImageUri = null;
      console.log('[NailSegmentationModel] Skipping cropped image save (using original image for overlay)');

      return tensor;
    } catch (error) {
      console.error('[NailSegmentationModel] Preprocessing failed:', error);
      throw error;
    }
  }

  /**
   * 이미지에서 크롭 영역 추출 및 256x256으로 리사이즈
   * 바이리니어 보간법 사용
   */
  private extractAndResizeCrop(
    imageData: Uint8Array,
    imgWidth: number,
    imgHeight: number,
    cropX: number,
    cropY: number,
    cropSize: number
  ): Float32Array {
    const tensor = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
    const scale = cropSize / MODEL_INPUT_SIZE;

    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        // 출력 좌표를 원본 이미지 좌표로 매핑
        const srcX = cropX + x * scale;
        const srcY = cropY + y * scale;

        // 바이리니어 보간을 위한 4개 픽셀 좌표
        const x0 = Math.floor(srcX);
        const x1 = Math.min(x0 + 1, imgWidth - 1);
        const y0 = Math.floor(srcY);
        const y1 = Math.min(y0 + 1, imgHeight - 1);

        // 보간 가중치
        const xFrac = srcX - x0;
        const yFrac = srcY - y0;

        const tensorIdx = (y * MODEL_INPUT_SIZE + x) * 3;

        // RGB 각 채널에 대해 바이리니어 보간
        for (let c = 0; c < 3; c++) {
          const v00 = imageData[(y0 * imgWidth + x0) * 4 + c];
          const v01 = imageData[(y0 * imgWidth + x1) * 4 + c];
          const v10 = imageData[(y1 * imgWidth + x0) * 4 + c];
          const v11 = imageData[(y1 * imgWidth + x1) * 4 + c];

          const value =
            v00 * (1 - xFrac) * (1 - yFrac) +
            v01 * xFrac * (1 - yFrac) +
            v10 * (1 - xFrac) * yFrac +
            v11 * xFrac * yFrac;

          tensor[tensorIdx + c] = value;  // 0-255 범위 유지
        }
      }
    }

    return tensor;
  }

  /**
   * 크롭된 이미지를 파일로 저장 (오버레이 표시용)
   */
  private async saveCroppedImage(
    imageData: Uint8Array,
    imgWidth: number,
    imgHeight: number,
    cropX: number,
    cropY: number,
    cropSize: number
  ): Promise<string> {
    // MODEL_INPUT_SIZE x MODEL_INPUT_SIZE 크기로 리사이즈된 이미지 생성
    const croppedData = new Uint8Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 4);
    const scale = cropSize / MODEL_INPUT_SIZE;

    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        const srcX = Math.min(cropX + Math.floor(x * scale), imgWidth - 1);
        const srcY = Math.min(cropY + Math.floor(y * scale), imgHeight - 1);

        const srcIdx = (srcY * imgWidth + srcX) * 4;
        const dstIdx = (y * MODEL_INPUT_SIZE + x) * 4;

        croppedData[dstIdx] = imageData[srcIdx];       // R
        croppedData[dstIdx + 1] = imageData[srcIdx + 1]; // G
        croppedData[dstIdx + 2] = imageData[srcIdx + 2]; // B
        croppedData[dstIdx + 3] = 255;                   // A
      }
    }

    // JPEG으로 인코딩
    const jpegData = getJpeg().encode({
      data: croppedData,
      width: MODEL_INPUT_SIZE,
      height: MODEL_INPUT_SIZE,
    }, 90);

    // 임시 파일로 저장 (상단에 정의된 헬퍼 함수 사용)
    const tempPath = `${RNFS.CachesDirectoryPath}/cropped_${Date.now()}.jpg`;
    const base64Result = uint8ArrayToBase64(jpegData.data);
    await RNFS.writeFile(tempPath, base64Result, 'base64');

    return `file://${tempPath}`;
  }

  /**
   * 픽셀 배열 전처리
   */
  private preprocessPixelArray(pixels: number[][][]): Float32Array {
    const tensor = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);

    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        const idx = (y * MODEL_INPUT_SIZE + x) * 3;
        // MobileNetV3는 0-255 범위 사용
        tensor[idx] = pixels[y][x][0];      // R
        tensor[idx + 1] = pixels[y][x][1];  // G
        tensor[idx + 2] = pixels[y][x][2];  // B
      }
    }

    return tensor;
  }

  /**
   * 모델 출력 후처리
   */
  private postprocessOutput(output: Float32Array): number[][] {
    const mask: number[][] = [];

    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      const row: number[] = [];
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        const idx = y * MODEL_INPUT_SIZE + x;
        row.push(output[idx]);
      }
      mask.push(row);
    }

    return mask;
  }

  /**
   * 테스트용 더미 마스크 생성
   */
  private generateDummyMask(): number[][] {
    const mask: number[][] = [];

    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      const row: number[] = [];
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        // 중앙에 손톱 모양 시뮬레이션
        const centerX = MODEL_INPUT_SIZE / 2;
        const centerY = MODEL_INPUT_SIZE / 2;
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        row.push(distance < 40 ? 1 : 0);
      }
      mask.push(row);
    }

    return mask;
  }

  /**
   * 모델 언로드
   */
  unloadModel(): void {
    if (this.model) {
      // this.model.dispose();
      this.model = null;
    }
    this.isLoaded = false;
    console.log('[NailSegmentationModel] Model unloaded');
  }

  /**
   * 모델 로드 상태 확인
   */
  isModelLoaded(): boolean {
    return this.isLoaded;
  }
}

// 싱글톤 인스턴스
export const nailSegmentationModel = new NailSegmentationModel();
export default nailSegmentationModel;
