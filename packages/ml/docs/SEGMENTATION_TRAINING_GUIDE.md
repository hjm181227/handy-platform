# 손톱 세그멘테이션 모델 학습 가이드

이 문서는 손톱 세그멘테이션 모델에 새 이미지를 추가하고 재학습하는 방법을 설명합니다.

## 개요

| 항목 | 값 |
|------|-----|
| 모델 아키텍처 | DeepLabV3Plus (MobileNetV3Large encoder) |
| 손실 함수 | Focal Tversky Loss |
| 입력 크기 | 256 x 256 x 3 (RGB, 0-255 범위) |
| 출력 크기 | 256 x 256 x 1 (마스크) |
| 출력 형식 | TFLite (Android), CoreML (iOS) |

## 전제 조건

```bash
# 1. ML 패키지 디렉토리로 이동
cd packages/ml

# 2. 가상환경 활성화
source venv/bin/activate

# 3. 필요한 패키지 설치 확인
pip install tensorflow pillow pyyaml numpy
```

## 워크플로우

```
이미지 추가 → 라벨링 → 학습 → 평가 → 내보내기 → 앱 배포
```

---

## 1단계: 이미지 추가

### 디렉토리 구조

**권장 (PNG 마스크 사용):**
```
datasets/nail_v1/
├── train/
│   ├── images/     # 학습 이미지 (80%)
│   └── masks/      # PNG 마스크 파일 (권장)
├── val/
│   ├── images/     # 검증 이미지 (10%)
│   └── masks/
└── test/
    ├── images/     # 테스트 이미지 (10%)
    └── masks/
```

**대안 (YOLO 라벨 사용 - 정확도 낮음):**
```
datasets/nail_v1/
├── train/
│   ├── images/
│   └── labels/     # YOLO 형식 라벨 (.txt)
├── val/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

> **참고**: PNG 마스크가 있으면 자동으로 사용하고, 없으면 YOLO 라벨을 마스크로 변환합니다.

### 이미지 추가 방법

```bash
# 1. 새 이미지를 train/images에 복사
cp /path/to/new_thumb_image.jpg datasets/nail_v1/train/images/

