#!/usr/bin/env python3
"""
Nail Segmentation API Server

FastAPI-based inference server for nail segmentation.
Uses DeepLabV3+ with ResNet101 encoder for high-accuracy segmentation.

Usage:
    # Development
    uvicorn inference.server:app --reload --host 0.0.0.0 --port 8000

    # Production
    uvicorn inference.server:app --host 0.0.0.0 --port 8000 --workers 4

Endpoints:
    POST /api/segment - Image upload -> segmentation mask
    POST /api/measure - Image upload -> nail measurements (mm)
    GET /health - Health check
"""

import base64
import io
import os
import time
from pathlib import Path
from typing import List, Optional, Tuple

import cv2
import numpy as np
import segmentation_models_pytorch as smp
import torch
import yaml
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel

# ============================================
# Configuration
# ============================================

# Default model path (can be overridden by environment variable)
# v2.0.0: Kaggle-trained ResNet101 model
DEFAULT_MODEL_PATH = os.environ.get(
    "NAIL_SEG_MODEL_PATH",
    str(Path(__file__).parent.parent / "models/nail_segmentation/v0.0.0/best_model.pth")
)

# Default config path
DEFAULT_CONFIG_PATH = os.environ.get(
    "NAIL_SEG_CONFIG_PATH",
    str(Path(__file__).parent.parent / "models/nail_segmentation/v0.0.0/config.yaml")
)

# Credit card dimensions (ISO/IEC 7810)
CREDIT_CARD_WIDTH_MM = 85.6
CREDIT_CARD_HEIGHT_MM = 53.98


# ============================================
# Response Models
# ============================================

class SegmentationResponse(BaseModel):
    """Response model for segmentation endpoint."""
    success: bool
    mask: List[List[float]]  # 2D array of floats (0-1)
    width: int
    height: int
    processing_time_ms: float
    mask_stats: dict


class SegmentWithOverlayResponse(BaseModel):
    """Response model for segment-with-overlay endpoint."""
    success: bool
    cropped_image: str  # base64 PNG of cropped input image
    mask_overlay: str   # base64 PNG with transparent background + green mask
    mask: List[List[float]]  # 2D array of floats (0-1)
    width: int
    height: int
    processing_time_ms: float
    mask_stats: dict


class NailMeasurement(BaseModel):
    """Individual nail measurement."""
    finger: str  # thumb, index, middle, ring, little
    width_mm: float
    width_pixels: int
    confidence: float
    bounding_box: dict  # x, y, width, height


class MeasurementResponse(BaseModel):
    """Response model for measurement endpoint."""
    success: bool
    measurements: List[NailMeasurement]
    pixel_to_mm_ratio: float
    processing_time_ms: float
    mask: Optional[List[List[float]]] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_path: str
    encoder: str
    input_size: int


# ============================================
# Model Manager
# ============================================

