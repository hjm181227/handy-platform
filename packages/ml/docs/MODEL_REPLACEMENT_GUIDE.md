# 손톱 세그멘테이션 모델 교체 가이드

이 문서는 ademakdogan/nails_segmentation 저장소 기반의 DeepLabV3+ 모델로 기존 손톱 세그멘테이션 모델을 교체하는 방법을 설명합니다.

## 아키텍처 개요

### 기반 저장소
- **GitHub**: https://github.com/ademakdogan/nails_segmentation
- **아키텍처**: DeepLabV3+ (segmentation-models-pytorch)
- **Loss Function**: DiceLoss
- **Activation**: Sigmoid (이진 세그멘테이션)

### Encoder 옵션

| Encoder | 파라미터 수 | 모바일 적합성 | 정확도 |
|---------|------------|--------------|--------|
| `mobilenet_v3_large` | ~5M | ⭐⭐⭐ 최적 | 좋음 |
| `efficientnet-b0` | ~5M | ⭐⭐⭐ 좋음 | 좋음 |
| `resnet101` | ~44M | ⭐ 무거움 | 매우 좋음 |

모바일 앱에서는 **mobilenet_v3_large**를 권장합니다.

## 데이터셋 준비

### Kaggle 손톱 세그멘테이션 데이터셋

1. Kaggle에서 데이터셋 다운로드:
   - https://www.kaggle.com/datasets/vpapenko/nails-segmentation

2. 데이터셋 구조:
```
packages/ml/datasets/nail_segmentation/
├── images/
│   ├── train/
│   ├── val/
│   └── test/
└── masks/
    ├── train/
    ├── val/
    └── test/
```

## 모델 학습

### 1. 환경 설정

```bash
cd packages/ml
pip install -r requirements.txt
```

### 2. 학습 실행

**모바일 최적화 모델 (권장)**:
```bash
python training/scripts/train_segmentation.py \
  --config training/configs/nail_segmentation_deeplabv3.yaml
```

**원본 저장소와 동일한 아키텍처 (ResNet101)**:
```bash
python training/scripts/train_segmentation.py \
  --config training/configs/nail_segmentation_deeplabv3.yaml \
  --encoder resnet101
```

### 3. 학습 설정 변경

`training/configs/nail_segmentation_deeplabv3.yaml` 파일에서 설정 변경:

```yaml
model:
  encoder: mobilenet_v3_large  # 또는 resnet101

input:
  size: 256  # 모바일: 256, 고정밀: 512

training:
  epochs: 100
  batch_size: 16
  learning_rate: 0.0001
```

## 모델 변환 (TFLite)

### 1. ONNX 및 TFLite 변환

```bash
python training/scripts/export_segmentation.py \
  --model runs/segmentation/mobilenet_v3_large_*/best_model.pth \
  --config training/configs/nail_segmentation_deeplabv3.yaml \
  --output models/nail_segmentation/v2.0.0/
```

### 2. 출력 파일

```
models/nail_segmentation/v2.0.0/
├── model.pth                    # PyTorch 가중치
├── model.onnx                   # ONNX 형식
├── nail_segmentation.tflite     # TFLite 형식 (모바일용)
├── model_metadata.json          # 모델 메타데이터
└── export_info.json             # 변환 정보
```

## 모바일 앱에 적용

### 1. 모델 파일 교체

**Android**:
```bash
cp models/nail_segmentation/v2.0.0/nail_segmentation.tflite \
   ../mobile/android/app/src/main/assets/nail_segmentation.tflite
```

**iOS**:
```bash
cp models/nail_segmentation/v2.0.0/nail_segmentation.tflite \
   ../mobile/src/assets/models/nail_segmentation.tflite
```

### 2. 앱 빌드

```bash
cd ../mobile

# Android
npm run android:dev

# iOS
cd ios && pod install && cd ..
npm run ios:dev
```

## 모델 입출력 사양

### 입력

- **Shape**: `[1, 256, 256, 3]` (NHWC format)
- **타입**: `float32`
- **범위**: `0-255` (RGB)
- **전처리**: 정사각형 크롭, 바이리니어 리사이즈

### 출력

- **Shape**: `[1, 256, 256, 1]`
- **타입**: `float32`
- **범위**: `0-1` (Sigmoid)
- **후처리**: threshold 0.5로 이진화

## 검증

### TFLite 모델 검증

```python
import tensorflow as tf
import numpy as np

# 모델 로드
interpreter = tf.lite.Interpreter(model_path='nail_segmentation.tflite')
interpreter.allocate_tensors()

# 테스트 입력
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

test_input = np.random.rand(1, 256, 256, 3).astype(np.float32) * 255
interpreter.set_tensor(input_details[0]['index'], test_input)
interpreter.invoke()

output = interpreter.get_tensor(output_details[0]['index'])
print(f"Output shape: {output.shape}")
print(f"Output range: [{output.min():.4f}, {output.max():.4f}]")
```

### 모바일 앱에서 검증

앱 실행 후 콘솔 로그 확인:
```
[Stage 1] Model loaded successfully
[Stage 1] Input shape: [1, 256, 256, 3]
[Stage 1] Output shape: [1, 256, 256, 1]
[Stage 2] Inference: XXX ms
[Stage 2] Mask stats: min=X.XXX, max=X.XXX, mean=X.XXX
```

## 트러블슈팅

### ONNX 변환 실패

```bash
pip install onnx onnx-tf --upgrade
```

### TFLite 변환 실패

```bash
pip install tensorflow>=2.13.0 tf2onnx --upgrade
```

### 모바일에서 모델 로드 실패

1. 파일 경로 확인
2. 파일 크기 확인 (Android assets에 대용량 제한 있음)
3. TFLite 버전 호환성 확인

## 성능 비교

| 지표 | 기존 모델 | 새 모델 (MobileNet) | 새 모델 (ResNet101) |
|------|----------|--------------------|--------------------|
| 추론 시간 | ~500ms | ~500ms | ~2000ms |
| 모델 크기 | ~15MB | ~20MB | ~170MB |
| IoU | 0.85 | 0.87 | 0.92 |

## 참고 자료

- [ademakdogan/nails_segmentation](https://github.com/ademakdogan/nails_segmentation)
- [segmentation-models-pytorch](https://github.com/qubvel/segmentation_models.pytorch)
- [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite)
