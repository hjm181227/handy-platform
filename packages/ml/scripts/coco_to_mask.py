#!/usr/bin/env python3
"""
COCO Polygon Annotation → PNG Mask 변환 스크립트

Roboflow에서 다운로드한 COCO 형식 데이터셋을
DeepLabV3+ 학습에 사용할 수 있는 PNG 마스크로 변환합니다.

Usage:
    python coco_to_mask.py --input /path/to/coco/dataset --output /path/to/output

Output Structure:
    output/
    ├── images/
    │   ├── image1.jpg
    │   └── image2.jpg
    └── masks/
        ├── image1.png
        └── image2.png
"""

import argparse
import json
import os
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from tqdm import tqdm


def parse_args():
    parser = argparse.ArgumentParser(description='Convert COCO polygon annotations to PNG masks')
    parser.add_argument('--input', '-i', required=True, help='Input COCO dataset directory')
    parser.add_argument('--output', '-o', required=True, help='Output directory')
    parser.add_argument('--split', '-s', default='train', help='Dataset split (train/valid/test)')
    return parser.parse_args()


def polygon_to_mask(segmentation, height, width):
    """
    COCO polygon segmentation을 binary mask로 변환

    Args:
        segmentation: List of polygons, each polygon is [x1, y1, x2, y2, ...]
        height: Image height
        width: Image width

    Returns:
        Binary mask (numpy array, 0 or 255)
    """
    mask = np.zeros((height, width), dtype=np.uint8)

    for polygon in segmentation:
        # [x1, y1, x2, y2, ...] → [(x1, y1), (x2, y2), ...]
        points = np.array(polygon).reshape(-1, 2).astype(np.int32)
        cv2.fillPoly(mask, [points], color=255)

    return mask


def convert_coco_to_masks(input_dir, output_dir, split='train'):
    """
    COCO 데이터셋을 이미지 + 마스크 형식으로 변환
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    split_path = input_path / split

    # 출력 디렉토리 생성
    images_dir = output_path / 'images'
    masks_dir = output_path / 'masks'
    images_dir.mkdir(parents=True, exist_ok=True)
    masks_dir.mkdir(parents=True, exist_ok=True)

    # COCO annotation 로드
    annotation_file = split_path / '_annotations.coco.json'
    if not annotation_file.exists():
        raise FileNotFoundError(f"Annotation file not found: {annotation_file}")

    with open(annotation_file, 'r') as f:
        coco_data = json.load(f)

    print(f"=== COCO Dataset Info ===")
    print(f"Images: {len(coco_data['images'])}")
    print(f"Annotations: {len(coco_data['annotations'])}")
    print(f"Categories: {[c['name'] for c in coco_data['categories']]}")
    print()

    # image_id → annotations 매핑 생성
    image_annotations = {}
    for ann in coco_data['annotations']:
        img_id = ann['image_id']
        if img_id not in image_annotations:
            image_annotations[img_id] = []
        image_annotations[img_id].append(ann)

    # 각 이미지 처리
    converted = 0
    skipped = 0

    for img_info in tqdm(coco_data['images'], desc='Converting'):
        img_id = img_info['id']
        file_name = img_info['file_name']
        height = img_info['height']
        width = img_info['width']

        # 원본 이미지 경로
        src_image = split_path / file_name
        if not src_image.exists():
            print(f"Warning: Image not found: {src_image}")
            skipped += 1
            continue

        # 출력 파일명 (확장자 통일)
        base_name = Path(file_name).stem
        dst_image = images_dir / f"{base_name}.jpg"
        dst_mask = masks_dir / f"{base_name}.png"

        # 이미지 복사
        shutil.copy(src_image, dst_image)

        # 마스크 생성
        if img_id in image_annotations:
            # 모든 annotation을 하나의 마스크로 합침
            mask = np.zeros((height, width), dtype=np.uint8)

            for ann in image_annotations[img_id]:
                if 'segmentation' in ann and ann['segmentation']:
                    ann_mask = polygon_to_mask(ann['segmentation'], height, width)
                    mask = np.maximum(mask, ann_mask)

            # 마스크 저장 (0 or 255)
            cv2.imwrite(str(dst_mask), mask)
        else:
            # annotation이 없는 경우 빈 마스크
            mask = np.zeros((height, width), dtype=np.uint8)
            cv2.imwrite(str(dst_mask), mask)

        converted += 1

    print()
    print(f"=== Conversion Complete ===")
    print(f"Converted: {converted}")
    print(f"Skipped: {skipped}")
    print(f"Output directory: {output_path}")
    print()
    print(f"Images: {images_dir}")
    print(f"Masks: {masks_dir}")


def verify_conversion(output_dir, num_samples=3):
    """
    변환 결과 검증
    """
    output_path = Path(output_dir)
    images_dir = output_path / 'images'
    masks_dir = output_path / 'masks'

    images = list(images_dir.glob('*.jpg'))
    print(f"\n=== Verification ===")
    print(f"Total images: {len(images)}")
    print(f"Total masks: {len(list(masks_dir.glob('*.png')))}")

    # 샘플 확인
    for img_path in images[:num_samples]:
        mask_path = masks_dir / f"{img_path.stem}.png"
        if mask_path.exists():
            img = cv2.imread(str(img_path))
            mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)

            print(f"\n{img_path.name}:")
            print(f"  Image size: {img.shape[:2]}")
            print(f"  Mask size: {mask.shape}")
            print(f"  Mask unique values: {np.unique(mask)}")
            print(f"  Mask coverage: {(mask > 0).sum() / mask.size * 100:.2f}%")


def main():
    args = parse_args()

    print("=== COCO to Mask Converter ===")
    print(f"Input: {args.input}")
    print(f"Output: {args.output}")
    print(f"Split: {args.split}")
    print()

    convert_coco_to_masks(args.input, args.output, args.split)
    verify_conversion(args.output)


if __name__ == '__main__':
    main()