class NailSegmentationModel:
    """Manages the DeepLabV3+ segmentation model."""

    def __init__(self):
        self.model: Optional[torch.nn.Module] = None
        self.preprocessing_fn = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.config = {}
        self.input_size = 800  # v2.0.0: 800px for measurement precision
        self.encoder = "resnet101"
        self.threshold = 0.5

    def load_config(self, config_path: str) -> dict:
        """Load training configuration."""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)

    def load_model(self, model_path: str, config_path: str) -> bool:
        """Load the segmentation model."""
        try:
            print(f"[Server] Loading model from: {model_path}")
            print(f"[Server] Loading config from: {config_path}")
            print(f"[Server] Device: {self.device}")

            # Load config
            if os.path.exists(config_path):
                self.config = self.load_config(config_path)
                self.encoder = self.config.get('model', {}).get('encoder', 'resnet101')
                self.input_size = self.config.get('input', {}).get('size', 800)
                self.threshold = self.config.get('inference', {}).get('threshold', 0.5)
            else:
                print(f"[Server] Config not found, using defaults")
                self.encoder = 'resnet101'
                self.input_size = 800  # v2.0.0: 800px for measurement precision

            print(f"[Server] Encoder: {self.encoder}")
            print(f"[Server] Input size: {self.input_size}")

            # Create model (activation=None: raw logits, sigmoid applied in post-processing)
            self.model = smp.DeepLabV3Plus(
                encoder_name=self.encoder,
                encoder_weights=None,  # We'll load our own weights
                classes=1,
                activation=None,
            )

            # Load weights
            if os.path.exists(model_path):
                state_dict = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                print(f"[Server] Model weights loaded successfully")
            else:
                print(f"[Server] WARNING: Model weights not found at {model_path}")
                print(f"[Server] Using model with ImageNet encoder weights only")
                # Re-create with ImageNet weights for testing
                self.model = smp.DeepLabV3Plus(
                    encoder_name=self.encoder,
                    encoder_weights='imagenet',
                    classes=1,
                    activation=None,
                )

            self.model = self.model.to(self.device)
            self.model.eval()

            # Get preprocessing function
            self.preprocessing_fn = smp.encoders.get_preprocessing_fn(
                self.encoder,
                'imagenet'
            )

            print(f"[Server] Model loaded successfully")
            return True

        except Exception as e:
            print(f"[Server] Failed to load model: {e}")
            import traceback
            traceback.print_exc()
            return False

    def preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for inference."""
        # Center square crop to maintain aspect ratio
        h, w = image.shape[:2]
        crop_size = min(h, w)
        start_x = (w - crop_size) // 2
        start_y = (h - crop_size) // 2
        image = image[start_y:start_y+crop_size, start_x:start_x+crop_size]

        # Resize cropped square to model input size
        image = cv2.resize(image, (self.input_size, self.input_size))

        # Apply CLAHE on L channel (LAB color space) for edge contrast
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

        # Apply encoder-specific preprocessing
        if self.preprocessing_fn:
            image = self.preprocessing_fn(image)

        # Convert to tensor: HWC -> CHW
        image = image.transpose(2, 0, 1).astype(np.float32)
        tensor = torch.from_numpy(image).unsqueeze(0)  # Add batch dimension

        return tensor.to(self.device)

    def predict(self, image: np.ndarray) -> Tuple[np.ndarray, float]:
        """Run segmentation inference."""
        if self.model is None:
            raise RuntimeError("Model not loaded")

        start_time = time.time()

        # Preprocess
        input_tensor = self.preprocess_image(image)

        # Inference
        with torch.no_grad():
            output = self.model(input_tensor)
            output = torch.sigmoid(output)  # Apply sigmoid to raw logits

        # Post-process
        mask = output.squeeze().cpu().numpy()  # Remove batch and channel dims

        processing_time_ms = (time.time() - start_time) * 1000

        return mask, processing_time_ms


# ============================================
# Image Processing Utilities
# ============================================

def find_connected_components(mask: np.ndarray, threshold: float = 0.5) -> List[dict]:
    """Find connected components (nail regions) in the mask."""
    binary_mask = (mask > threshold).astype(np.uint8)

    # Find contours
    contours, _ = cv2.findContours(
        binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    regions = []
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < 100:  # Filter out noise
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

    # Sort by x position (left to right)
    regions.sort(key=lambda r: r["center_x"])

    return regions


def classify_fingers(regions: List[dict], is_thumb_only: bool = True) -> List[dict]:
    """Classify detected regions as specific fingers based on position."""
    if not regions:
        return []

    if is_thumb_only:
        # For thumb measurement, expect 1 region
        if regions:
            regions[0]["finger"] = "thumb"
        return regions[:1]

    # For 4-finger measurement (index, middle, ring, little)
    # Assign fingers based on x position (left to right for right hand)
    finger_names = ["index", "middle", "ring", "little"]
    classified = []

    for i, region in enumerate(regions[:4]):
        region["finger"] = finger_names[i] if i < len(finger_names) else f"unknown_{i}"
        classified.append(region)

    return classified


def calculate_measurements(
    regions: List[dict],
    card_width_pixels: float,
    model_input_size: int = 800,
) -> List[NailMeasurement]:
    """Calculate nail measurements in mm using credit card reference."""
    if card_width_pixels <= 0:
        raise ValueError("Invalid card width pixels")

    # Calculate pixel to mm ratio
    pixel_to_mm_ratio = CREDIT_CARD_WIDTH_MM / card_width_pixels

    measurements = []
    for region in regions:
        width_mm = region["width_pixels"] * pixel_to_mm_ratio

        measurements.append(NailMeasurement(
            finger=region.get("finger", "unknown"),
            width_mm=round(width_mm, 2),
            width_pixels=region["width_pixels"],
            confidence=0.9,  # TODO: Calculate actual confidence
            bounding_box=region["bounding_box"],
        ))

    return measurements


# ============================================
# FastAPI Application
# ============================================

app = FastAPI(
    title="Nail Segmentation API",
    description="AI-powered nail segmentation and measurement service",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model_manager = NailSegmentationModel()


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    print("[Server] Starting up...")
    success = model_manager.load_model(DEFAULT_MODEL_PATH, DEFAULT_CONFIG_PATH)
    if not success:
        print("[Server] WARNING: Model not loaded, server will run in degraded mode")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy" if model_manager.model is not None else "degraded",
        model_loaded=model_manager.model is not None,
        model_path=DEFAULT_MODEL_PATH,
        encoder=model_manager.encoder,
        input_size=model_manager.input_size,
    )


@app.post("/api/segment", response_model=SegmentationResponse)
async def segment_image(
    image: UploadFile = File(...),
):
    """
    Segment nail regions from an uploaded image.

    Args:
        image: Image file (JPEG, PNG)

    Returns:
        SegmentationResponse with mask and statistics
    """
    if model_manager.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Run inference
        mask, processing_time_ms = model_manager.predict(img_rgb)

        # Calculate statistics
        mask_stats = {
            "min": float(mask.min()),
            "max": float(mask.max()),
            "mean": float(mask.mean()),
            "positive_ratio": float((mask > model_manager.threshold).sum() / mask.size * 100),
        }

        return SegmentationResponse(
            success=True,
            mask=mask.tolist(),
            width=mask.shape[1],
            height=mask.shape[0],
            processing_time_ms=round(processing_time_ms, 2),
            mask_stats=mask_stats,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/segment-with-overlay", response_model=SegmentWithOverlayResponse)
async def segment_with_overlay(
    image: UploadFile = File(...),
):
    """
    Segment nail regions and return overlay image for mobile display.

    Returns:
        - cropped_image: Cropped input image (base64 PNG)
        - mask_overlay: Green semi-transparent mask overlay (base64 PNG with transparent background)
        - mask: Mask data (same as /api/segment)
    """
    if model_manager.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        start_time = time.time()

        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Convert BGR to RGB for model
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Run inference
        mask, inference_time = model_manager.predict(img_rgb)

        # Get mask dimensions (same as model input size)
        height, width = mask.shape

        # Create cropped image at model input size
        # Apply same center crop as preprocessing
        h, w = img.shape[:2]
        crop_size = min(h, w)
        start_x = (w - crop_size) // 2
        start_y = (h - crop_size) // 2
        cropped_img = img[start_y:start_y+crop_size, start_x:start_x+crop_size]
        cropped_img = cv2.resize(cropped_img, (width, height))

        # Encode cropped image to base64 PNG
        _, cropped_buffer = cv2.imencode('.png', cropped_img)
        cropped_base64 = base64.b64encode(cropped_buffer).decode('utf-8')

        # Create mask overlay (RGBA, transparent background + green mask)
        # OpenCV uses BGRA for 4-channel images
        overlay = np.zeros((height, width, 4), dtype=np.uint8)
        # Set green color with 50% alpha where mask > threshold
        mask_binary = mask > model_manager.threshold
        overlay[mask_binary, 0] = 0    # B
        overlay[mask_binary, 1] = 255  # G
        overlay[mask_binary, 2] = 0    # R
        overlay[mask_binary, 3] = 128  # A (50% opacity)

        # Encode overlay to base64 PNG (with alpha channel)
        _, overlay_buffer = cv2.imencode('.png', overlay)
        overlay_base64 = base64.b64encode(overlay_buffer).decode('utf-8')

        # Calculate statistics
        mask_stats = {
            "min": float(mask.min()),
            "max": float(mask.max()),
            "mean": float(mask.mean()),
            "positive_ratio": float((mask > model_manager.threshold).sum() / mask.size * 100),
        }

        processing_time_ms = (time.time() - start_time) * 1000

        return SegmentWithOverlayResponse(
            success=True,
            cropped_image=cropped_base64,
            mask_overlay=overlay_base64,
            mask=mask.tolist(),
            width=width,
            height=height,
            processing_time_ms=round(processing_time_ms, 2),
            mask_stats=mask_stats,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/measure", response_model=MeasurementResponse)
async def measure_nails(
    image: UploadFile = File(...),
    card_width_pixels: float = 280,  # Default card guide width
    is_thumb_only: bool = True,
    include_mask: bool = False,
):
    """
    Measure nail dimensions from an uploaded image.

    Args:
        image: Image file (JPEG, PNG)
        card_width_pixels: Width of credit card in the image (pixels)
        is_thumb_only: True for thumb measurement, False for 4 fingers
        include_mask: Whether to include the segmentation mask in response

    Returns:
        MeasurementResponse with measurements in mm
    """
    if model_manager.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        start_time = time.time()

        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Run inference
        mask, inference_time = model_manager.predict(img_rgb)

        # Find connected components
        regions = find_connected_components(mask, threshold=model_manager.threshold)

        # Classify fingers
        classified_regions = classify_fingers(regions, is_thumb_only)

        if not classified_regions:
            return MeasurementResponse(
                success=False,
                measurements=[],
                pixel_to_mm_ratio=0,
                processing_time_ms=round((time.time() - start_time) * 1000, 2),
                mask=mask.tolist() if include_mask else None,
            )

        # Calculate measurements
        # Note: card_width_pixels is already in 640x640 model space from app
        # App calculates: MODEL_INPUT_SIZE * (cardGuideWidth / screenWidth)
        # No additional scaling needed
        scaled_card_width = card_width_pixels

        measurements = calculate_measurements(
            classified_regions,
            scaled_card_width,
            model_manager.input_size,
        )

        pixel_to_mm_ratio = CREDIT_CARD_WIDTH_MM / scaled_card_width

        return MeasurementResponse(
            success=True,
            measurements=measurements,
            pixel_to_mm_ratio=round(pixel_to_mm_ratio, 4),
            processing_time_ms=round((time.time() - start_time) * 1000, 2),
            mask=mask.tolist() if include_mask else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CLI Entry Point
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
