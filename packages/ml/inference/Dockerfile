# Nail Segmentation API Server Dockerfile
#
# Build:
#   docker build -t nail-segmentation-api -f inference/Dockerfile .
#
# Run:
#   docker run -p 8000:8000 -v $(pwd)/runs:/app/runs nail-segmentation-api
#
# With GPU (NVIDIA Docker):
#   docker run --gpus all -p 8000:8000 -v $(pwd)/runs:/app/runs nail-segmentation-api

FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install additional inference dependencies
RUN pip install --no-cache-dir \
    fastapi>=0.100.0 \
    uvicorn[standard]>=0.22.0 \
    python-multipart>=0.0.6

# Copy application code
COPY . .

# Environment variables
ENV PYTHONPATH=/app
ENV NAIL_SEG_MODEL_PATH=/app/runs/segmentation/resnet101_latest/best_model.pth
ENV NAIL_SEG_CONFIG_PATH=/app/training/configs/nail_segmentation_deeplabv3.yaml

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run server
CMD ["uvicorn", "inference.server:app", "--host", "0.0.0.0", "--port", "8000"]
