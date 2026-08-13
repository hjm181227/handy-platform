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
# onnxruntime은 추론에만 필요하므로 지연 import한다 (get_session 내부).
# 이렇게 하면 카드 검출 등 CV 로직을 onnxruntime 설치 없이 import·튜닝할 수 있다.

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
_session = None  # type: Optional["ort.InferenceSession"]


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


def get_session():
    """ONNX 세션을 로드하거나 캐시된 세션을 반환합니다."""
    global _session
    if _session is None:
        import onnxruntime as ort  # 지연 import (CV 튜닝은 onnxruntime 불필요)
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
# Card Detection (실측 스케일 — 가정 기반 스케일의 지배적 오차 제거)
# ============================================
#
# 배경: 기존에는 "사용자가 카드를 화면 가이드에 완벽히 맞췄다"는 가정으로
# 카드 픽셀폭을 추정했다. 카드가 유일한 스케일 기준이라, 이 가정이 조금만
# 틀려도 모든 손톱이 같은 비율로 틀렸다. 여기서는 크롭된 이미지(마스크와
# 동일 좌표계)에서 카드 사각형을 실제로 검출해 픽셀폭을 측정한다.
#
# 비파괴 원칙: 검출 실패/비활성 시 호출부는 기존 추정치로 폴백한다.

def _order_quad(pts: np.ndarray) -> np.ndarray:
    """4점을 tl, tr, br, bl 순서로 정렬."""
    pts = pts.astype(np.float32)
    s = pts.sum(axis=1)
    diff = pts[:, 0] - pts[:, 1]  # x - y
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmax(diff)]
    bl = pts[np.argmin(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def _quad_edges(quad: np.ndarray) -> Tuple[float, float]:
    """정렬된 quad에서 (평균 가로변, 평균 세로변) 길이."""
    tl, tr, br, bl = quad
    top = float(np.hypot(*(tr - tl)))
    bottom = float(np.hypot(*(br - bl)))
    left = float(np.hypot(*(bl - tl)))
    right = float(np.hypot(*(br - tr)))
    return (top + bottom) / 2.0, (left + right) / 2.0


# 종횡비 게이트: 원근 편향은 aspect_error와 거의 1:1로 움직인다
# (8.4% 편향 → aspect_error 0.090). 0.12로 두면 최악 ~12% 편향까지만 통과.
# 근본 해결(호모그래피 원근 보정)은 후속. 지금은 near-frontal 검출만 신뢰.
CARD_ASPECT_ERROR_GATE = 0.12
CARD_MIN_AREA_RATIO = 0.03  # 카드는 프레임의 최소 3%


def _build_edge_maps(cropped_rgb: np.ndarray) -> List[np.ndarray]:
    """저대비(흰 카드+흰 배경) 상황까지 잡기 위해 다채널·적응형 엣지맵을 만든다.

    흰 카드/흰 벽은 grayscale 대비가 낮아 Canny 엣지가 끊긴다. 채도(S)·명도(V)
    채널과 국소 대비 기반 adaptive threshold를 병용하면 한 채널에서라도 경계가
    살아난다. 각 맵은 이후 morphology close로 끊긴 외곽을 잇는다.
    """
    maps: List[np.ndarray] = []
    gray = cv2.cvtColor(cropped_rgb, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 60, 60)

    maps.append(cv2.Canny(gray, 40, 120))
    maps.append(cv2.Canny(gray, 60, 180))
    otsu_t, _ = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    maps.append(cv2.Canny(gray, int(otsu_t * 0.5), int(otsu_t)))

    # 국소 대비: 흰-흰 경계도 지역적으로는 미세한 밝기 차가 있어 살아난다
    adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 4
    )
    maps.append(cv2.Canny(adaptive, 40, 120))

    # HSV 채도/명도 채널 (색·재질이 다른 카드 경계 보강)
    hsv = cv2.cvtColor(cropped_rgb, cv2.COLOR_RGB2HSV)
    for ch in (1, 2):  # S, V
        c = cv2.bilateralFilter(hsv[:, :, ch], 9, 60, 60)
        maps.append(cv2.Canny(c, 40, 120))
    return maps


def _evaluate_candidate(long_side, short_side, box_pts, center,
                        guide_card_width_pixels) -> Optional[dict]:
    """카드 후보(회전 사각형)를 게이트 통과 시 dict로, 아니면 None."""
    if short_side <= 1:
        return None
    aspect = long_side / short_side
    aspect_error = abs(aspect - CARD_ASPECT_RATIO) / CARD_ASPECT_RATIO
    if aspect_error > CARD_ASPECT_ERROR_GATE:
        return None
    if guide_card_width_pixels > 0:
        guide_err = abs(long_side - guide_card_width_pixels) / guide_card_width_pixels
        if guide_err > 0.45:
            return None
    quad = _order_quad(np.array(box_pts, dtype=np.float32))
    quad_center = quad.mean(axis=0)
    center_dist = float(np.hypot(*(quad_center - center)))
    area = long_side * short_side
    score = area - center_dist * 50.0 - aspect_error * area
    return {
        "score": float(score),
        "long_side": float(long_side),
        "short_side": float(short_side),
        "aspect_ratio": float(aspect),
        "aspect_error": float(aspect_error),
        "corners": quad.astype(float).tolist(),
    }


def detect_card(
    cropped_rgb: np.ndarray,
    guide_card_width_pixels: float,
    input_size: int = INPUT_SIZE,
    debug: bool = False,
) -> Optional[dict]:
    """크롭된 RGB 이미지(마스크와 동일 좌표계)에서 신용카드 사각형을 검출.

    다채널 엣지 → 강한 morphology close → (approxPolyDP 4각형 OR minAreaRect)
    후보를 종횡비·가이드 게이트로 검증. minAreaRect는 외곽이 살짝 끊기거나
    모서리가 둥근 컨투어에도 강해, 저대비 상황의 검출률을 높인다.

    Returns:
        {long_side, short_side, aspect_ratio, aspect_error, corners, score} 또는 None.
        long_side가 카드 가로(85.6mm)에 해당하는 픽셀폭.
    """
    try:
        center = np.array([input_size / 2.0, input_size / 2.0], dtype=np.float32)
        min_area = (input_size * input_size) * CARD_MIN_AREA_RATIO
        close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))

        stats = {"contours": 0, "area_pass": 0, "shape_pass": 0, "gate_pass": 0}
        best: Optional[dict] = None

        for edges in _build_edge_maps(cropped_rgb):
            # 끊긴 카드 외곽을 잇는다 (저대비 대응 핵심)
            closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, close_kernel, iterations=3)
            contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            stats["contours"] += len(contours)
            for c in contours:
                area = cv2.contourArea(c)
                if area < min_area:
                    continue
                stats["area_pass"] += 1

                candidates = []
                # 1) 엄격한 4각형
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                if len(approx) == 4 and cv2.isContourConvex(approx):
                    quad = _order_quad(approx.reshape(4, 2))
                    w_edge, h_edge = _quad_edges(quad)
                    candidates.append((max(w_edge, h_edge), min(w_edge, h_edge), quad))
                # 2) 회전 사각형(비-4각형·둥근 모서리에 강함)
                rect = cv2.minAreaRect(c)
                (rw, rh) = rect[1]
                if rw > 0 and rh > 0:
                    box = cv2.boxPoints(rect)
                    candidates.append((max(rw, rh), min(rw, rh), box))

                if candidates:
                    stats["shape_pass"] += 1
                for long_side, short_side, box_pts in candidates:
                    cand = _evaluate_candidate(
                        long_side, short_side, box_pts, center, guide_card_width_pixels
                    )
                    if cand is None:
                        continue
                    stats["gate_pass"] += 1
                    if best is None or cand["score"] > best["score"]:
                        best = cand

        if debug:
            print(f"[detect_card] funnel {stats} → "
                  f"{'HIT ' + str(round(best['long_side'],1)) + 'px' if best else 'MISS'}")
        return best
    except Exception as e:  # 검출은 부가 기능 — 실패해도 측정은 계속
        print(f"[Lambda] Card detection error (fallback to estimate): {e}")
        return None


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