# 2. 여러 이미지 한번에 추가
cp /path/to/thumb_images/*.jpg datasets/nail_v1/train/images/
```

### 이미지 명명 규칙

- 형식: `{type}_{id}.jpg` 또는 `{type}_{id}.png`
- 예시:
  - `thumb_001.jpg` - 엄지 이미지
  - `four_fingers_042.jpg` - 4손가락 이미지
  - `nail_mix_103.jpg` - 혼합 이미지

---

## 2단계: 라벨링

### YOLO 라벨 형식

각 이미지에 대응하는 `.txt` 파일을 생성합니다.

```
# 형식: class_id x_center y_center width height
# 모든 값은 0-1 사이로 정규화

# 예시 (thumb_001.txt):
1 0.5 0.6 0.15 0.25
```

### 클래스 ID

| ID | 클래스 | 설명 |
|----|--------|------|
| 0 | credit_card | 신용카드 (기준 크기) |
| 1 | nail_thumb | 엄지 손톱 |
| 2 | nail_index | 검지 손톱 |
| 3 | nail_middle | 중지 손톱 |
| 4 | nail_ring | 약지 손톱 |
| 5 | nail_little | 새끼 손톱 |

### 라벨링 도구 (Label Studio 권장)

```bash
# Label Studio 설치
pip install label-studio

# 실행
label-studio

# 브라우저에서 http://localhost:8080 접속
```

### Label Studio 프로젝트 설정 (세그멘테이션용)

1. **새 프로젝트 생성**
2. **Labeling Setup** → "Semantic Segmentation with Polygons" 또는 "Image Segmentation" 선택
3. **아래 XML 템플릿 사용**:

```xml
<View>
  <Image name="image" value="$image" zoom="true"/>
  <PolygonLabels name="label" toName="image" strokeWidth="2" pointSize="small">
    <Label value="nail" background="#FF6B6B"/>
  </PolygonLabels>
  <BrushLabels name="brush" toName="image">
    <Label value="nail" background="#FF6B6B"/>
  </BrushLabels>
</View>
```

> **참고**: 폴리곤 또는 브러시로 손톱 영역을 정밀하게 라벨링합니다.

### PNG 마스크 생성

Label Studio에서 내보내기:
1. **Export** → **COCO** 또는 **PNG masks** 형식 선택
2. 마스크 파일을 `datasets/nail_v1/train/masks/`에 복사

또는 Python으로 변환:
```python
# 폴리곤을 PNG 마스크로 변환
from PIL import Image, ImageDraw
import numpy as np

def polygon_to_mask(polygon_points, image_size):
    mask = Image.new('L', image_size, 0)
    ImageDraw.Draw(mask).polygon(polygon_points, fill=255)
    return np.array(mask)
```

### YOLO 형식으로 내보내기

Label Studio에서:
1. **Export** 클릭
2. **YOLO** 형식 선택
3. 다운로드된 파일을 `datasets/nail_v1/train/labels/`에 복사

### 수동 라벨 생성 (간단한 경우)

```python
# 이미지 크기: 1920x1080
# 손톱 바운딩박스: (800, 400) - (1000, 600)

# 계산:
x_center = (800 + 1000) / 2 / 1920 = 0.469
y_center = (400 + 600) / 2 / 1080 = 0.463
width = (1000 - 800) / 1920 = 0.104
height = (600 - 400) / 1080 = 0.185

# thumb_001.txt 내용:
# 1 0.469 0.463 0.104 0.185
```

---

## 3단계: 학습

### 학습 실행

```bash
cd packages/ml

# 가상환경 활성화
source venv/bin/activate

# 학습 시작
python training/scripts/train_segmentation.py \
    --config training/configs/nail_segmentation_v1.yaml \
    --output-dir runs/segment
```

### 학습 설정 조정

`training/configs/nail_segmentation_v1.yaml` 수정:

```yaml
training:
  epochs: 100        # 에포크 수 (더 많은 데이터 → 더 많은 에포크)
  batch_size: 16     # 배치 크기 (GPU 메모리에 따라 조정)
  learning_rate: 0.001
```

### 학습 모니터링

```bash
# 학습 로그 확인
tail -f runs/segment/train_YYYYMMDD_HHMMSS/training.log

# TensorBoard 사용 (선택)
tensorboard --logdir runs/segment
```

### 학습 결과

```
runs/segment/train_YYYYMMDD_HHMMSS/
├── best_model.keras    # 최고 성능 모델
├── last_model.keras    # 마지막 에포크 모델
├── config.yaml         # 사용된 설정
├── history.json        # 학습 히스토리
└── final_metrics.json  # 최종 평가 메트릭
```

---

## 4단계: 평가

### 메트릭 확인

```bash
# 최종 메트릭 확인
cat runs/segment/train_xxx/final_metrics.json
```

**주요 메트릭:**
- **Dice Coefficient**: 0.8 이상 권장
- **IoU (Intersection over Union)**: 0.7 이상 권장
- **Accuracy**: 0.95 이상 권장

### 시각적 검증

```python
# 추론 결과 시각화
python tools/visualize_segmentation.py \
    --model runs/segment/train_xxx/best_model.keras \
    --image /path/to/test_image.jpg \
    --output /path/to/result.png
```

---

## 5단계: 모델 내보내기

### TFLite로 변환

```bash
python training/scripts/export_segmentation.py \
    --model runs/segment/train_xxx/best_model.keras \
    --output models/nail_segmentation/v1.1.0/ \
    --quantization float16
```

### 양자화 옵션

| 옵션 | 모델 크기 | 정확도 | 속도 |
|------|-----------|--------|------|
| none | 크다 | 최고 | 느림 |
| float16 | 중간 | 좋음 | 빠름 |
| int8 | 작다 | 낮음 | 가장 빠름 |

---

## 6단계: 앱 배포

### Android

```bash
# 모델 파일 복사
cp models/nail_segmentation/v1.1.0/nail_segmentation.tflite \
   packages/mobile/android/app/src/main/assets/nail_segmentation.tflite

# src/assets에도 복사 (번들링용)
cp models/nail_segmentation/v1.1.0/nail_segmentation.tflite \
   packages/mobile/src/assets/models/nail_segmentation.tflite
```

### iOS

```bash
# CoreML 모델 복사
cp models/nail_segmentation/v1.1.0/nail_segmentation.mlmodel \
   packages/mobile/ios/nail_segmentation.mlmodel
```

### 앱 재빌드

```bash
cd packages/mobile

# Android
cd android && ./gradlew assembleDebug

# iOS (macOS)
cd ios && pod install && npx react-native run-ios
```

---

## 빠른 시작 예제

### 엄지 이미지 10장 추가 후 재학습

```bash
cd packages/ml
source venv/bin/activate

# 1. 이미지 추가
cp ~/Downloads/thumb_images/*.jpg datasets/nail_v1/train/images/

# 2. 라벨 추가 (미리 준비된 YOLO 라벨)
cp ~/Downloads/thumb_labels/*.txt datasets/nail_v1/train/labels/

# 3. 학습 (30 에포크로 빠르게 테스트)
python training/scripts/train_segmentation.py \
    --config training/configs/nail_segmentation_v1.yaml \
    --output-dir runs/segment

# 4. 내보내기
python training/scripts/export_segmentation.py \
    --model runs/segment/train_*/best_model.keras \
    --output models/nail_segmentation/v1.1.0/

