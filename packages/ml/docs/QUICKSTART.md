# 빠른 시작 가이드

## 전체 파이프라인 요약

```
1. 환경 설정
      ↓
2. 데이터 수집 (촬영)
      ↓
3. Label Studio 라벨링
      ↓
4. 데이터셋 준비
      ↓
5. 모델 학습 (AWS)
      ↓
6. 평가 및 내보내기
      ↓
7. 앱 배포
```

---

## Step 1: 환경 설정

### 로컬 환경

```bash
cd packages/ml

# Python 가상환경
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### Label Studio 실행

```bash
# Docker로 실행
docker run -it -p 8080:8080 \
  -v $(pwd)/datasets:/label-studio/datasets \
  -e LABEL_STUDIO_LOCAL_FILES_SERVING_ENABLED=true \
  heartexlabs/label-studio:latest

# 접속: http://localhost:8080
```

### AWS 설정

```bash
# AWS CLI 설정
aws configure
# Access Key ID, Secret Access Key, Region (ap-northeast-2) 입력
```

---

## Step 2: 데이터 수집

### 촬영 가이드

1. **준비물**
   - 신용카드
   - 스마트폰

2. **엄지 촬영** (per 손)
   ```
   - 카드를 평평한 곳에 놓음
   - 엄지를 카드 위에 올림
   - 손톱이 정면을 향하도록
   - 20-30cm 거리에서 촬영
   ```

3. **4손가락 촬영** (per 손)
   ```
   - 검지/중지/약지/새끼를 가지런히 카드 위에
   - 손톱이 위를 향하도록
   - 20-30cm 거리에서 촬영
   ```

4. **파일명 규칙**
   ```
   left_thumb_001.jpg     # 왼손 엄지
   left_four_001.jpg      # 왼손 4손가락
   right_thumb_001.jpg    # 오른손 엄지
   right_four_001.jpg     # 오른손 4손가락
   ```

### 목표 수량

| 종류 | 수량 |
|------|------|
| 엄지 (왼손+오른손) | 500장 |
| 4손가락 (왼손+오른손) | 500장 |
| **합계** | **1,000장** |

---

## Step 3: 이미지 전처리

```bash
# 원본 이미지 처리 (리사이즈, 형식 변환)
python tools/prepare_dataset.py \
  --input raw_images/ \
  --output datasets/nail_v1/ \
  --max-size 1280
```

---

## Step 4: Label Studio 라벨링

### 프로젝트 설정

```bash
# Label Studio API 키 설정
export LABEL_STUDIO_API_KEY="your-api-key"

# 프로젝트 생성
python tools/label_studio_sync.py setup \
  --url http://localhost:8080 \
  --project-name nail-detection-v1
```

### 이미지 업로드

```bash
python tools/label_studio_sync.py upload \
  --url http://localhost:8080 \
  --project-id 1 \
  --images datasets/nail_v1/images/all/
```

### 라벨링 작업

1. http://localhost:8080 접속
2. 프로젝트 선택
3. 단축키 사용:
   - `1`: 신용카드
   - `2`: 엄지
   - `3-6`: 검지~새끼
   - `Ctrl+Enter`: 제출

### 라벨 다운로드

```bash
python tools/label_studio_sync.py download \
  --url http://localhost:8080 \
  --project-id 1 \
  --output datasets/nail_v1/
```

---

## Step 5: 데이터셋 분할

```bash
# train/val/test 분할
python tools/prepare_dataset.py \
  --output datasets/nail_v1/ \
  --split \
  --train-ratio 0.7 \
  --val-ratio 0.2

# 데이터셋 검증
python training/scripts/validate_dataset.py \
  --dataset datasets/nail_v1/
```

---

## Step 6: 모델 학습

### 로컬 학습 (GPU 있는 경우)

```bash
python training/scripts/train.py \
  --config training/configs/nail_detector_v1.yaml
```

### AWS 학습

```bash
# 1. 데이터셋 S3 업로드
dvc push

# 2. EC2 스팟 인스턴스 시작 (g4dn.xlarge)
# AWS 콘솔에서 또는 스크립트로

# 3. EC2에서 학습 실행
ssh -i key.pem ubuntu@EC2_IP
cd handy-platform/packages/ml
source venv/bin/activate
dvc pull
python training/scripts/train.py --config training/configs/nail_detector_v1.yaml
```

---

## Step 7: 평가 및 내보내기

```bash
# 모델 평가
python training/scripts/evaluate.py \
  --model runs/train/nail_v1_*/train/weights/best.pt \
  --data runs/train/nail_v1_*/dataset.yaml \
  --output evaluation/reports/

# 모바일 형식으로 내보내기
python training/scripts/export.py \
  --model runs/train/nail_v1_*/train/weights/best.pt \
  --output models/nail_detector/v1.0.0/

# 모델 등록
python training/scripts/register_model.py \
  --version 1.0.0 \
  --model-dir models/nail_detector/v1.0.0/ \
  --dataset nail_v1 \
  --status staging
```

---

## Step 8: 배포

```bash
# 모델 S3 업로드
aws s3 sync models/nail_detector/v1.0.0/ \
  s3://handy-platform-ml/models/nail_detector/v1.0.0/

# OTA manifest 생성
python deployment/generate_manifest.py \
  --output deployment/manifest.json \
  --cdn-url https://cdn.handy-platform.com/models

# manifest 업로드
aws s3 cp deployment/manifest.json \
  s3://handy-platform-ml/manifests/manifest.json
```

---

## 체크리스트

### 초기 설정
- [ ] Python 가상환경 생성
- [ ] requirements.txt 설치
- [ ] Label Studio 실행
- [ ] AWS CLI 설정

### 데이터 수집
- [ ] 엄지 이미지 500장
- [ ] 4손가락 이미지 500장
- [ ] 다양한 피부톤 포함
- [ ] 다양한 조명 조건

### 라벨링
- [ ] Label Studio 프로젝트 생성
- [ ] 이미지 업로드
- [ ] 라벨링 완료
- [ ] 검수 완료

### 학습
- [ ] 데이터셋 검증 통과
- [ ] 모델 학습 완료
- [ ] mAP@50 > 0.8
- [ ] 모바일 추론 < 50ms

### 배포
- [ ] 모델 내보내기 완료
- [ ] S3 업로드
- [ ] CloudFront 캐시 무효화
- [ ] 앱에서 다운로드 테스트
