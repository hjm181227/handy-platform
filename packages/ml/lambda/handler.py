"""
AWS Lambda 핸들러 — 손톱 세그멘테이션 추론

ONNX Runtime으로 DeepLabV3+ ResNet101 모델 추론.
기존 FastAPI server.py와 동일한 전처리/후처리 로직을 사용하되,
PyTorch 의존성을 제거하고 NumPy로 대체.

Lambda Function URL로 직접 호출 (API Gateway 불필요).

환경변수:
    MODEL_PATH: ONNX 모델 경로 (default: /var/task/model.onnx)
"""

import base64
import json
import os
import time
from typing import List, Optional, Tuple

import cv2
import numpy as np
import onnxruntime as ort

# ============================================
# Configuration
# ============================================

MODEL_PATH = os.environ.get("MODEL_PATH", "/var/task/model.onnx")
INPUT_SIZE = 800
THRESHOLD = 0.5

# Credit card dimensions (ISO/IEC 7810)
CREDIT_CARD_WIDTH_MM = 85.6
CREDIT_CARD_HEIGHT_MM = 53.98
CARD_ASPECT_RATIO = CREDIT_CARD_WIDTH_MM / CREDIT_CARD_HEIGHT_MM  # ~1.586

# ImageNet normalization
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Global ONNX session (재사용 — Lambda warm start에서 유지)
_session: Optional[ort.InferenceSession] = None


