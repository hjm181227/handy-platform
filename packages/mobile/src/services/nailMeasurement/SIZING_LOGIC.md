# 손톱 사이즈 측정 로직 정리

## 개요

손톱 크기를 mm 단위로 측정하는 전체 파이프라인을 정리합니다.

---

## 파일 구조

```
packages/mobile/src/
├── screens/NailMeasurement/
│   ├── AIMeasurementScreen.tsx    # 측정 UI + 카드 폭 계산
│   └── CameraScreen.tsx           # 촬영 UI
├── services/nailMeasurement/
│   ├── types.ts                   # 상수 정의 (MODEL_INPUT_SIZE 등)
│   ├── NailMeasurementService.ts  # 측정 서비스 (서버 API 호출)
│   ├── NailSegmentationAPI.ts     # 서버 API 클라이언트
│   └── imageProcessor.ts          # 마스크 처리 + mm 변환
└── components/
    └── CameraGuideOverlay.tsx     # 카드 가이드 UI

packages/ml/inference/
└── server.py                      # 세그멘테이션 서버
```

---

## 측정 흐름

### 1. 촬영 단계 (CameraScreen)

사용자가 신용카드와 손톱을 화면의 가이드에 맞춰 촬영합니다.

### 2. 서버 처리 (server.py)

```python
def preprocess_image(self, image: np.ndarray):
    # 1. 원본 이미지 (예: 3024x4032)
    h, w = image.shape[:2]

    # 2. 중앙 정사각형 크롭 (3024x3024)
    crop_size = min(h, w)
    start_x = (w - crop_size) // 2
    start_y = (h - crop_size) // 2
    image = image[start_y:start_y+crop_size, start_x:start_x+crop_size]

    # 3. 640x640으로 리사이즈
    image = cv2.resize(image, (640, 640))

    return image
```

서버는 640x640 마스크를 반환합니다.

### 3. 카드 폭 계산 (AIMeasurementScreen.tsx)

**핵심: 센서 가로세로비 기반 계산**

```typescript
// 상수
const CAMERA_SENSOR_ASPECT_RATIO = 3 / 4;  // 대부분의 스마트폰 카메라
const MODEL_INPUT_SIZE = 640;
const CARD_GUIDE_WIDTH_MOBILE = 280;  // 화면에 표시되는 가이드 폭

// 계산
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 카메라 프리뷰가 "cover" 모드로 화면 높이에 맞춰 확대될 때,
// 실제 보이는 프리뷰 폭 = 화면 높이 * 센서 가로세로비
const actualPreviewWidth = SCREEN_HEIGHT * CAMERA_SENSOR_ASPECT_RATIO;
// 예: 800 * 0.75 = 600px

// 카드가 프리뷰에서 차지하는 비율
const cardToPreviewRatio = cardGuideWidth / actualPreviewWidth;
// 예: 280 / 600 = 0.467

// 모델 공간(640x640)에서의 카드 폭
const estimatedCardWidth = MODEL_INPUT_SIZE * cardToPreviewRatio;
// 예: 640 * 0.467 = 299px
```

### 4. 손톱 폭 계산 (imageProcessor.ts)

```typescript
function calculateNailWidth(mask: number[][], region: NailRegion): number {
  const { boundingBox } = region;
  let maxWidth = 0;

  // 바운딩박스 내에서 각 행의 최대 폭 계산
  for (let y = boundingBox.y; y < boundingBox.y + boundingBox.height; y++) {
    let leftEdge = -1;
    let rightEdge = -1;

    for (let x = boundingBox.x; x < boundingBox.x + boundingBox.width; x++) {
      if (mask[y][x] >= SEGMENTATION_THRESHOLD) {  // 0.5
        if (leftEdge === -1) leftEdge = x;
        rightEdge = x;
      }
    }

    if (leftEdge !== -1 && rightEdge !== -1) {
      const width = rightEdge - leftEdge + 1;
      maxWidth = Math.max(maxWidth, width);
    }
  }

  return maxWidth;  // 픽셀 단위 (640 공간)
}
```

### 5. mm 변환 (imageProcessor.ts)

```typescript
// 픽셀-mm 비율 계산
const pixelToMmRatio = CREDIT_CARD_WIDTH_MM / cardWidthPixels;
// 예: 85.6 / 299 = 0.286 mm/px

// mm 변환
const widthMm = nailWidthPixels * pixelToMmRatio;
// 예: 42 * 0.286 = 12.0mm
```

---

## 계산 예시

### 입력 조건
- 화면: 360x800 (일반 모바일)
- 카드 가이드: 280px
- 센서 비율: 3:4

### 계산 과정

| 단계 | 계산 | 결과 |
|------|------|------|
| 실제 프리뷰 폭 | 800 * 0.75 | 600px |
| 카드-프리뷰 비율 | 280 / 600 | 0.467 |
| 모델 내 카드 폭 | 640 * 0.467 | 299px |
| pixel-to-mm | 85.6 / 299 | 0.286 mm/px |
| 손톱 폭 (마스크) | - | 42px |
| 손톱 폭 (mm) | 42 * 0.286 | 12.0mm |

---

## 이전 방식 vs 현재 방식

### 이전 방식 (잘못됨)
```
프리뷰 폭 = 화면 폭 = 360px
카드 비율 = 280 / 360 = 0.778
모델 내 카드 = 640 * 0.778 = 498px
pixel-to-mm = 85.6 / 498 = 0.172 mm/px
손톱 = 42 * 0.172 = 7.2mm (실제 12mm 대비 -40% 오차)
```

### 현재 방식 (센서 기반)
```
실제 프리뷰 폭 = 화면 높이 * 센서비율 = 800 * 0.75 = 600px
카드 비율 = 280 / 600 = 0.467
모델 내 카드 = 640 * 0.467 = 299px
pixel-to-mm = 85.6 / 299 = 0.286 mm/px
손톱 = 42 * 0.286 = 12.0mm (정확)
```

---

## 주요 상수 (types.ts)

```typescript
// 신용카드 규격 (ISO/IEC 7810)
export const CREDIT_CARD_WIDTH_MM = 85.6;

// 모델 입력 크기
export const MODEL_INPUT_SIZE = 640;

// 카드 가이드 크기
export const CARD_GUIDE_WIDTH_MOBILE = 280;
export const CARD_GUIDE_WIDTH_TABLET = 400;
export const TABLET_BREAKPOINT = 600;

// 카메라 센서 가로세로비
export const CAMERA_SENSOR_ASPECT_RATIO = 3 / 4;
```

---

## 추후 개선 사항

### 1. 원본 좌표계 복원
서버에서 `crop_size`를 반환하면:
- 더 정밀한 스케일 계산 가능
- 서브픽셀 측정과 결합하여 정밀도 향상

### 2. 서브픽셀 측정
마스크의 확률값(0-1)을 가중치로 사용:
```typescript
// 현재: 정수 카운트
width += mask[y][x] >= 0.5 ? 1 : 0;  // 42px

// 개선: 확률 가중치
width += mask[y][x];  // 42.3px
```

### 3. 카드 자동 감지
현재는 카드가 가이드에 정확히 맞춰졌다고 가정.
카드 영역 자동 감지 모델 추가 시 더 정확한 측정 가능.