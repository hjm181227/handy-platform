# 손톱 세그멘테이션 모델 교체 가이드

이 문서는 Kaggle에서 학습한 DeepLabV3+ 모델을 추론 서버에 배포하는 방법을 설명합니다.

## 아키텍처 개요

### 현재 아키텍처 (v2.0.0)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Kaggle/Colab   │     │  Inference      │     │  Mobile App     │
│  (모델 학습)     │ ──▶ │  Server         │ ◀── │  (React Native) │
│                 │     │  (FastAPI)      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      학습                    추론                   API 호출
```

### 기반 저장소
- **아키텍처**: DeepLabV3+ (segmentation-models-pytorch)
- **Encoder**: ResNet101 (고정밀도)
- **Loss Function**: DiceLoss + BCEWithLogitsLoss
- **데이터셋**: vpapenko/nails-segmentation (Kaggle)

### 왜 서버 기반인가?

| 항목 | TFLite (이전) | Server API (현재) |
|------|--------------|------------------|
| 모델 크기 | 20MB (앱에 포함) | 175MB (서버에 배치) |
| Encoder | MobileNet (경량) | ResNet101 (고정밀) |
| 정확도 (IoU) | ~0.75 | ~0.85+ |
| 업데이트 | 앱 재배포 필요 | 서버만 업데이트 |
| 오프라인 | 지원 | 미지원 |

## 모델 학습 (Kaggle)

### 1. Kaggle Notebook 설정

Kaggle에서 새 Notebook을 생성하고 아래 코드를 실행합니다:

```python
# GPU 활성화 필수 (Settings > Accelerator > GPU T4 x2)

!pip install segmentation-models-pytorch albumentations

import torch
import segmentation_models_pytorch as smp

# 모델 생성
model = smp.DeepLabV3Plus(
    encoder_name="resnet101",
    encoder_weights="imagenet",
    classes=1,
    activation="sigmoid",
)

# 학습 코드...
# (전체 코드는 Kaggle Notebook 참조)

# 모델 저장
torch.save(model.state_dict(), "best_model.pth")
```

### 2. 데이터셋

Kaggle 데이터셋 추가:
- **vpapenko/nails-segmentation** (Add Data 버튼)

### 3. 학습 완료 후

Output에서 `best_model.pth` 다운로드

## 모델 배포

### 1. 모델 파일 배치

```bash
# 다운로드한 모델을 배치
cp ~/Downloads/best_model_*.pth \
   packages/ml/models/nail_segmentation/v2.0.0/best_model.pth
```

### 2. 서버 시작

```bash
cd packages/ml
./scripts/start_server.sh
```

### 3. 서버 테스트

```bash
# Health check
curl http://localhost:8000/health

# 세그멘테이션 테스트
curl -X POST http://localhost:8000/api/segment \
  -F "image=@test_image.jpg"
```

## 모델 파일 구조

```
packages/ml/models/nail_segmentation/v2.0.0/
├── best_model.pth    # PyTorch 가중치 (175MB) - Git 제외
├── config.yaml       # 모델 설정
└── metadata.json     # 버전 정보
```

## 모바일 앱 연동

### API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/health` | GET | 서버/모델 상태 확인 |
| `/api/segment` | POST | 이미지 세그멘테이션 |
| `/api/measure` | POST | 손톱 측정 (mm) |

### 개발 환경 설정

```typescript
// packages/mobile/src/services/nailMeasurement/NailSegmentationAPI.ts

const DEV_HOST_IP = '172.30.1.80';  // 개발 PC IP (ifconfig로 확인)

const API_SERVER_URL = __DEV__
  ? Platform.select({
      android: `http://${DEV_HOST_IP}:8000`,
      ios: 'http://localhost:8000',
    })
  : 'http://15.165.5.64:8000';  // 프로덕션 서버
```

### Android 포트 포워딩 (USB 연결 시)

```bash
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
```

## 모델 입출력 사양

### 입력

- **Shape**: `[1, 3, 640, 640]` (NCHW format)
- **타입**: `float32`
- **전처리**: ImageNet normalization
  - mean: [0.485, 0.456, 0.406]
  - std: [0.229, 0.224, 0.225]

### 출력

- **Shape**: `[1, 640, 640]`
- **타입**: `float32`
- **범위**: `0-1` (Sigmoid)
- **후처리**: threshold 0.5로 이진화

## 버전 히스토리

| 버전 | 날짜 | Encoder | Input | IoU |
|------|------|---------|-------|-----|
| v2.0.0 | 2026-01-31 | ResNet101 | 640x640 | ~0.85 |
| v1.0.0 | 2026-01-29 | MobileNetV2 | 256x256 | ~0.75 |

## 트러블슈팅

### 서버 시작 실패

```bash
# Python 3.11 필요 (PyTorch 호환성)
/usr/local/bin/python3.11 -m venv venv

# 패키지 재설치
rm -rf venv
./scripts/start_server.sh
```

### 모바일에서 연결 실패

1. 서버 IP 확인: `ifconfig | grep "inet "`
2. 방화벽 확인: 포트 8000 허용
3. 포트 포워딩: `adb reverse tcp:8000 tcp:8000`

### NumPy 버전 충돌

```bash
# numpy 1.26.x 사용 필요
pip install numpy==1.26.4
pip install opencv-python==4.9.0.80
```

## 참고 자료

- [segmentation-models-pytorch](https://github.com/qubvel/segmentation_models.pytorch)
- [vpapenko/nails-segmentation](https://www.kaggle.com/datasets/vpapenko/nails-segmentation)
- [FastAPI](https://fastapi.tiangolo.com/)
