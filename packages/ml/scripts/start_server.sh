#!/bin/bash
#
# Nail Segmentation API Server Start Script
#
# Usage:
#   ./scripts/start_server.sh              # 기본 설정으로 시작
#   ./scripts/start_server.sh --reload     # 개발 모드 (코드 변경 시 자동 재시작)
#   ./scripts/start_server.sh --prod       # 프로덕션 모드 (4 workers)
#

set -e

# 스크립트 디렉토리 기준으로 ML 패키지 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ML_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ML_ROOT"

echo "======================================"
echo "  Nail Segmentation API Server"
echo "======================================"
echo ""

# 환경 변수 설정 (기본값)
export NAIL_SEG_MODEL_PATH="${NAIL_SEG_MODEL_PATH:-models/nail_segmentation/v2.0.0/best_model.pth}"
export NAIL_SEG_CONFIG_PATH="${NAIL_SEG_CONFIG_PATH:-models/nail_segmentation/v2.0.0/config.yaml}"

# 가상환경 활성화
VENV_PYTHON="$ML_ROOT/venv/bin/python"

if [ -d "venv" ] && [ -f "$VENV_PYTHON" ]; then
    echo "[1/4] Using virtual environment..."
else
    echo "[1/4] Virtual environment not found. Creating with Python 3.11..."
    # Python 3.11 사용 (PyTorch 호환성)
    if command -v python3.11 &> /dev/null; then
        python3.11 -m venv venv
    elif [ -f "/usr/local/bin/python3.11" ]; then
        /usr/local/bin/python3.11 -m venv venv
    else
        echo "ERROR: Python 3.11 required but not found."
        echo "Please install Python 3.11: brew install python@3.11"
        exit 1
    fi
    echo "      Installing dependencies..."
    $VENV_PYTHON -m pip install --upgrade pip
    $VENV_PYTHON -m pip install torch==2.2.2 torchvision==0.17.2 numpy==1.26.4
    $VENV_PYTHON -m pip install opencv-python==4.9.0.80 segmentation-models-pytorch fastapi uvicorn python-multipart pyyaml
fi

# Python 버전 확인
PYTHON_VERSION=$($VENV_PYTHON --version 2>&1)
echo "      Python: $PYTHON_VERSION"

# 모델 파일 존재 확인
echo ""
echo "[2/4] Checking model files..."
if [ -f "$NAIL_SEG_MODEL_PATH" ]; then
    MODEL_SIZE=$(du -h "$NAIL_SEG_MODEL_PATH" | cut -f1)
    echo "      Model: $NAIL_SEG_MODEL_PATH ($MODEL_SIZE)"
else
    echo ""
    echo "  !! Warning: Model file not found !!"
    echo "     Path: $NAIL_SEG_MODEL_PATH"
    echo ""
    echo "  Please download the trained model from Kaggle:"
    echo "  1. Go to your Kaggle notebook output"
    echo "  2. Download 'best_model.pth'"
    echo "  3. Copy to: $ML_ROOT/$NAIL_SEG_MODEL_PATH"
    echo ""
    echo "  Server will start in degraded mode (ImageNet weights only)"
    echo ""
fi

# 설정 파일 확인
if [ -f "$NAIL_SEG_CONFIG_PATH" ]; then
    echo "      Config: $NAIL_SEG_CONFIG_PATH"
else
    echo "      Config: $NAIL_SEG_CONFIG_PATH (not found, using defaults)"
fi

# 포트 충돌 확인
echo ""
echo "[3/4] Checking port 8000..."
if lsof -i :8000 -t > /dev/null 2>&1; then
    echo "      Port 8000 is in use. Stopping existing process..."
    lsof -i :8000 -t | xargs kill -9 2>/dev/null || true
    sleep 1
fi
echo "      Port 8000 is available"

# 서버 시작
echo ""
echo "[4/4] Starting server..."
echo ""
echo "      Model Path: $NAIL_SEG_MODEL_PATH"
echo "      Config Path: $NAIL_SEG_CONFIG_PATH"
echo ""

# 실행 모드 결정
if [[ "$1" == "--prod" ]]; then
    echo "      Mode: Production (4 workers)"
    echo ""
    echo "======================================"
    $VENV_PYTHON -m uvicorn inference.server:app --host 0.0.0.0 --port 8000 --workers 4
elif [[ "$1" == "--reload" ]]; then
    echo "      Mode: Development (auto-reload)"
    echo ""
    echo "======================================"
    $VENV_PYTHON -m uvicorn inference.server:app --host 0.0.0.0 --port 8000 --reload
else
    echo "      Mode: Default"
    echo ""
    echo "======================================"
    $VENV_PYTHON -m uvicorn inference.server:app --host 0.0.0.0 --port 8000
fi
