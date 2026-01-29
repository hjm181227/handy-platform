#!/usr/bin/env python3
"""
Generate Segmentation Masks from YOLO Bounding Boxes using SAM

Uses Meta's Segment Anything Model (SAM) to automatically generate
precise segmentation masks from existing bounding box annotations.

Usage:
    # Install SAM first
    pip install segment-anything

    # Download SAM checkpoint (vit_b is smallest, ~375MB)
    wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth

    # Run script
    python tools/generate_masks_from_bbox.py \
        --images datasets/nail_v1/train/images \
        --labels datasets/nail_v1/train/labels \
        --output datasets/nail_v1/train/masks \
        --checkpoint sam_vit_b_01ec64.pth
"""

import os
import sys
import argparse
import logging
from pathlib import Path

import numpy as np
from PIL import Image
import cv2

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description='Generate masks from YOLO bboxes using SAM')
    parser.add_argument('--images', type=str, required=True, help='Path to images directory')
    parser.add_argument('--labels', type=str, required=True, help='Path to YOLO labels directory')
    parser.add_argument('--output', type=str, required=True, help='Output directory for masks')
    parser.add_argument('--checkpoint', type=str, default='sam_vit_b_01ec64.pth',
                        help='Path to SAM checkpoint')
    parser.add_argument('--model-type', type=str, default='vit_b',
                        choices=['vit_h', 'vit_l', 'vit_b'],
                        help='SAM model type')
    parser.add_argument('--nail-classes', type=str, default='1,2,3,4,5',
                        help='Comma-separated nail class IDs to include')
    parser.add_argument('--device', type=str, default='cpu',
                        help='Device to use (cpu, cuda, mps)')
    return parser.parse_args()


def load_yolo_labels(label_path, image_size, nail_classes):
    """Load YOLO format labels and convert to pixel coordinates."""
    boxes = []

    if not os.path.exists(label_path):
        return boxes

    img_h, img_w = image_size

    with open(label_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 5:
                class_id = int(parts[0])
                if class_id in nail_classes:
                    x_center = float(parts[1]) * img_w
                    y_center = float(parts[2]) * img_h
                    width = float(parts[3]) * img_w
                    height = float(parts[4]) * img_h

                    x1 = int(x_center - width / 2)
                    y1 = int(y_center - height / 2)
                    x2 = int(x_center + width / 2)
                    y2 = int(y_center + height / 2)

                    boxes.append([x1, y1, x2, y2])

    return boxes


def generate_masks_with_sam(image_path, boxes, sam_predictor):
    """Generate masks using SAM with bounding box prompts."""
    image = cv2.imread(str(image_path))
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    sam_predictor.set_image(image)

    combined_mask = np.zeros(image.shape[:2], dtype=np.uint8)

    for box in boxes:
        input_box = np.array(box)

        masks, scores, _ = sam_predictor.predict(
            point_coords=None,
            point_labels=None,
            box=input_box[None, :],
            multimask_output=True
        )

        # Use the mask with highest score
        best_mask = masks[np.argmax(scores)]
        combined_mask = np.maximum(combined_mask, (best_mask * 255).astype(np.uint8))

    return combined_mask


def generate_masks_simple(image_path, boxes):
    """Generate simple rectangular masks from bounding boxes (no SAM needed)."""
    image = Image.open(image_path)
    mask = np.zeros((image.height, image.width), dtype=np.uint8)

    for box in boxes:
        x1, y1, x2, y2 = box
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(image.width, x2)
        y2 = min(image.height, y2)
        mask[y1:y2, x1:x2] = 255

    return mask


def main():
    args = parse_args()

    images_dir = Path(args.images)
    labels_dir = Path(args.labels)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    nail_classes = [int(c) for c in args.nail_classes.split(',')]
    logger.info(f"Nail classes: {nail_classes}")

    # Try to load SAM
    use_sam = False
    sam_predictor = None

    if os.path.exists(args.checkpoint):
        try:
            from segment_anything import sam_model_registry, SamPredictor

            logger.info(f"Loading SAM model: {args.model_type}")
            sam = sam_model_registry[args.model_type](checkpoint=args.checkpoint)
            sam.to(device=args.device)
            sam_predictor = SamPredictor(sam)
            use_sam = True
            logger.info("SAM loaded successfully - using AI-powered segmentation")
        except ImportError:
            logger.warning("segment-anything not installed. Using simple bbox masks.")
            logger.warning("Install with: pip install segment-anything")
        except Exception as e:
            logger.warning(f"Failed to load SAM: {e}. Using simple bbox masks.")
    else:
        logger.warning(f"SAM checkpoint not found: {args.checkpoint}")
        logger.warning("Using simple bounding box masks (lower quality)")
        logger.warning("Download SAM: wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth")

    # Process images
    image_files = list(images_dir.glob('*.jpg')) + list(images_dir.glob('*.png')) + list(images_dir.glob('*.jpeg'))
    logger.info(f"Found {len(image_files)} images")

    processed = 0
    skipped = 0

    for img_path in image_files:
        label_path = labels_dir / f"{img_path.stem}.txt"
        output_path = output_dir / f"{img_path.stem}.png"

        # Load image to get size
        image = Image.open(img_path)
        image_size = (image.height, image.width)

        # Load bounding boxes
        boxes = load_yolo_labels(label_path, image_size, nail_classes)

        if not boxes:
            logger.debug(f"No nail boxes found in {img_path.name}, skipping")
            skipped += 1
            continue

        # Generate mask
        if use_sam:
            mask = generate_masks_with_sam(img_path, boxes, sam_predictor)
        else:
            mask = generate_masks_simple(img_path, boxes)

        # Save mask
        mask_image = Image.fromarray(mask)
        mask_image.save(output_path)

        processed += 1
        if processed % 50 == 0:
            logger.info(f"Processed {processed} images...")

    logger.info(f"\n✅ Done!")
    logger.info(f"   Processed: {processed} images")
    logger.info(f"   Skipped (no nails): {skipped} images")
    logger.info(f"   Output: {output_dir}")


if __name__ == '__main__':
    main()