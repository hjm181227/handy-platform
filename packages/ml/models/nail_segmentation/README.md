# Nail Segmentation Models

손톱 세그멘테이션 모델 저장소입니다.

## 현재 버전

### v2.0.0 (Kaggle ResNet101)

- **Architecture**: DeepLabV3+ with ResNet101 encoder
- **Input Size**: 640x640
- **Dataset**: vpapenko/nail-segmentation-dataset
- **Expected IoU**: ~0.85

## 모델 다운로드

### Kaggle에서 학습된 모델 배치

1. Kaggle Notebook 출력에서 `best_model.pth` 다운로드
2. 다음 경로에 복사:
   ```
   packages/ml/models/nail_segmentation/v2.0.0/best_model.pth
   ```

### 모델 파일 구조

```
v2.0.0/
├── best_model.pth    # 학습된 PyTorch 모델 (~170MB) - Kaggle에서 다운로드
├── config.yaml       # 모델 설정
└── metadata.json     # 메타데이터
```

## 서버 실행

### 1. 가상환경 설정

```bash
cd packages/ml

# 가상환경 생성 (최초 1회)
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 서버 시작

```bash
# 스크립트 사용
./scripts/start_server.sh

# 또는 직접 실행
source venv/bin/activate
uvicorn inference.server:app --host 0.0.0.0 --port 8000 --reload
```

### 3. 서버 테스트

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "model_loaded": true,
#   "model_path": "models/nail_segmentation/v2.0.0/best_model.pth",
#   "encoder": "resnet101",
#   "input_size": 640
# }
```

## API 엔드포인트

### GET /health
서버 및 모델 상태 확인

### POST /api/segment
이미지 세그멘테이션 수행

```bash
curl -X POST http://localhost:8000/api/segment \
  -F "image=@test_image.jpg"
```

### POST /api/measure
손톱 측정 (세그멘테이션 + mm 변환)

```bash
curl -X POST "http://localhost:8000/api/measure?card_width_pixels=280&is_thumb_only=true" \
  -F "image=@test_image.jpg"
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NAIL_SEG_MODEL_PATH` | `models/nail_segmentation/v2.0.0/best_model.pth` | 모델 파일 경로 |
| `NAIL_SEG_CONFIG_PATH` | `models/nail_segmentation/v2.0.0/config.yaml` | 설정 파일 경로 |

## 모바일 앱 연동

### 개발 환경

iOS 시뮬레이터:
- URL: `http://localhost:8000`

Android 에뮬레이터:
- URL: `http://10.0.2.2:8000` (에뮬레이터)
- URL: `http://<호스트IP>:8000` (실제 디바이스)

### 프로덕션 환경

EC2 서버 배포 후:
- URL: `http://15.165.5.64:8000`

## 버전 히스토리

| 버전 | 날짜 | 설명 |
|------|------|------|
| v2.0.0 | 2026-01-31 | Kaggle ResNet101 (640x640) |
| v1.0.0 | 2026-01-29 | MobileNetV2 (256x256) |

## 문제 해결

### 모델 파일을 찾을 수 없음

```
❌ Model file not found: models/nail_segmentation/v2.0.0/best_model.pth
```

**해결**: Kaggle에서 학습 완료 후 `best_model.pth`를 다운로드하여 해당 경로에 배치

### CUDA 메모리 부족

```
RuntimeError: CUDA out of memory
```

**해결**: CPU 모드로 실행 (자동 감지됨) 또는 배치 사이즈 줄이기

### 서버 포트 충돌

```
Address already in use
```

**해결**: 기존 프로세스 종료 후 재시작
```bash
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```
