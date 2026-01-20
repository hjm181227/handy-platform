# ML Package Guide

## 개요

손톱 감지 ML 모델의 학습, 평가, 배포를 관리하는 패키지입니다.

## 핵심 파일

| 파일 | 용도 |
|------|------|
| `training/scripts/train.py` | YOLOv8 모델 학습 |
| `training/scripts/evaluate.py` | 모델 평가 및 메트릭 |
| `training/scripts/export.py` | TFLite/CoreML 변환 |
| `training/scripts/register_model.py` | 모델 레지스트리 등록 |
| `training/scripts/validate_dataset.py` | 데이터셋 검증 |
| `models/registry/model_registry.json` | 모델 버전 관리 |
| `deployment/generate_manifest.py` | OTA manifest 생성 |

## 주요 명령어

```bash
# 가상환경 활성화
cd packages/ml
source venv/bin/activate

# 데이터셋 검증
python training/scripts/validate_dataset.py --dataset datasets/nail_v1/

# 학습
python training/scripts/train.py --config training/configs/nail_detector_v1.yaml

# 평가
python training/scripts/evaluate.py --model path/to/best.pt --data dataset.yaml

# 내보내기
python training/scripts/export.py --model path/to/best.pt --output models/nail_detector/v1.0.0/

# 등록
python training/scripts/register_model.py --version 1.0.0 --model-dir models/nail_detector/v1.0.0/ --dataset nail_v1 --status staging
```

## 감지 클래스

- 0: credit_card (스케일 기준)
- 1: nail_thumb (엄지)
- 2: nail_index (검지)
- 3: nail_middle (중지)
- 4: nail_ring (약지)
- 5: nail_little (새끼)

## 모델 배포 플로우

```
학습 → 평가 → 내보내기 → 등록(staging) → QA → 등록(production) → OTA manifest 생성 → CDN 업로드
```

## 데이터셋 버저닝 (DVC)

```bash
# 데이터 추가
dvc add datasets/nail_v1/images
git add datasets/nail_v1/images.dvc
git commit -m "Add dataset v1"
dvc push

# 데이터 가져오기
dvc pull
```
