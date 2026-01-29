#!/usr/bin/env python3
"""
Pseudo-Mask Generation Script for Fine-tuning

Generates initial segmentation masks using an existing trained model.
These masks can be reviewed and corrected before fine-tuning.

Usage:
    python tools/generate_pseudo_masks.py \
        --model models/trained/best_nail_segmentation_model.keras \
        --images datasets/nail_finetune/train/images \
        --output datasets/nail_finetune/train/masks \
        --save-overlay

Output:
    - masks/*.png - Binary mask files (white=nail, black=background)
    - masks/overlays/*.png - Overlay visualizations for review (if --save-overlay)
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from glob import glob

import numpy as np
from PIL import Image

# TensorFlow imports
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
from tensorflow import keras

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Generate pseudo-masks using existing segmentation model'
    )
    parser.add_argument(
        '--model', type=str, required=True,
        help='Path to trained Keras model (.keras or .h5)'
    )
    parser.add_argument(
        '--images', type=str, required=True,
        help='Directory containing input images'
    )
    parser.add_argument(
        '--output', type=str, required=True,
        help='Output directory for mask files'
    )
    parser.add_argument(
        '--threshold', type=float, default=0.5,
        help='Segmentation threshold (default: 0.5)'
    )
    parser.add_argument(
        '--input-size', type=int, default=256,
        help='Model input size (default: 256)'
    )
    parser.add_argument(
        '--save-overlay', action='store_true',
        help='Save overlay visualization images'
    )
    parser.add_argument(
        '--overlay-alpha', type=float, default=0.5,
        help='Overlay transparency (default: 0.5)'
    )
    return parser.parse_args()


# Custom loss and metrics (needed for model loading)
def focal_tversky_loss(y_true, y_pred, alpha=0.7, beta=0.3, gamma=0.75):
    """Focal Tversky Loss - handles class imbalance well."""
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.cast(y_pred, tf.float32)
    tp = tf.reduce_sum(y_true * y_pred)
    fp = tf.reduce_sum((1 - y_true) * y_pred)
    fn = tf.reduce_sum(y_true * (1 - y_pred))
    tversky = (tp + 1e-7) / (tp + alpha * fp + beta * fn + 1e-7)
    return tf.pow((1 - tversky), gamma)


def iou_metric(y_true, y_pred):
    """Intersection over Union metric."""
    y_pred = tf.cast(y_pred > 0.5, tf.float32)
    intersection = tf.reduce_sum(y_true * y_pred)
    union = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred) - intersection
    return (intersection + tf.keras.backend.epsilon()) / (union + tf.keras.backend.epsilon())


def dice_coefficient(y_true, y_pred):
    """Dice coefficient metric."""
    y_pred = tf.cast(y_pred > 0.5, tf.float32)
    numerator = 2 * tf.reduce_sum(y_true * y_pred)
    denominator = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred)
    return (numerator + tf.keras.backend.epsilon()) / (denominator + tf.keras.backend.epsilon())


def load_model(model_path: str):
    """Load trained Keras model with custom objects."""
    logger.info(f"Loading model from: {model_path}")

    custom_objects = {
        'focal_tversky_loss': focal_tversky_loss,
        'iou_metric': iou_metric,
        'dice_coefficient': dice_coefficient
    }

    model = keras.models.load_model(
        model_path,
        custom_objects=custom_objects,
        safe_mode=False
    )

    logger.info("Model loaded successfully")
    return model


def preprocess_image(image_path: str, input_size: int = 256) -> tuple:
    """
    Load and preprocess image for model inference.

    Returns:
        tuple: (preprocessed_tensor, original_image, original_size)
    """
    # Load original image
    original = Image.open(image_path).convert('RGB')
    original_size = original.size  # (width, height)

    # Resize to model input size
    resized = original.resize((input_size, input_size), Image.BILINEAR)

    # Convert to numpy array and normalize (0-255 range for MobileNetV3)
    img_array = np.array(resized, dtype=np.float32)

    # Add batch dimension
    tensor = np.expand_dims(img_array, axis=0)

    return tensor, original, original_size


def postprocess_mask(
    raw_output: np.ndarray,
    original_size: tuple,
    threshold: float = 0.5
) -> np.ndarray:
    """
    Postprocess model output to binary mask.

    Args:
        raw_output: Model output (1, H, W, 1) or (H, W, 1)
        original_size: (width, height) of original image
        threshold: Binarization threshold

    Returns:
        Binary mask as uint8 array (H, W) - 255 for nail, 0 for background
    """
    # Remove batch dimension if present
    if raw_output.ndim == 4:
        raw_output = raw_output[0]

    # Remove channel dimension if present
    if raw_output.ndim == 3:
        raw_output = raw_output[:, :, 0]

    # Binarize
    binary_mask = (raw_output >= threshold).astype(np.uint8) * 255

    # Resize to original image size
    mask_pil = Image.fromarray(binary_mask, mode='L')
    mask_resized = mask_pil.resize(original_size, Image.NEAREST)

    return np.array(mask_resized)


def create_overlay(
    original: Image.Image,
    mask: np.ndarray,
    alpha: float = 0.5,
    color: tuple = (0, 255, 0)  # Green
) -> Image.Image:
    """
    Create overlay visualization of mask on original image.

    Args:
        original: Original PIL Image
        mask: Binary mask array (H, W)
        alpha: Overlay transparency
        color: Mask color (R, G, B)

    Returns:
        PIL Image with mask overlay
    """
    # Ensure original is RGB
    original = original.convert('RGB')
    original_array = np.array(original)

    # Ensure mask matches original size
    if mask.shape[:2] != original_array.shape[:2]:
        mask_pil = Image.fromarray(mask, mode='L')
        mask = np.array(mask_pil.resize(original.size, Image.NEAREST))

    # Create colored overlay
    overlay = original_array.copy()
    mask_bool = mask > 127

    for c, channel_color in enumerate(color):
        overlay[:, :, c] = np.where(
            mask_bool,
            (1 - alpha) * original_array[:, :, c] + alpha * channel_color,
            original_array[:, :, c]
        ).astype(np.uint8)

    return Image.fromarray(overlay)


def generate_masks(
    model,
    images_dir: str,
    output_dir: str,
    threshold: float = 0.5,
    input_size: int = 256,
    save_overlay: bool = False,
    overlay_alpha: float = 0.5
):
    """
    Generate pseudo-masks for all images in directory.

    Args:
        model: Loaded Keras model
        images_dir: Directory containing input images
        output_dir: Output directory for masks
        threshold: Segmentation threshold
        input_size: Model input size
        save_overlay: Whether to save overlay visualizations
        overlay_alpha: Overlay transparency
    """
    images_path = Path(images_dir)
    output_path = Path(output_dir)

    # Create output directories
    output_path.mkdir(parents=True, exist_ok=True)

    if save_overlay:
        overlay_path = output_path / 'overlays'
        overlay_path.mkdir(exist_ok=True)

    # Find all images
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
    image_files = []
    for ext in image_extensions:
        image_files.extend(images_path.glob(ext))

    image_files = sorted(image_files)

    if not image_files:
        logger.warning(f"No images found in {images_dir}")
        return

    logger.info(f"Found {len(image_files)} images")

    # Process each image
    successful = 0
    failed = 0

    for i, image_path in enumerate(image_files):
        try:
            logger.info(f"Processing [{i+1}/{len(image_files)}]: {image_path.name}")

            # Preprocess
            tensor, original, original_size = preprocess_image(
                str(image_path), input_size
            )

            # Inference
            raw_output = model.predict(tensor, verbose=0)

            # Postprocess
            mask = postprocess_mask(raw_output, original_size, threshold)

            # Calculate mask statistics
            positive_ratio = np.sum(mask > 127) / mask.size * 100
            logger.info(f"  Mask: {mask.shape}, positive ratio: {positive_ratio:.1f}%")

            # Save mask (same name as image, but .png)
            mask_filename = image_path.stem + '.png'
            mask_path = output_path / mask_filename

            mask_image = Image.fromarray(mask, mode='L')
            mask_image.save(str(mask_path))

            # Save overlay if requested
            if save_overlay:
                overlay = create_overlay(original, mask, overlay_alpha)
                overlay_filename = image_path.stem + '_overlay.png'
                overlay.save(str(overlay_path / overlay_filename))

            successful += 1

        except Exception as e:
            logger.error(f"  Failed to process {image_path.name}: {e}")
            failed += 1

    logger.info(f"\nComplete: {successful} successful, {failed} failed")
    logger.info(f"Masks saved to: {output_path}")

    if save_overlay:
        logger.info(f"Overlays saved to: {overlay_path}")

    logger.info("\nNext steps:")
    logger.info("1. Review the overlay images to check mask quality")
    logger.info("2. Manually correct any incorrect masks using GIMP/Photoshop")
    logger.info("   - White (255) = nail region")
    logger.info("   - Black (0) = background")
    logger.info("3. Run fine-tuning training:")
    logger.info("   python training/scripts/train_segmentation.py \\")
    logger.info("       --config training/configs/nail_segmentation_v1.yaml \\")
    logger.info("       --resume /path/to/original/model.keras")


def main():
    args = parse_args()

    # Load model
    model = load_model(args.model)

    # Generate masks
    generate_masks(
        model=model,
        images_dir=args.images,
        output_dir=args.output,
        threshold=args.threshold,
        input_size=args.input_size,
        save_overlay=args.save_overlay,
        overlay_alpha=args.overlay_alpha
    )


if __name__ == '__main__':
    main()