def decode_and_orient_image(image_bytes: bytes) -> Optional[np.ndarray]:
    """이미지 디코딩 + 가로→세로 자동 회전.

    OpenCV 4.8+ (Lambda: 4.9.0.80)는 cv2.imdecode()에서
    EXIF orientation을 자동으로 적용합니다.
    따라서 수동 EXIF 처리는 불필요합니다 (이중 회전 버그 방지).

    EXIF가 없는 경우 (일부 Android 디바이스 등)에 대비하여,
    가로 이미지이면 세로로 자동 회전하는 fallback을 유지합니다.
    (이 앱의 모든 촬영은 세로 모드에서 수행됨)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    h, w = img.shape[:2]
    print(f"[Lambda] Decoded image (EXIF auto-applied by cv2): {w}x{h}")

    # Fallback: EXIF가 없는 경우 가로 이미지를 세로로 회전
    if w > h:
        print(f"[Lambda] Auto-rotating landscape image ({w}x{h}) to portrait")
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        h, w = img.shape[:2]
        print(f"[Lambda] After rotation: {w}x{h}")

    return img


def get_session() -> ort.InferenceSession:
    """ONNX 세션을 로드하거나 캐시된 세션을 반환합니다."""
    global _session
    if _session is None:
        print(f"[Lambda] Loading ONNX model: {MODEL_PATH}")
        start = time.time()
        _session = ort.InferenceSession(
            MODEL_PATH,
            providers=["CPUExecutionProvider"],
        )
        print(f"[Lambda] Model loaded in {time.time() - start:.2f}s")
    return _session


# ============================================
# Preprocessing (server.py와 동일)
# ============================================

def center_crop_and_resize(image: np.ndarray, target_size: int) -> np.ndarray:
    """Center square crop → resize to target_size."""
    h, w = image.shape[:2]
    crop_size = min(h, w)
    start_x = (w - crop_size) // 2
    start_y = (h - crop_size) // 2
    cropped = image[start_y:start_y + crop_size, start_x:start_x + crop_size]
    resized = cv2.resize(cropped, (target_size, target_size))
    return resized


def apply_clahe(image: np.ndarray) -> np.ndarray:
    """CLAHE on L-channel (LAB color space), clip_limit=4.0."""
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def preprocess(image: np.ndarray) -> np.ndarray:
    """이미지 전처리: crop → resize → CLAHE → normalize → CHW.

    Returns:
        np.ndarray shape (1, 3, 800, 800) float32
    """
    img = center_crop_and_resize(image, INPUT_SIZE)
    img = apply_clahe(img)

    # ImageNet normalization (smp encoder preprocessing과 동일)
    img = img.astype(np.float32) / 255.0
    img = (img - IMAGENET_MEAN) / IMAGENET_STD

    # HWC → CHW, add batch dim
    img = img.transpose(2, 0, 1)
    return np.expand_dims(img, axis=0)


# ============================================
# Inference
# ============================================

def predict(image: np.ndarray) -> np.ndarray:
    """ONNX Runtime 추론 → sigmoid → GaussianBlur.

    Returns:
        mask: np.ndarray shape (800, 800) float32, values 0-1
    """
    session = get_session()
    input_tensor = preprocess(image)

    # 추론
    output = session.run(None, {"input": input_tensor})[0]

    # sigmoid (PyTorch torch.sigmoid 대체)
    mask = 1.0 / (1.0 + np.exp(-output))

    # squeeze: (1, 1, 800, 800) → (800, 800)
    mask = mask.squeeze()

    # GaussianBlur (server.py와 동일)
    mask = cv2.GaussianBlur(mask.astype(np.float32), (5, 5), 0)

    return mask


# ============================================
# Post-processing (server.py에서 이식)
# ============================================

def mask_card_guide_region(
    mask: np.ndarray,
    card_width_pixels: float,
    margin_ratio: float = 0.15,
) -> np.ndarray:
    """카드 가이드 영역 외부의 마스크를 제거합니다."""
    h, w = mask.shape
    card_height = card_width_pixels / CARD_ASPECT_RATIO

    cx, cy = w / 2, h / 2
    mx = card_width_pixels * margin_ratio
    my = card_height * margin_ratio

    x1 = max(0, int(cx - card_width_pixels / 2 - mx))
    x2 = min(w, int(cx + card_width_pixels / 2 + mx))
    y1 = max(0, int(cy - card_height / 2 - my))
    y2 = min(h, int(cy + card_height / 2 + my))

    filtered = np.zeros_like(mask)
    filtered[y1:y2, x1:x2] = mask[y1:y2, x1:x2]

    print(f"[Lambda] Card guide crop: [{x1}:{x2}, {y1}:{y2}] in {w}x{h}")
    return filtered


def find_connected_components(mask: np.ndarray, threshold: float = 0.5) -> List[dict]:
    """마스크에서 연결 영역(손톱)을 찾습니다."""
    binary_mask = (mask > threshold).astype(np.uint8)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(
        binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    regions = []
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < 100:
            continue

        x, y, w, h = cv2.boundingRect(contour)
        M = cv2.moments(contour)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            cx, cy = x + w // 2, y + h // 2

        regions.append({
            "id": i,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "width_pixels": int(w),
            "height_pixels": int(h),
            "center_x": int(cx),
            "center_y": int(cy),
            "area": int(area),
        })

    regions.sort(key=lambda r: r["center_x"])
    return regions


def filter_regions_by_card_guide(
    regions: List[dict],
    card_width_pixels: float,
    model_input_size: int = 800,
    margin_ratio: float = 0.15,
) -> List[dict]:
    """카드 가이드 영역 내의 영역만 필터링합니다."""
    card_height = card_width_pixels / CARD_ASPECT_RATIO

    center_x = model_input_size / 2
    center_y = model_input_size / 2

    margin_x = card_width_pixels * margin_ratio
    margin_y = card_height * margin_ratio

    x_min = center_x - card_width_pixels / 2 - margin_x
    x_max = center_x + card_width_pixels / 2 + margin_x
    y_min = center_y - card_height / 2 - margin_y
    y_max = center_y + card_height / 2 + margin_y

    filtered = [
        r for r in regions
        if x_min <= r["center_x"] <= x_max and y_min <= r["center_y"] <= y_max
    ]

    print(f"[Lambda] Card guide filter: {len(regions)} → {len(filtered)} regions")
    return filtered


# ============================================
# Overlay Generation (server.py와 동일)
# ============================================

def create_overlay(mask: np.ndarray) -> np.ndarray:
    """마스크에서 초록색 반투명 오버레이(BGRA) 생성."""
    h, w = mask.shape
    overlay = np.zeros((h, w, 4), dtype=np.uint8)
    mask_binary = mask > THRESHOLD
    overlay[mask_binary, 0] = 0    # B
    overlay[mask_binary, 1] = 255  # G
    overlay[mask_binary, 2] = 0    # R
    overlay[mask_binary, 3] = 128  # A (50%)
    return overlay


def encode_image_base64(image: np.ndarray, fmt: str = ".png") -> str:
    """이미지를 base64로 인코딩."""
    _, buffer = cv2.imencode(fmt, image)
    return base64.b64encode(buffer).decode("utf-8")


def encode_mask_base64(mask: np.ndarray) -> str:
    """float32 마스크(0-1)를 uint8 grayscale PNG base64로 인코딩.
    800x800 float JSON(~5MB) → PNG grayscale(~20KB)로 크기 대폭 감소."""
    mask_uint8 = (mask * 255).clip(0, 255).astype(np.uint8)
    _, buffer = cv2.imencode(".png", mask_uint8)
    return base64.b64encode(buffer).decode("utf-8")


# ============================================
# Request Parsing (Lambda Function URL)
# ============================================

def parse_multipart(event: dict) -> Tuple[Optional[bytes], dict]:
    """Lambda Function URL / API Gateway의 multipart/form-data를 파싱합니다.

    Returns:
        (image_bytes, query_params)
    """
    query_params = event.get("queryStringParameters") or {}

    # body 추출
    body = event.get("body", "")
    is_base64 = event.get("isBase64Encoded", False)

    print(f"[Lambda] parse_multipart: isBase64={is_base64}, body_len={len(body) if body else 0}")

    if is_base64:
        body_bytes = base64.b64decode(body)
    else:
        body_bytes = body.encode("utf-8") if isinstance(body, str) else body

    print(f"[Lambda] body_bytes len: {len(body_bytes)}")

    # Content-Type에서 boundary 추출
    headers = event.get("headers", {})
    content_type = headers.get("content-type", "")

    print(f"[Lambda] content-type: {content_type[:100]}")

    if "multipart/form-data" in content_type:
        boundary = content_type.split("boundary=")[-1].strip()
        # boundary에 따옴표가 있으면 제거
        boundary = boundary.strip('"')
        print(f"[Lambda] boundary: {boundary[:50]}")
        image_bytes = _extract_file_from_multipart(body_bytes, boundary)
        if image_bytes:
            print(f"[Lambda] Extracted image: {len(image_bytes)} bytes")
        else:
            print(f"[Lambda] Failed to extract image from multipart")
            # 디버깅: body 시작 부분 출력
            print(f"[Lambda] body_bytes start: {body_bytes[:200]}")
        return image_bytes, query_params

    # raw binary (Content-Type: image/jpeg 등)
    if body_bytes and len(body_bytes) > 100:
        print(f"[Lambda] Using raw body as image: {len(body_bytes)} bytes")
        return body_bytes, query_params

    print(f"[Lambda] No image found in request")
    return None, query_params


def _extract_file_from_multipart(body: bytes, boundary: str) -> Optional[bytes]:
    """multipart body에서 이미지 파일 바이트를 추출합니다."""
    boundary_bytes = f"--{boundary}".encode()
    parts = body.split(boundary_bytes)

    print(f"[Lambda] multipart parts count: {len(parts)}")

    for i, part in enumerate(parts):
        # React Native은 content-disposition (소문자)으로 보냄
        part_lower = part.lower()
        if b"content-disposition" not in part_lower:
            continue

        # part 헤더 확인 (디버깅)
        header_end = part.find(b"\r\n\r\n")
        if header_end == -1:
            # \n\n도 시도 (일부 클라이언트)
            header_end = part.find(b"\n\n")
            if header_end == -1:
                continue
            header_separator_len = 2
        else:
            header_separator_len = 4

        header_section = part[:header_end].decode("utf-8", errors="replace")
        print(f"[Lambda] Part {i} header: {header_section[:200]}")

        # 대소문자 무시 비교
        header_lower = part_lower[:header_end]

        # "image" 필드이거나 Content-Type이 image인 파트를 찾음
        is_image_field = b'name="image"' in header_lower
        has_image_content_type = b"image/" in header_lower
        has_filename = b"filename=" in header_lower

        if not (is_image_field or has_image_content_type or has_filename):
            continue

        file_data = part[header_end + header_separator_len:]
        # trailing boundary marker 제거
        if file_data.endswith(b"\r\n"):
            file_data = file_data[:-2]
        if file_data.endswith(b"--"):
            file_data = file_data[:-2]
        if file_data.endswith(b"\r\n"):
            file_data = file_data[:-2]

        if len(file_data) > 100:
            return file_data

    return None


# ============================================
# Route Handlers
# ============================================

def handle_health(event: dict) -> dict:
    """GET /health"""
    session_loaded = _session is not None
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "status": "healthy",
            "model_loaded": session_loaded,
            "model_path": MODEL_PATH,
            "encoder": "resnet101",
            "input_size": INPUT_SIZE,
            "runtime": "onnxruntime",
        }),
    }


def handle_segment_with_overlay(event: dict) -> dict:
    """POST /api/segment-with-overlay"""
    start_time = time.time()

    # 이미지 파싱
    image_bytes, query_params = parse_multipart(event)
    if image_bytes is None:
        return error_response(400, "No image provided")

    card_width_pixels = float(query_params.get("card_width_pixels", "0"))

    # 디코딩 + 방향 보정 (EXIF + 가로→세로 자동 회전)
    img = decode_and_orient_image(image_bytes)
    if img is None:
        return error_response(400, "Invalid image format")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 추론
    mask = predict(img_rgb)

    # 카드 가이드 필터링
    if card_width_pixels > 0:
        mask = mask_card_guide_region(mask, card_width_pixels)

    height, width = mask.shape

    # 크롭 이미지 생성 (전처리와 동일한 center crop)
    h, w = img.shape[:2]
    crop_size = min(h, w)
    start_x = (w - crop_size) // 2
    start_y = (h - crop_size) // 2
    cropped_img = img[start_y:start_y + crop_size, start_x:start_x + crop_size]
    cropped_img = cv2.resize(cropped_img, (width, height))

    # base64 인코딩
    cropped_base64 = encode_image_base64(cropped_img)
    overlay = create_overlay(mask)
    overlay_base64 = encode_image_base64(overlay)

    # 영역 감지 (모바일에서 직접 사용)
    regions = find_connected_components(mask, threshold=THRESHOLD)
    if card_width_pixels > 0:
        regions = filter_regions_by_card_guide(regions, card_width_pixels, INPUT_SIZE)

    # 통계
    mask_stats = {
        "min": float(mask.min()),
        "max": float(mask.max()),
        "mean": float(mask.mean()),
        "positive_ratio": float((mask > THRESHOLD).sum() / mask.size * 100),
    }

    processing_time_ms = (time.time() - start_time) * 1000

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "success": True,
            "cropped_image": cropped_base64,
            "mask_overlay": overlay_base64,
            "mask_base64": encode_mask_base64(mask),
            "regions": regions,
            "width": width,
            "height": height,
            "processing_time_ms": round(processing_time_ms, 2),
            "mask_stats": mask_stats,
        }),
    }


def handle_segment(event: dict) -> dict:
    """POST /api/segment"""
    start_time = time.time()

    image_bytes, query_params = parse_multipart(event)
    if image_bytes is None:
        return error_response(400, "No image provided")

    img = decode_and_orient_image(image_bytes)
    if img is None:
        return error_response(400, "Invalid image format")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mask = predict(img_rgb)

    mask_stats = {
        "min": float(mask.min()),
        "max": float(mask.max()),
        "mean": float(mask.mean()),
        "positive_ratio": float((mask > THRESHOLD).sum() / mask.size * 100),
    }

    processing_time_ms = (time.time() - start_time) * 1000

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "success": True,
            "mask_base64": encode_mask_base64(mask),
            "width": int(mask.shape[1]),
            "height": int(mask.shape[0]),
            "processing_time_ms": round(processing_time_ms, 2),
            "mask_stats": mask_stats,
        }),
    }


def handle_measure(event: dict) -> dict:
    """POST /api/measure"""
    start_time = time.time()

    image_bytes, query_params = parse_multipart(event)
    if image_bytes is None:
        return error_response(400, "No image provided")

    card_width_pixels = float(query_params.get("card_width_pixels", "280"))
    is_thumb_only = query_params.get("is_thumb_only", "true").lower() == "true"
    include_mask = query_params.get("include_mask", "false").lower() == "true"

    img = decode_and_orient_image(image_bytes)
    if img is None:
        return error_response(400, "Invalid image format")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mask = predict(img_rgb)

    # 연결 영역 탐지
    regions = find_connected_components(mask, threshold=THRESHOLD)
    regions = filter_regions_by_card_guide(regions, card_width_pixels, INPUT_SIZE)

    # 손가락 분류
    if is_thumb_only:
        if regions:
            regions[0]["finger"] = "thumb"
        regions = regions[:1]
    else:
        finger_names = ["index", "middle", "ring", "little"]
        for i, region in enumerate(regions[:4]):
            region["finger"] = finger_names[i] if i < len(finger_names) else f"unknown_{i}"
        regions = regions[:4]

    if not regions:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "success": False,
                "measurements": [],
                "pixel_to_mm_ratio": 0,
                "processing_time_ms": round((time.time() - start_time) * 1000, 2),
                "mask_base64": encode_mask_base64(mask) if include_mask else None,
            }),
        }

    # 측정
    pixel_to_mm_ratio = CREDIT_CARD_WIDTH_MM / card_width_pixels
    measurements = []
    for region in regions:
        width_mm = region["width_pixels"] * pixel_to_mm_ratio
        measurements.append({
            "finger": region.get("finger", "unknown"),
            "width_mm": round(width_mm, 2),
            "width_pixels": region["width_pixels"],
            "confidence": 0.9,
            "bounding_box": region["bounding_box"],
        })

    processing_time_ms = (time.time() - start_time) * 1000

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "success": True,
            "measurements": measurements,
            "pixel_to_mm_ratio": round(pixel_to_mm_ratio, 4),
            "processing_time_ms": round(processing_time_ms, 2),
            "mask_base64": encode_mask_base64(mask) if include_mask else None,
        }),
    }


# ============================================
# Utilities
# ============================================

def error_response(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"success": False, "detail": message}),
    }


# ============================================
# Lambda Entry Point
# ============================================

def lambda_handler(event: dict, context) -> dict:
    """AWS Lambda 핸들러.

    Lambda Function URL에서 직접 호출됩니다.
    라우팅은 rawPath를 기반으로 합니다.
    """
    # 모델 사전 로드 (cold start 시)
    get_session()

    # 라우팅
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path = event.get("rawPath", "/")

    print(f"[Lambda] {method} {path}")

    # CORS preflight
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Accept",
            },
            "body": "",
        }

    # 라우팅
    if path == "/health" and method == "GET":
        return handle_health(event)
    elif path == "/api/segment-with-overlay" and method == "POST":
        return handle_segment_with_overlay(event)
    elif path == "/api/segment" and method == "POST":
        return handle_segment(event)
    elif path == "/api/measure" and method == "POST":
        return handle_measure(event)
    else:
        return error_response(404, f"Not found: {method} {path}")
