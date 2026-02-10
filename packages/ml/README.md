# Handy Platform ML

손톱 사이즈 측정을 위한 ML 모델 학습 및 관리 패키지입니다.

## 개요

신용카드 위에 올린 손톱을 감지하여 실제 가로폭(mm)을 측정하는 Object Detection 모델을 학습하고 관리합니다.

### 측정 방식

```
1. 신용카드를 기준 스케일로 사용 (가로 85.6mm)
2. 엄지 촬영: 엄지손톱 1개 감지
3. 4손가락 촬영: 검지/중지/약지/새끼 손톱 4개 동시 감지
4. 신용카드 픽셀 크기로 mm/px 비율 계산
5. 손톱 가로폭을 mm로 변환
```

### 감지 클래스

| ID | Class | Description |
|----|-------|-------------|
| 0 | credit_card | 신용카드 (스케일 기준) |
| 1 | nail_thumb | 엄지 손톱 |
| 2 | nail_index | 검지 손톱 |
| 3 | nail_middle | 중지 손톱 |
| 4 | nail_ring | 약지 손톱 |
| 5 | nail_little | 새끼 손톱 |

## 디렉토리 구조

```
packages/ml/
├── datasets/                    # 데이터셋 관리
│   ├── nail_v1/                # 데이터셋 버전
│   │   ├── images/             # 이미지 파일 (DVC 추적)
│   │   ├── annotations/        # YOLO 형식 라벨
│   │   └── metadata.json       # 데이터셋 메타데이터
│   └── dataset_schema.json     # 메타데이터 스키마
├── training/
│   ├── configs/                # 학습 설정 YAML
│   ├── scripts/                # 학습/평가/내보내기 스크립트
│   └── notebooks/              # 탐색용 Jupyter 노트북
├── models/
│   ├── registry/               # 모델 레지스트리
│   │   └── model_registry.json
│   └── nail_detector/          # 버전별 모델 파일
│       └── v1.0.0/
├── evaluation/
│   ├── test_sets/              # 테스트 데이터
│   └── reports/                # 평가 리포트
├── deployment/                 # OTA 배포 관련
│   ├── ota_manifest_schema.json
│   └── generate_manifest.py
├── requirements.txt            # Python 의존성
└── README.md
```

## 설치

### Python 환경 설정

```bash
cd packages/ml

# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### DVC 설정 (데이터셋 관리)

```bash
# DVC 초기화 (이미 완료됨)
dvc init

# S3 원격 저장소 설정
dvc remote modify s3remote access_key_id YOUR_KEY
dvc remote modify s3remote secret_access_key YOUR_SECRET

# 또는 로컬 저장소 사용 (테스트용)
dvc remote default local
```

## 사용법

### 1. 데이터셋 준비

```bash
# 데이터셋 검증
python training/scripts/validate_dataset.py --dataset datasets/nail_v1/

# DVC로 데이터셋 추적
dvc add datasets/nail_v1/images
dvc push
```

### 2. 모델 학습

```bash
# 학습 시작
python training/scripts/train.py --config training/configs/nail_detector_v1.yaml

# 학습 재개 (중단된 경우)
python training/scripts/train.py \
  --config training/configs/nail_detector_v1.yaml \
  --resume runs/train/exp/weights/last.pt
```

### 3. 모델 평가

```bash
python training/scripts/evaluate.py \
  --model runs/train/exp/weights/best.pt \
  --data runs/train/exp/dataset.yaml \
  --output evaluation/reports/
```

### 4. 모델 내보내기

```bash
# TFLite, CoreML, ONNX로 내보내기
python training/scripts/export.py \
  --model runs/train/exp/weights/best.pt \
  --output models/nail_detector/v1.0.0/
```

### 5. 모델 등록

```bash
python training/scripts/register_model.py \
  --version 1.0.0 \
  --model-dir models/nail_detector/v1.0.0/ \
  --dataset nail_v1 \
  --status staging \
  --metrics evaluation/reports/evaluation_*.json
```

### 6. OTA Manifest 생성

```bash
python deployment/generate_manifest.py \
  --output deployment/manifest.json \
  --cdn-url https://cdn.handy-platform.com/models
```

## 데이터셋 형식

### 이미지 요구사항

- 형식: JPEG, PNG
- 해상도: 최소 640x640 권장
- 내용: 신용카드 위에 손가락을 올린 사진

### 라벨 형식 (YOLO)

```
# annotations/train/image001.txt
0 0.5 0.3 0.4 0.25     # credit_card
1 0.3 0.5 0.08 0.12    # nail_thumb
```

각 줄: `class_id x_center y_center width height` (정규화된 좌표)

## 모델 버전 관리

### 버전 상태

| Status | Description |
|--------|-------------|
| development | 개발/실험 중 |
| staging | QA 테스트 중 |
| production | 프로덕션 배포됨 |
| deprecated | 사용 중단 예정 |

### 버전 규칙

```
Major.Minor.Patch

Major: 모델 아키텍처 변경, 클래스 변경
Minor: 데이터셋 추가, 성능 개선
Patch: 버그 수정, 미세 조정
```

## AWS 비용 참고

### 학습 (g4dn.xlarge)

- 온디맨드: $0.526/시간
- 스팟: ~$0.158/시간 (70% 저렴)

### S3 + CloudFront (MAU 1만 기준)

- 월 ~$5 (모델 OTA 배포)

## 문제 해결

### GPU 메모리 부족

```yaml
# training/configs/nail_detector_v1.yaml
training:
  batch_size: 8  # 16에서 줄임
```

### DVC pull 실패

```bash
# AWS 자격 증명 확인
aws configure list

# 로컬 캐시 사용
dvc remote default local
dvc pull
```

## 참고 문서

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [DVC Documentation](https://dvc.org/doc)
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
