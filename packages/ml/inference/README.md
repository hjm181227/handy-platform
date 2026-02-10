# Nail Segmentation API Server

FastAPI 기반 손톱 세그멘테이션 추론 서버입니다.

## 개요

- **모델**: DeepLabV3+ with ResNet101 encoder
- **입력 크기**: 800x800 픽셀
- **예상 IoU**: ~0.98 (원본 저장소 기준)
- **프레임워크**: FastAPI + PyTorch

## 빠른 시작

### 1. 의존성 설치

```bash
cd packages/ml
source venv/bin/activate  # 가상환경 활성화
pip install -r requirements.txt
```

### 2. 모델 학습

```bash
python training/scripts/train_segmentation.py \
  --config training/configs/nail_segmentation_deeplabv3.yaml
```

학습된 모델은 `runs/segmentation/resnet101_{timestamp}/best_model.pth`에 저장됩니다.

### 3. 서버 실행

```bash
# 개발 모드 (자동 리로드)
uvicorn inference.server:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uvicorn inference.server:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Docker 사용

```bash
# 빌드
docker build -t nail-segmentation-api -f inference/Dockerfile .

# 실행 (CPU)
docker run -p 8000:8000 -v $(pwd)/runs:/app/runs nail-segmentation-api

# 실행 (GPU)
docker run --gpus all -p 8000:8000 -v $(pwd)/runs:/app/runs nail-segmentation-api
```

## API 엔드포인트

### GET /health

서버 상태 확인

```bash
curl http://localhost:8000/health
```

**응답:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "/app/runs/segmentation/resnet101_latest/best_model.pth",
  "encoder": "resnet101",
  "input_size": 800
}
```

### POST /api/segment

이미지 세그멘테이션 수행

```bash
curl -X POST http://localhost:8000/api/segment \
  -F "image=@nail_photo.jpg"
```

**응답:**
```json
{
  "success": true,
  "mask": [[0.1, 0.2, ...], ...],
  "width": 800,
  "height": 800,
  "processing_time_ms": 150.5,
  "mask_stats": {
    "min": 0.0,
    "max": 0.99,
    "mean": 0.15,
    "positive_ratio": 12.5
  }
}
```

### POST /api/measure

손톱 측정 (mm 단위)

```bash
curl -X POST "http://localhost:8000/api/measure?card_width_pixels=280&is_thumb_only=true&include_mask=false" \
  -F "image=@nail_photo.jpg"
```

**파라미터:**
- `card_width_pixels`: 이미지 내 신용카드 폭 (픽셀)
- `is_thumb_only`: 엄지만 측정 (true) 또는 4손가락 측정 (false)
- `include_mask`: 응답에 마스크 포함 여부

**응답:**
```json
{
  "success": true,
  "measurements": [
    {
      "finger": "thumb",
      "width_mm": 14.5,
      "width_pixels": 120,
      "confidence": 0.9,
      "bounding_box": {"x": 100, "y": 200, "width": 120, "height": 80}
    }
  ],
  "pixel_to_mm_ratio": 0.3057,
  "processing_time_ms": 180.2
}
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NAIL_SEG_MODEL_PATH` | 모델 파일 경로 | `runs/segmentation/resnet101_latest/best_model.pth` |
| `NAIL_SEG_CONFIG_PATH` | 설정 파일 경로 | `training/configs/nail_segmentation_deeplabv3.yaml` |

## 모바일 앱 연동

모바일 앱에서 API 서버를 사용하려면:

```typescript
import { nailMeasurementService } from '@/services/nailMeasurement';

// API 모드로 설정
nailMeasurementService.setInferenceMode('api');

// 또는 자동 모드 (API 실패 시 로컬 폴백)
nailMeasurementService.setInferenceMode('auto');

// 서버 URL 변경 (선택)
nailMeasurementService.setAPIServerUrl('http://your-server:8000');

// 초기화 및 측정
await nailMeasurementService.initialize();
const result = await nailMeasurementService.measureThumb(imageUri, cardWidthPixels);
```

## 배포

### AWS EC2 (권장)

- **인스턴스 타입**: g4dn.xlarge (GPU) 또는 t3.xlarge (CPU)
- **AMI**: Deep Learning AMI (Ubuntu)
- **보안 그룹**: 8000 포트 오픈

### Docker Compose (예시)

```yaml
version: '3.8'
services:
  nail-seg-api:
    build:
      context: .
      dockerfile: inference/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./runs:/app/runs
    environment:
      - NAIL_SEG_MODEL_PATH=/app/runs/segmentation/resnet101_latest/best_model.pth
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 성능 비교

| 항목 | TFLite (모바일) | API (서버) |
|------|-----------------|------------|
| 모델 | MobileNet V2 | ResNet101 |
| 파라미터 | ~3M | ~44M |
| 입력 크기 | 256x256 | 800x800 |
| 예상 IoU | ~0.7 | ~0.98 |
| 추론 시간 | ~100ms | ~150ms + 네트워크 |
| 오프라인 | ✅ 지원 | ❌ 불가 |

## 문제 해결

### 모델 로드 실패

1. 모델 파일 경로 확인
2. `NAIL_SEG_MODEL_PATH` 환경 변수 설정
3. 모델 학습 후 심볼릭 링크 생성:
   ```bash
   ln -s runs/segmentation/resnet101_20240101_120000 runs/segmentation/resnet101_latest
   ```

### GPU 미감지

1. CUDA 설치 확인: `nvidia-smi`
2. PyTorch GPU 빌드 확인: `python -c "import torch; print(torch.cuda.is_available())"`

### 메모리 부족

- batch_size 줄이기 (설정 파일)
- 입력 크기 줄이기 (512 또는 256)
