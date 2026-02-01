# ML Package Guide

## 개요

손톱 세그멘테이션 ML 모델의 추론 서버 및 배포를 관리하는 패키지입니다.

> **참고**: 로컬 학습은 지원하지 않습니다. 학습은 Kaggle 또는 Google Colab에서 수행합니다.

## 현재 상태 (2026-01-31)

| 항목 | 값 |
|------|-----|
| 모델 버전 | v2.0.0 |
| 아키텍처 | DeepLabV3+ |
| Encoder | ResNet101 |
| 입력 크기 | 640x640 |
| 학습 플랫폼 | Kaggle |
| 추론 방식 | FastAPI 서버 |

## 디렉토리 구조

```
packages/ml/
├── inference/                      # FastAPI 추론 서버
│   ├── server.py                   # 메인 서버 코드
│   └── __init__.py
├── models/                         # 프로덕션 모델
│   └── nail_segmentation/
│       ├── v2.0.0/                 # 현재 프로덕션 버전
│       │   ├── best_model.pth      # 모델 가중치 (Git 제외)
│       │   ├── config.yaml         # 모델 설정
│       │   └── metadata.json       # 메타데이터
│       └── README.md               # 모델 배치 가이드
├── scripts/
│   └── start_server.sh             # 서버 시작 스크립트
├── docs/
│   ├── MODEL_REPLACEMENT_GUIDE.md  # 모델 교체 가이드
│   └── LABELING_GUIDE.md           # 라벨링 가이드
└── venv/                           # Python 가상환경 (Git 제외)
```

## 빠른 시작

### 1. 서버 시작

```bash
cd packages/ml
./scripts/start_server.sh
```

첫 실행 시 자동으로:
- Python 3.11 가상환경 생성
- 의존성 설치 (PyTorch, FastAPI 등)
- 서버 시작

### 2. 서버 테스트

```bash
# Health check
curl http://localhost:8000/health

# 세그멘테이션
curl -X POST http://localhost:8000/api/segment \
  -F "image=@test_image.jpg"

# 측정 (mm 단위)
curl -X POST "http://localhost:8000/api/measure?card_width_pixels=280" \
  -F "image=@test_image.jpg"
```

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/health` | GET | 서버/모델 상태 확인 |
| `/api/segment` | POST | 이미지 세그멘테이션 (마스크 반환) |
| `/api/measure` | POST | 손톱 측정 (mm 단위) |

### /api/segment 응답 예시

```json
{
  "success": true,
  "mask": [[0.0, 0.1, ...], ...],
  "width": 640,
  "height": 640,
  "processing_time_ms": 1275.07,
  "mask_stats": {
    "min": 0.0,
    "max": 1.0,
    "mean": 0.01,
    "positive_ratio": 1.05
  }
}
```

## 모델 배포 플로우

```
Kaggle 학습 → best_model.pth 다운로드 → models/v2.0.0/에 배치 → 서버 재시작
```

### 새 모델 배포

1. Kaggle에서 모델 학습 완료
2. `best_model.pth` 다운로드
3. 모델 파일 배치:
   ```bash
   cp ~/Downloads/best_model_*.pth \
      packages/ml/models/nail_segmentation/v2.0.0/best_model.pth
   ```
4. 서버 재시작:
   ```bash
   pkill -f uvicorn
   ./scripts/start_server.sh
   ```

## 모바일 앱 연동

모바일 앱은 `NailSegmentationAPI.ts`를 통해 서버와 통신합니다.

### 개발 환경

```typescript
// DEV_HOST_IP를 개발 PC IP로 설정
const DEV_HOST_IP = '172.30.1.80';  // ifconfig로 확인
```

### Android 포트 포워딩

USB 연결 시 필요:
```bash
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
```

## 의존성

주요 패키지 (Python 3.11 필수):

| 패키지 | 버전 | 용도 |
|--------|------|------|
| torch | 2.2.2 | PyTorch |
| torchvision | 0.17.2 | 이미지 처리 |
| segmentation-models-pytorch | 0.5.0 | DeepLabV3+ |
| fastapi | 0.128.0 | API 서버 |
| uvicorn | 0.40.0 | ASGI 서버 |
| opencv-python | 4.9.0.80 | 이미지 처리 |
| numpy | 1.26.4 | 수치 연산 |

## 트러블슈팅

### Python 버전 문제

PyTorch는 Python 3.13을 지원하지 않습니다. Python 3.11 사용:

```bash
/usr/local/bin/python3.11 -m venv venv
```

### NumPy 버전 충돌

```bash
pip install numpy==1.26.4
pip install opencv-python==4.9.0.80
```

### 포트 충돌

```bash
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## 테스트 이미지 가져오기

### Android 실물 디바이스에서 촬영한 이미지 가져오기

앱에서 촬영한 이미지는 앱 캐시에 저장됩니다.

```bash
# 1. 디바이스 연결 확인
adb devices

# 2. 앱 캐시 목록 확인
adb shell "run-as com.handyapp ls -la /data/data/com.handyapp/cache/"

# 3. 최신 이미지 가져오기 (mrousavy*.jpg 파일들)
adb shell "run-as com.handyapp cat /data/data/com.handyapp/cache/mrousavy{파일명}.jpg" > ~/Downloads/nail_app_test/device_cache/image.jpg
```

### 캐시 파일 구조

| 파일 패턴 | 설명 |
|-----------|------|
| `mrousavy*.jpg` | react-native-vision-camera로 촬영한 고해상도 원본 (3024x4032) |
| `*.JPEG` | 리사이즈된 이미지 |

### 테스트 이미지 저장 위치

```
~/Downloads/nail_app_test/
├── device_cache/          # 디바이스에서 가져온 이미지
├── latest_capture.jpg     # 수동 복사한 테스트 이미지
└── visualization_*.png    # 시각화 결과
```

## 참고 문서

- [모델 교체 가이드](docs/MODEL_REPLACEMENT_GUIDE.md)
- [라벨링 가이드](docs/LABELING_GUIDE.md)
- [모델 README](models/nail_segmentation/README.md)