def measure_nail_width(contour: np.ndarray) -> float:
    """손톱 폭을 회전 불변으로 측정한다.

    기존에는 축 정렬 boundingRect의 폭(w)을 썼는데, 손가락이 화면에서 기울면
    그 폭이 실제 손톱 폭보다 과대측정된다 (예: 30° 기울면 수 % 오차).

    이 앱의 촬영은 손가락을 대략 세로로 세워 찍으므로, 손톱 영역의 두 주축(PCA)
    중 '더 수평에 가까운 축'이 폭 축이다. 그 축에 투영한 최대 caliper 거리를
    폭으로 반환한다. 손톱이 기울어도 폭 축이 손톱을 따라 회전하므로 폭이 안정적이다.
    (기울기 45° 미만에서 유효 — 실제 촬영 범위를 충분히 포함)
    """
    pts = contour.reshape(-1, 2).astype(np.float64)
    if len(pts) < 5:
        _, _, w, _ = cv2.boundingRect(contour)
        return float(w)
    mean = pts.mean(axis=0)
    centered = pts - mean
    cov = np.cov(centered.T)
    _, eigvecs = np.linalg.eigh(cov)  # 열이 고유벡터
    axis0, axis1 = eigvecs[:, 0], eigvecs[:, 1]
    # x성분(수평)이 큰 축을 폭 축으로 (세로 손가락 prior)
    width_axis = axis0 if abs(axis0[0]) >= abs(axis1[0]) else axis1
    proj = centered @ width_axis
    return float(proj.max() - proj.min())


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
        width_rot = measure_nail_width(contour)  # 회전 불변 폭
        M = cv2.moments(contour)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            cx, cy = x + w // 2, y + h // 2

        regions.append({
            "id": i,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            # width_pixels: 실제 측정에 쓰는 폭(회전 불변). bbox 폭은 참고용으로 병기.
            "width_pixels": round(width_rot, 1),
            "width_pixels_bbox": int(w),
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

    # 카드 실측 검출 (기본 활성, 실패 시 가이드 추정치로 폴백)
    use_card_detection = query_params.get("detect_card", "true").lower() == "true"
    card_source = "estimated"
    card_detection = None
    effective_card_width = card_width_pixels
    if use_card_detection and card_width_pixels > 0:
        cropped_rgb = center_crop_and_resize(img_rgb, INPUT_SIZE)
        card_detection = detect_card(cropped_rgb, card_width_pixels, INPUT_SIZE)
        if card_detection is not None:
            effective_card_width = card_detection["long_side"]
            card_source = "detected"

    # 카드 가이드 필터링 (실측 폭이 있으면 그 폭 기준)
    if effective_card_width > 0:
        mask = mask_card_guide_region(mask, effective_card_width)

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
    # 손톱 영역 필터: card_box(기존) | none(새 "카드 아래 손톱" 자세)
    nail_filter = query_params.get("nail_filter", "card_box").lower()
    regions = find_connected_components(mask, threshold=THRESHOLD)
    if nail_filter == "card_box" and effective_card_width > 0:
        regions = filter_regions_by_card_guide(regions, effective_card_width, INPUT_SIZE)

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
            # 실측 카드 스케일: 클라이언트가 mm 변환에 이 값을 쓰면 가정 오차가 사라진다.
            # 검출 실패 시 card_source="estimated"이며 클라이언트는 기존 가이드 추정치를 쓴다.
            "card_source": card_source,
            "card_width_pixels_detected": round(effective_card_width, 1) if card_source == "detected" else None,
            "card_detection": {
                "aspect_ratio": round(card_detection["aspect_ratio"], 3),
                "aspect_error": round(card_detection["aspect_error"], 3),
                "corners": card_detection["corners"],
            } if card_detection is not None else None,
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

    guide_card_width_pixels = float(query_params.get("card_width_pixels", "280"))
    is_thumb_only = query_params.get("is_thumb_only", "true").lower() == "true"
    include_mask = query_params.get("include_mask", "false").lower() == "true"
    # 카드 실측 검출 (기본 활성, 실패 시 가이드 추정치로 폴백)
    use_card_detection = query_params.get("detect_card", "true").lower() == "true"
    # 손톱 영역 필터: card_box(기존 "카드 위 손톱" 자세) | none(새 "카드 아래 손톱" 자세)
    # 새 자세는 손톱이 카드 박스 밖에 있으므로 카드 박스 필터를 끈다.
    nail_filter = query_params.get("nail_filter", "card_box").lower()

    img = decode_and_orient_image(image_bytes)
    if img is None:
        return error_response(400, "Invalid image format")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mask = predict(img_rgb)

    # 카드 실측: 마스크와 동일한 crop 좌표계에서 카드를 검출해 실제 픽셀폭 사용
    card_source = "estimated"
    card_detection = None
    card_width_pixels = guide_card_width_pixels
    if use_card_detection:
        cropped_rgb = center_crop_and_resize(img_rgb, INPUT_SIZE)
        card_detection = detect_card(cropped_rgb, guide_card_width_pixels, INPUT_SIZE)
        if card_detection is not None:
            card_width_pixels = card_detection["long_side"]
            card_source = "detected"
            print(f"[Lambda] Card detected: {card_width_pixels:.1f}px "
                  f"(guide estimate {guide_card_width_pixels:.1f}px, "
                  f"aspect_err {card_detection['aspect_error']:.3f})")
        else:
            print(f"[Lambda] Card not detected, using guide estimate {guide_card_width_pixels:.1f}px")

    # 연결 영역 탐지
    regions = find_connected_components(mask, threshold=THRESHOLD)
    if nail_filter == "card_box":
        regions = filter_regions_by_card_guide(regions, card_width_pixels, INPUT_SIZE)
    # nail_filter == "none": 카드 박스 필터 생략 (새 자세 — 카드 아래 손톱).
    # 모델은 손톱만 세그멘테이션하므로 카드가 손톱으로 오검출되지 않는다.

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
            # 진단: 스케일이 실측 카드에서 왔는지, 추정치 대비 얼마나 다른지
            "card_source": card_source,
            "card_width_pixels_used": round(card_width_pixels, 1),
            "card_width_pixels_estimate": round(guide_card_width_pixels, 1),
            "card_detection": {
                "aspect_ratio": round(card_detection["aspect_ratio"], 3),
                "aspect_error": round(card_detection["aspect_error"], 3),
                "corners": card_detection["corners"],
            } if card_detection is not None else None,
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
