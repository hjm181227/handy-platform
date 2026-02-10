# AWS 인프라 설정 가이드

## 개요

ML 파이프라인에 필요한 AWS 서비스 설정 가이드입니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS 인프라 구조                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     S3       │    │     EC2      │    │  CloudFront  │      │
│  │  (데이터셋)   │───→│  (GPU 학습)  │───→│  (모델 CDN)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         ↑                   ↑                   ↓               │
│         │                   │                   │               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     DVC      │    │     IAM      │    │  Mobile App  │      │
│  │  (버전관리)   │    │  (권한관리)   │    │  (모델 다운)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. S3 버킷 설정

### 버킷 생성

```bash
# AWS CLI 설치 확인
aws --version

# 버킷 생성
aws s3 mb s3://handy-platform-ml --region ap-northeast-2
```

### 버킷 구조

```
s3://handy-platform-ml/
├── datasets/               # DVC 데이터셋 저장
│   ├── nail_v1/
│   │   ├── images/
│   │   └── annotations/
│   └── nail_v2/
├── models/                 # 학습된 모델 저장
│   └── nail_detector/
│       ├── v1.0.0/
│       │   ├── model.tflite
│       │   └── model.mlpackage.zip
│       └── v1.1.0/
├── training-runs/          # 학습 로그 및 체크포인트
│   └── 2024-01-15_exp001/
└── manifests/              # OTA manifest
    └── manifest.json
```

### 버킷 정책 (공개 읽기 - 모델만)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadModels",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::handy-platform-ml/models/*"
    }
  ]
}
```

```bash
# 정책 적용
aws s3api put-bucket-policy \
  --bucket handy-platform-ml \
  --policy file://bucket-policy.json
```

### CORS 설정 (앱에서 직접 다운로드 허용)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

```bash
aws s3api put-bucket-cors \
  --bucket handy-platform-ml \
  --cors-configuration file://cors.json
```

---

## 2. IAM 사용자 및 정책

### ML 학습용 IAM 사용자

```bash
# 사용자 생성
aws iam create-user --user-name handy-ml-training