# 5. 앱에 배포
cp models/nail_segmentation/v1.1.0/nail_segmentation.tflite \
   ../mobile/android/app/src/main/assets/
cp models/nail_segmentation/v1.1.0/nail_segmentation.tflite \
   ../mobile/src/assets/models/
```

---

## 문제 해결

### 메모리 부족

```yaml
# config 파일에서 batch_size 줄이기
training:
  batch_size: 8  # 16 → 8
```

### 학습이 수렴하지 않음

1. 학습률 조정: `learning_rate: 0.0005` (0.001 → 0.0005)
2. 에포크 증가: `epochs: 150`
3. 데이터 증강 강화

### TFLite 변환 오류

```bash
# TensorFlow 버전 확인
pip show tensorflow

# 호환 버전 설치
pip install tensorflow==2.15.0
```

---

## 고급: 모델 파인튜닝 (성능 개선)

기존 모델의 성능을 개선하기 위해 새 이미지를 추가하고 파인튜닝하는 워크플로우입니다.

### 파인튜닝 워크플로우

```
기존 모델 → Pseudo-mask 생성 → 수동 검토/보정 → 파인튜닝 학습 → 새 모델 배포
```

### Step 1: 폴더 구조 세팅

```bash
cd packages/ml

# 파인튜닝용 데이터셋 폴더 생성
mkdir -p datasets/nail_finetune/train/images
mkdir -p datasets/nail_finetune/train/masks
mkdir -p datasets/nail_finetune/val/images
mkdir -p datasets/nail_finetune/val/masks

# 기존 학습된 모델 복사 (Kaggle에서 다운로드한 경우)
mkdir -p models/trained
cp ~/Downloads/results/best_nail_segmentation_model.keras models/trained/
```

### Step 2: Pseudo-mask 자동 생성

기존 모델을 사용해 새 이미지에 대한 초기 마스크를 자동 생성합니다.

```bash
# 가상환경 활성화
source venv/bin/activate

# 새 이미지를 train/images에 복사
cp /path/to/new_thumb_images/*.jpg datasets/nail_finetune/train/images/

# Pseudo-mask 생성 (오버레이 이미지도 함께)
python tools/generate_pseudo_masks.py \
    --model models/trained/best_nail_segmentation_model.keras \
    --images datasets/nail_finetune/train/images \
    --output datasets/nail_finetune/train/masks \
    --save-overlay
```

**출력:**
- `datasets/nail_finetune/train/masks/*.png` - 마스크 파일
- `datasets/nail_finetune/train/masks/overlays/*.png` - 검토용 오버레이

### Step 3: 마스크 수동 검토 및 보정

1. `masks/overlays/` 폴더에서 오버레이 이미지 확인
2. 잘못된 마스크는 GIMP/Photoshop으로 수정:
   - **흰색(255)** = 손톱 영역
   - **검정색(0)** = 배경
3. 수정된 마스크를 `masks/` 폴더에 저장

### Step 4: 파인튜닝 학습

```bash
# 파인튜닝 설정으로 학습 (기존 가중치에서 시작)
python training/scripts/train_segmentation.py \
    --config training/configs/nail_segmentation_v1.yaml \
    --output-dir runs/segment \
    --resume models/trained/best_nail_segmentation_model.keras
```

**참고:** `--resume` 옵션은 기존 모델의 가중치를 로드하고 이어서 학습합니다.

### Step 5: 새 모델 배포

```bash
# TFLite로 내보내기
python training/scripts/export_segmentation.py \
    --model runs/segment/train_xxx/best_model.keras \
    --output models/nail_segmentation/v1.1.0/

# 앱에 배포
cp models/nail_segmentation/v1.1.0/nail_segmentation.tflite \
   ../mobile/android/app/src/main/assets/
cp models/nail_segmentation/v1.1.0/nail_segmentation.tflite \
   ../mobile/src/assets/models/
```

### 파인튜닝 팁

1. **학습률 낮추기**: 파인튜닝 시에는 학습률을 낮추는 것이 좋습니다
   ```yaml
   training:
     learning_rate: 0.00005  # 기본 0.0001 → 0.00005
   ```

2. **적은 에포크**: 과적합 방지를 위해 에포크 수를 줄입니다
   ```yaml
   training:
     epochs: 20  # 기본 50 → 20
   ```

3. **데이터 비율**: train:val = 8:2 정도로 나눕니다

---

## 참고 자료

- [U-Net 논문](https://arxiv.org/abs/1505.04597)
- [MobileNetV2](https://arxiv.org/abs/1801.04381)
- [TensorFlow Lite 가이드](https://www.tensorflow.org/lite/guide)
- [Label Studio 문서](https://labelstud.io/guide/)
