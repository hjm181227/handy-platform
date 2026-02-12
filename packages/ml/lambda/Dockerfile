FROM public.ecr.aws/lambda/python:3.11

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 핸들러 + 모델 복사
COPY handler.py .
COPY model.onnx .

CMD ["handler.lambda_handler"]