# 액세스 키 생성
aws iam create-access-key --user-name handy-ml-training
# → AccessKeyId, SecretAccessKey 저장
```

### IAM 정책 생성

```json
{
  "Version": "2012-10-17",
  "PolicyName": "HandyMLTrainingPolicy",
  "Statement": [
    {
      "Sid": "S3DatasetAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::handy-platform-ml",
        "arn:aws:s3:::handy-platform-ml/*"
      ]
    },
    {
      "Sid": "EC2SpotAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:RequestSpotInstances",
        "ec2:CancelSpotInstanceRequests",
        "ec2:DescribeSpotInstanceRequests",
        "ec2:DescribeInstances",
        "ec2:TerminateInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

```bash
# 정책 생성
aws iam create-policy \
  --policy-name HandyMLTrainingPolicy \
  --policy-document file://ml-training-policy.json

# 사용자에 정책 연결
aws iam attach-user-policy \
  --user-name handy-ml-training \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/HandyMLTrainingPolicy
```

---

## 3. EC2 GPU 인스턴스 (학습용)

### 인스턴스 사양 비교

| 인스턴스 | GPU | 메모리 | 온디맨드 | 스팟 (예상) |
|----------|-----|--------|----------|-------------|
| g4dn.xlarge | T4 16GB | 16GB | $0.526/h | $0.16/h |
| g4dn.2xlarge | T4 16GB | 32GB | $0.752/h | $0.23/h |
| g5.xlarge | A10G 24GB | 16GB | $1.006/h | $0.30/h |
| p3.2xlarge | V100 16GB | 61GB | $3.06/h | $0.92/h |

**권장: g4dn.xlarge (스팟)**

### AMI 선택

```
AWS Deep Learning AMI (Ubuntu 22.04)
- CUDA 12.x 사전 설치
- PyTorch, TensorFlow 포함
- AMI ID: ami-xxxxxxxxx (리전별 상이)
```

### 스팟 인스턴스 시작 스크립트

```bash
#!/bin/bash
# launch-spot-training.sh

INSTANCE_TYPE="g4dn.xlarge"
AMI_ID="ami-0c55b159cbfafe1f0"  # Deep Learning AMI (리전에 맞게 수정)
KEY_NAME="handy-ml-key"
SECURITY_GROUP="sg-xxxxxxxxx"
SUBNET_ID="subnet-xxxxxxxxx"

# 스팟 인스턴스 요청
aws ec2 request-spot-instances \
  --spot-price "0.20" \
  --instance-count 1 \
  --type "one-time" \
  --launch-specification '{
    "ImageId": "'$AMI_ID'",
    "InstanceType": "'$INSTANCE_TYPE'",
    "KeyName": "'$KEY_NAME'",
    "SecurityGroupIds": ["'$SECURITY_GROUP'"],
    "SubnetId": "'$SUBNET_ID'",
    "BlockDeviceMappings": [
      {
        "DeviceName": "/dev/sda1",
        "Ebs": {
          "VolumeSize": 100,
          "VolumeType": "gp3"
        }
      }
    ]
  }'
```

### 보안 그룹 설정

```bash
# 보안 그룹 생성
aws ec2 create-security-group \
  --group-name handy-ml-sg \
  --description "Security group for ML training"

# SSH 허용
aws ec2 authorize-security-group-ingress \
  --group-name handy-ml-sg \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32
```

### 학습 환경 설정 스크립트

```bash
#!/bin/bash
# setup-training-env.sh (EC2 인스턴스에서 실행)

# 1. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 2. 프로젝트 클론
git clone https://github.com/your-org/handy-platform.git
cd handy-platform/packages/ml

# 3. Python 환경 설정
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. AWS 자격 증명 설정
aws configure
# Access Key ID, Secret Access Key, Region 입력

# 5. DVC 원격 저장소 설정
dvc remote modify s3remote access_key_id YOUR_KEY
dvc remote modify s3remote secret_access_key YOUR_SECRET

# 6. 데이터셋 다운로드
dvc pull

# 7. 학습 시작
python training/scripts/train.py --config training/configs/nail_detector_v1.yaml
```

---

## 4. CloudFront CDN 설정

### 배포 생성

```bash
# CloudFront 배포 생성
aws cloudfront create-distribution \
  --origin-domain-name handy-platform-ml.s3.ap-northeast-2.amazonaws.com \
  --default-root-object manifest.json
```

### CloudFront 설정

```json
{
  "Origins": {
    "Items": [
      {
        "DomainName": "handy-platform-ml.s3.ap-northeast-2.amazonaws.com",
        "Id": "S3-handy-platform-ml",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-handy-platform-ml",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "PriceClass": "PriceClass_200",
  "Enabled": true
}
```

### 커스텀 도메인 설정 (선택)

```
1. Route 53에서 도메인 생성 또는 기존 도메인 사용
2. ACM에서 SSL 인증서 발급 (us-east-1 리전)
3. CloudFront 배포에 대체 도메인 추가
4. Route 53에 CNAME 또는 A 레코드 추가
```

결과 URL:
- S3 직접: `https://handy-platform-ml.s3.ap-northeast-2.amazonaws.com/models/...`
- CloudFront: `https://d1234567890.cloudfront.net/models/...`
- 커스텀: `https://cdn.handy-platform.com/models/...`

---

## 5. DVC 원격 저장소 설정

### S3 원격 저장소 구성

```bash
cd packages/ml

# 기본 원격 저장소 설정
dvc remote add -d s3remote s3://handy-platform-ml/datasets
dvc remote modify s3remote region ap-northeast-2

# 자격 증명 설정 (로컬)
dvc remote modify --local s3remote access_key_id YOUR_ACCESS_KEY
dvc remote modify --local s3remote secret_access_key YOUR_SECRET_KEY
```

### .dvc/config 확인

```ini
[core]
    remote = s3remote
    autostage = true

[remote "s3remote"]
    url = s3://handy-platform-ml/datasets
    region = ap-northeast-2
```

### 데이터 업로드/다운로드

```bash
# 데이터셋 추적
dvc add datasets/nail_v1/images
dvc add datasets/nail_v1/annotations

# S3에 업로드
dvc push

# S3에서 다운로드
dvc pull
```

---

## 6. 비용 관리

### 예산 알람 설정

```bash
# 월 $50 예산 알람
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget '{
    "BudgetName": "handy-ml-budget",
    "BudgetLimit": {
      "Amount": "50",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "your-email@example.com"
        }
      ]
    }
  ]'
```

### 스팟 인스턴스 자동 종료

```bash
# 학습 완료 후 자동 종료 (스크립트 끝에 추가)
#!/bin/bash

# 학습 실행
python training/scripts/train.py --config training/configs/nail_detector_v1.yaml

# 결과 업로드
aws s3 sync runs/ s3://handy-platform-ml/training-runs/

# 인스턴스 자동 종료
sudo shutdown -h now
```

### 예상 월간 비용 (MAU 1만 미만)

| 서비스 | 사용량 | 월 비용 |
|--------|--------|---------|
| S3 저장 | 10GB | $0.23 |
| S3 요청 | 10,000회 | $0.04 |
| CloudFront 전송 | 10GB | $0.85 |
| EC2 스팟 (g4dn.xlarge) | 10시간 | $1.60 |
| **합계** | | **~$3** |

---

## 7. 자동화 스크립트

### 전체 학습 파이프라인

```bash
#!/bin/bash
# run-training-pipeline.sh

set -e

echo "=== 학습 파이프라인 시작 ==="

# 1. 스팟 인스턴스 시작
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type g4dn.xlarge \
  --key-name handy-ml-key \
  --instance-market-options '{"MarketType":"spot"}' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "인스턴스 시작: $INSTANCE_ID"

# 2. 인스턴스 준비 대기
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# 3. 퍼블릭 IP 확인
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "인스턴스 IP: $PUBLIC_IP"

# 4. 학습 스크립트 전송 및 실행
ssh -i ~/.ssh/handy-ml-key.pem ubuntu@$PUBLIC_IP << 'EOF'
  cd ~/handy-platform/packages/ml
  source venv/bin/activate
  dvc pull
  python training/scripts/train.py --config training/configs/nail_detector_v1.yaml
  aws s3 sync runs/ s3://handy-platform-ml/training-runs/
  sudo shutdown -h now
EOF

echo "=== 학습 완료 ==="
```

---

## 체크리스트

### 초기 설정

- [ ] AWS 계정 생성
- [ ] IAM 사용자 생성 (handy-ml-training)
- [ ] S3 버킷 생성 (handy-platform-ml)
- [ ] 버킷 정책 및 CORS 설정
- [ ] EC2 키 페어 생성
- [ ] 보안 그룹 생성
- [ ] CloudFront 배포 생성
- [ ] 예산 알람 설정

### 학습 실행 전

- [ ] DVC 원격 저장소 설정
- [ ] 데이터셋 S3 업로드 완료
- [ ] EC2 인스턴스 AMI 확인
- [ ] 스팟 가격 확인

### 학습 완료 후

- [ ] 학습 결과 S3 업로드 확인
- [ ] 모델 내보내기 완료
- [ ] CloudFront에서 모델 접근 확인
- [ ] 스팟 인스턴스 종료 확인
