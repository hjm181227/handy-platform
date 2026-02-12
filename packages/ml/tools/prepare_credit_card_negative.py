#!/usr/bin/env python3
"""
신용카드 이미지를 negative sample (all-black mask)로 변환하는 스크립트.

Roboflow COCO-MMDetection 포맷에서 이미지를 추출하고,
동일 크기의 all-black PNG 마스크를 생성합니다.
학습 시 모델이 신용카드를 손톱으로 인식하지 않도록 하기 위한 용도입니다.

사용법:
    python prepare_credit_card_negative.py \
        --input "/path/to/credit_card_detect.v1-v1.coco-mmdetection" \
        --output "/path/to/credit_card_negative"
"""

import argparse
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np


def process_split(split_dir: Path, output_images: Path, output_masks: Path) -> int:
    """한 split(train/valid/test)의 이미지를 처리."""
    if not split_dir.exists():
        return 0

    extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
    image_files = [f for f in split_dir.iterdir() if f.suffix.lower() in extensions]

    count = 0
    for img_path in image_files:
        # 이미지 복사
        dst_image = output_images / img_path.name
        shutil.copy2(img_path, dst_image)

        # 이미지 크기 읽기
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"  [SKIP] Cannot read: {img_path.name}")
            continue

        h, w = img.shape[:2]

        # All-black 마스크 생성 (같은 크기)
        mask = np.zeros((h, w), dtype=np.uint8)
        mask_name = img_path.stem + '.png'
        cv2.imwrite(str(output_masks / mask_name), mask)

        count += 1

    return count


def main():
    parser = argparse.ArgumentParser(description='신용카드 negative sample 데이터셋 생성')
    parser.add_argument('--input', type=str, required=True,
                        help='Roboflow 다운로드 디렉토리 (train/valid/test 포함)')
    parser.add_argument('--output', type=str, required=True,
                        help='출력 디렉토리 (images/ + masks/ 생성)')
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)

    if not input_dir.exists():
        print(f"[ERROR] Input directory not found: {input_dir}")
        sys.exit(1)

    # 출력 디렉토리 생성
    output_images = output_dir / 'images'
    output_masks = output_dir / 'masks'
    output_images.mkdir(parents=True, exist_ok=True)
    output_masks.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Credit Card Negative Sample Generator")
    print("=" * 60)
    print(f"Input:  {input_dir}")
    print(f"Output: {output_dir}")

    # train/valid/test 모두 합침
    total = 0
    for split in ['train', 'valid', 'test']:
        split_dir = input_dir / split
        count = process_split(split_dir, output_images, output_masks)
        print(f"  {split}: {count} images")
        total += count

    print(f"\n★ Total: {total} images + {total} black masks")
    print(f"  Images: {output_images}")
    print(f"  Masks:  {output_masks}")


if __name__ == '__main__':
    main()
