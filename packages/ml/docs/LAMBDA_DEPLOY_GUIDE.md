# Lambda 배포 가이드

손톱 세그멘테이션 모델을 AWS Lambda에 배포하는 절차입니다.

## 아키텍처

```
모바일 앱 → API Gateway (HTTP API, 30s timeout)
              → Lambda (Docker, x86_64, 3GB, 60s timeout)
                 → ONNX Runtime 추론
```

| 항목 | 값 |
|------|-----|
| Runtime | Python 3.11 (Docker) |
| Architecture | x86_64 (ARM64는 onnxruntime 호환 문제) |
| Memory | 3008 MB |
| Timeout | 60초 |
| Cold start | ~28초 (모델 174MB 로드) |
| Warm start 추론 | ~2.5초 |
| 모델 형식 | ONNX (DeepLabV3+ ResNet101, 800x800) |

## 사전 요구사항

```bash
# 1. AWS CLI 설정
aws configure
# Region: ap-northeast-2
# Output: json

# 2. Docker Desktop 실행 중인지 확인
docker info

# 3. PyTorch 환경 (ONNX 변환용 — 배포만 할 때는 불필요)
cd packages/ml
source venv/bin/activate
```

## 배포 절차

### 1단계: 모델 준비

새 모델을 학습했으면 `.pth` → `.onnx` 변환이 필요합니다.

```bash
cd packages/ml

# .pth 파일을 모델 디렉토리에 배치
cp ~/Downloads/best_model.pth models/nail_segmentation/v0.0.1/best_model.pth

# ONNX 변환 (PyTorch 환경 필요)
source venv/bin/activate
python scripts/export_to_onnx.py --verify

# 결과: models/nail_segmentation/v0.0.1/model.onnx (약 174MB)
```

handler.py만 수정한 경우 (모델 변경 없음) → 이 단계 생략.

### 2단계: 배포

```bash
# 프로젝트 루트에서 실행
bash packages/ml/scripts/deploy_lambda.sh
```

배포 스크립트가 자동으로 수행하는 작업:
1. ONNX 모델을 `lambda/` 디렉토리로 복사
2. Docker 이미지 빌드 (`--platform linux/amd64`)
3. ECR에 푸시
4. Lambda 함수 업데이트 + 완료 대기
5. 빌드에 사용된 모델 파일 정리

소요시간: 약 3~5분 (모델 업로드 포함).

### 3단계: 배포 확인

```bash
# Health check (cold start이면 ~30초 소요)
curl https://qhcy0cjmr5.execute-api.ap-northeast-2.amazonaws.com/health

# 세그멘테이션 테스트
curl -X POST "https://qhcy0cjmr5.execute-api.ap-northeast-2.amazonaws.com/api/segment-with-overlay?card_width_pixels=373" \
  -F "image=@~/Downloads/nail_app_test/rotation_test/latest_capture.jpg" \
  -o /tmp/test_response.json

# 결과 이미지 추출
python3 -c "
import json, base64
resp = json.load(open('/tmp/test_response.json'))
print(f'Success: {resp[\"success\"]}')
print(f'Regions: {len(resp[\"regions\"])}')
print(f'Time: {resp[\"processing_time_ms\"]}ms')
with open('/tmp/test_cropped.png', 'wb') as f:
    f.write(base64.b64decode(resp['cropped_image']))
print('Saved: /tmp/test_cropped.png')
"

# macOS에서 결과 이미지 열기
open /tmp/test_cropped.png
```

## AWS 리소스

| 리소스 | 이름/ARN |
|--------|----------|
| ECR | `867052941055.dkr.ecr.ap-northeast-2.amazonaws.com/handy-nail-segmentation` |
| Lambda | `handy-nail-segmentation` |
| API Gateway | `https://qhcy0cjmr5.execute-api.ap-northeast-2.amazonaws.com` (HTTP API) |
| IAM Role | `lambda-nail-segmentation-role` |

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/health` | GET | 서버/모델 상태 확인 |
| `/api/segment` | POST | 마스크만 반환 |
| `/api/segment-with-overlay` | POST | 크롭 이미지 + 오버레이 + 마스크 + 영역 |
| `/api/measure` | POST | 손톱 측정 (mm 단위) |

## 파일 구조

```
packages/ml/
├── lambda/
│   ├── Dockerfile          # Lambda Docker 이미지 정의
│   ├── handler.py          # Lambda 핸들러 (추론 + API 라우팅)
│   └── requirements.txt    # Python 의존성 (onnxruntime, opencv, numpy)
├── scripts/
│   ├── deploy_lambda.sh    # 배포 자동화 스크립트
│   └── export_to_onnx.py   # PyTorch → ONNX 변환
└── models/
    └── nail_segmentation/
        └── v0.0.1/
            ├── best_model.pth  # PyTorch 가중치 (.gitignore)
            ├── model.onnx      # ONNX 모델 (.gitignore)
            └── config.yaml     # 모델 설정
```

## 주의사항

- **EXIF 자동 처리**: OpenCV 4.8+에서 `cv2.imdecode()`가 EXIF orientation을 자동 적용합니다. 수동 EXIF 회전을 추가하면 이중 회전(180° 뒤집힘) 버그가 발생합니다.
- **x86_64 필수**: onnxruntime 1.16.3은 Lambda ARM64(Graviton2)에서 cpuinfo 파싱 에러로 크래시합니다.
- **Apple Silicon 빌드**: `docker build --platform linux/amd64`을 사용해야 합니다 (deploy_lambda.sh에 포함됨).
- **응답 크기 제한**: Lambda 응답 최대 6MB. 마스크는 base64 PNG grayscale로 인코딩하여 ~20KB.
- **API Gateway 타임아웃**: 30초. Cold start가 ~28초이므로 첫 요청이 타임아웃될 수 있습니다. Warm 상태 유지가 중요합니다.

## 트러블슈팅

### Cold start 타임아웃
API Gateway HTTP API의 최대 타임아웃은 30초입니다. Cold start가 ~28초이므로 간헐적으로 타임아웃이 발생할 수 있습니다.
- 해결: Lambda Provisioned Concurrency 설정 또는 주기적 warmup 호출.

### Function URL 403 Forbidden
이 계정에서 Function URL은 403이 발생합니다. API Gateway HTTP API를 대신 사용합니다 (이미 설정됨).

### Docker 빌드 실패 (platform 관련)
Apple Silicon Mac에서 `exec format error` 발생 시:
```bash
docker build --platform linux/amd64 -t handy-nail-segmentation:latest packages/ml/lambda/
```
