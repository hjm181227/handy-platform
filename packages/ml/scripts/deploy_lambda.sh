#!/bin/bash
#
# AWS Lambda 배포 스크립트
#
# 1. ONNX 모델을 lambda/ 디렉토리로 복사
# 2. Docker 이미지 빌드
# 3. ECR에 푸시
# 4. Lambda 함수 생성/업데이트
#
# 사전 요구사항:
#   - AWS CLI 설정 완료 (aws configure)
#   - Docker 실행 중
#   - ONNX 모델 변환 완료 (export_to_onnx.py 실행)
#
# Usage:
#   ./scripts/deploy_lambda.sh              # 전체 배포
#   ./scripts/deploy_lambda.sh --update     # Lambda 함수만 업데이트 (이미지 푸시 후)
#   ./scripts/deploy_lambda.sh --create     # 최초 생성 (ECR + Lambda + Function URL)

set -euo pipefail

# ============================================
# 설정
# ============================================

REGION="ap-northeast-2"
REPO_NAME="handy-nail-segmentation"
FUNCTION_NAME="handy-nail-segmentation"
MEMORY_SIZE=3008   # MB (ONNX Runtime + OpenCV + 800x800 추론)
TIMEOUT=60         # 초 (cold start ~28s, API Gateway 30s timeout)

# 경로
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ML_DIR="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$ML_DIR/lambda"
MODEL_SRC="$ML_DIR/models/nail_segmentation/v0.0.1/model.onnx"

# AWS 계정 ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo "[Error] AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

echo "============================================"
echo "  Lambda 배포: $FUNCTION_NAME"
echo "  Region: $REGION"
echo "  Account: $ACCOUNT_ID"
echo "  ECR: $ECR_URI"
echo "============================================"

# ============================================
# 1. ONNX 모델 복사
# ============================================

if [ ! -f "$MODEL_SRC" ]; then
    echo "[Error] ONNX model not found: $MODEL_SRC"
    echo "[Error] Run 'python scripts/export_to_onnx.py' first."
    exit 1
fi

echo "[1/5] Copying ONNX model to lambda directory..."
cp "$MODEL_SRC" "$LAMBDA_DIR/model.onnx"
echo "  Model size: $(du -h "$LAMBDA_DIR/model.onnx" | cut -f1)"

# ============================================
# 2. ECR 리포지토리 생성 (없으면)
# ============================================

echo "[2/5] Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name "$REPO_NAME" --region "$REGION" --image-scanning-configuration scanOnPush=true

# ECR 로그인
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# ============================================
# 3. Docker 빌드 & 푸시
# ============================================

echo "[3/5] Building Docker image..."
docker build --platform linux/amd64 -t "$REPO_NAME:latest" "$LAMBDA_DIR"

echo "[3/5] Tagging and pushing to ECR..."
docker tag "$REPO_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"

# ============================================
# 4. Lambda 함수 생성 또는 업데이트
# ============================================

echo "[4/5] Deploying Lambda function..."

# Lambda 실행 역할 확인/생성
ROLE_NAME="lambda-nail-segmentation-role"
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "  Creating IAM role: $ROLE_NAME"
    ROLE_ARN=$(aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }' \
        --query 'Role.Arn' --output text)

    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

    echo "  Waiting for role propagation..."
    sleep 10
fi

# Lambda 함수 생성 또는 업데이트
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null && echo "yes" || echo "no")

if [ "$FUNCTION_EXISTS" = "no" ] || [ "${1:-}" = "--create" ]; then
    echo "  Creating Lambda function: $FUNCTION_NAME"
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --package-type Image \
        --code "ImageUri=$ECR_URI:latest" \
        --role "$ROLE_ARN" \
        --memory-size "$MEMORY_SIZE" \
        --timeout "$TIMEOUT" \
        --region "$REGION" \
        --architectures x86_64
else
    echo "  Updating Lambda function: $FUNCTION_NAME"
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --image-uri "$ECR_URI:latest" \
        --region "$REGION"

    # 업데이트 완료 대기
    echo "  Waiting for update..."
    aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"

    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --memory-size "$MEMORY_SIZE" \
        --timeout "$TIMEOUT" \
        --region "$REGION"
fi

# ============================================
# 5. Function URL 생성 (없으면)
# ============================================

echo "[5/5] Ensuring Function URL exists..."

FUNCTION_URL=$(aws lambda get-function-url-config \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION" \
    --query 'FunctionUrl' --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ] || [ "$FUNCTION_URL" = "None" ]; then
    echo "  Creating Function URL..."
    FUNCTION_URL=$(aws lambda create-function-url-config \
        --function-name "$FUNCTION_NAME" \
        --auth-type NONE \
        --region "$REGION" \
        --query 'FunctionUrl' --output text)

    # 퍼블릭 액세스 허용
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "FunctionURLAllowPublicAccess" \
        --action "lambda:InvokeFunctionUrl" \
        --principal "*" \
        --function-url-auth-type NONE \
        --region "$REGION" 2>/dev/null || true
fi

# ============================================
# 완료
# ============================================

# lambda/ 디렉토리에서 모델 파일 정리
rm -f "$LAMBDA_DIR/model.onnx"

echo ""
echo "============================================"
echo "  배포 완료!"
echo "  Function URL: $FUNCTION_URL"
echo ""
echo "  테스트:"
echo "    curl ${FUNCTION_URL}health"
echo "    curl -X POST '${FUNCTION_URL}api/segment-with-overlay?card_width_pixels=373' \\"
echo "      -F 'image=@test_image.jpg'"
echo "============================================"
