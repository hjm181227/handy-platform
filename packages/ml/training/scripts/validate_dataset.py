#!/usr/bin/env python3
"""
Dataset Validation Script

Validates dataset structure, annotations, and generates statistics.

Usage:
    python validate_dataset.py --dataset ../datasets/nail_v1/
"""

import argparse
import json
import os
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image


CLASS_NAMES = [
    'credit_card',
    'nail_thumb',
    'nail_index',
    'nail_middle',
    'nail_ring',
    'nail_little'
]


def validate_yolo_annotation(ann_path: str, num_classes: int = 6) -> Tuple[bool, List[str]]:
    """
    Validate YOLO format annotation file.

    Returns:
        Tuple of (is_valid, list of errors)
    """
    errors = []

    if not os.path.exists(ann_path):
        return False, ['File not found']

    with open(ann_path, 'r') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        parts = line.split()
        if len(parts) != 5:
            errors.append(f"Line {i+1}: Expected 5 values, got {len(parts)}")
            continue

        try:
            class_id = int(parts[0])
            x_center = float(parts[1])
            y_center = float(parts[2])
            width = float(parts[3])
            height = float(parts[4])

            if class_id < 0 or class_id >= num_classes:
                errors.append(f"Line {i+1}: Invalid class_id {class_id}")

            for val, name in [(x_center, 'x_center'), (y_center, 'y_center'),
                              (width, 'width'), (height, 'height')]:
                if val < 0 or val > 1:
                    errors.append(f"Line {i+1}: {name}={val} out of range [0,1]")

        except ValueError as e:
            errors.append(f"Line {i+1}: Parse error - {e}")

    return len(errors) == 0, errors


def validate_image(img_path: str) -> Tuple[bool, List[str]]:
    """Validate image file."""
    errors = []

    if not os.path.exists(img_path):
        return False, ['File not found']

    try:
        with Image.open(img_path) as img:
            img.verify()

        # Re-open to get properties
        with Image.open(img_path) as img:
            width, height = img.size
            if width < 100 or height < 100:
                errors.append(f"Image too small: {width}x{height}")

    except Exception as e:
        errors.append(f"Invalid image: {e}")

    return len(errors) == 0, errors


def count_annotations(ann_path: str) -> Counter:
    """Count annotations by class."""
    counts = Counter()

    if not os.path.exists(ann_path):
        return counts

    with open(ann_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 1:
                try:
                    class_id = int(parts[0])
                    counts[class_id] += 1
                except ValueError:
                    pass

    return counts


def validate_dataset(dataset_path: str) -> Dict:
    """
    Validate entire dataset.

    Expected structure:
        dataset_path/
        ├── images/
        │   ├── train/
        │   ├── val/
        │   └── test/
        ├── annotations/  (or labels/)
        │   ├── train/
        │   ├── val/
        │   └── test/
        └── metadata.json
    """
    print(f"Validating dataset: {dataset_path}")

    results = {
        'valid': True,
        'errors': [],
        'warnings': [],
        'statistics': {
            'total_images': 0,
            'total_annotations': 0,
            'splits': {},
            'class_distribution': {name: 0 for name in CLASS_NAMES}
        }
    }

    # Check directory structure
    images_dir = os.path.join(dataset_path, 'images')
    labels_dir = os.path.join(dataset_path, 'annotations')

    if not os.path.exists(labels_dir):
        labels_dir = os.path.join(dataset_path, 'labels')

    if not os.path.exists(images_dir):
        results['valid'] = False
        results['errors'].append(f"Images directory not found: {images_dir}")
        return results

    if not os.path.exists(labels_dir):
        results['valid'] = False
        results['errors'].append(f"Labels directory not found")
        return results

    # Validate each split
    for split in ['train', 'val', 'test']:
        split_images = os.path.join(images_dir, split)
        split_labels = os.path.join(labels_dir, split)

        if not os.path.exists(split_images):
            results['warnings'].append(f"Split not found: {split}")
            continue

        split_stats = {
            'images': 0,
            'annotations': 0,
            'valid_pairs': 0,
            'missing_labels': 0,
            'invalid_images': 0,
            'invalid_labels': 0,
        }

        # Get image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        image_files = [
            f for f in os.listdir(split_images)
            if os.path.splitext(f)[1].lower() in image_extensions
        ]

        for img_file in image_files:
            img_path = os.path.join(split_images, img_file)
            label_file = os.path.splitext(img_file)[0] + '.txt'
            label_path = os.path.join(split_labels, label_file)

            split_stats['images'] += 1

            # Validate image
            img_valid, img_errors = validate_image(img_path)
            if not img_valid:
                split_stats['invalid_images'] += 1
                results['errors'].extend([f"{img_path}: {e}" for e in img_errors])

            # Check and validate label
            if not os.path.exists(label_path):
                split_stats['missing_labels'] += 1
                results['warnings'].append(f"Missing label: {label_path}")
            else:
                label_valid, label_errors = validate_yolo_annotation(label_path)
                if not label_valid:
                    split_stats['invalid_labels'] += 1
                    results['errors'].extend([f"{label_path}: {e}" for e in label_errors])
                else:
                    split_stats['valid_pairs'] += 1

                # Count annotations
                ann_counts = count_annotations(label_path)
                split_stats['annotations'] += sum(ann_counts.values())

                for class_id, count in ann_counts.items():
                    if class_id < len(CLASS_NAMES):
                        results['statistics']['class_distribution'][CLASS_NAMES[class_id]] += count

        results['statistics']['splits'][split] = split_stats
        results['statistics']['total_images'] += split_stats['images']
        results['statistics']['total_annotations'] += split_stats['annotations']

    # Set validity based on errors
    if results['errors']:
        results['valid'] = False

    return results


def print_report(results: Dict):
    """Print validation report."""
    print("\n" + "=" * 60)
    print("DATASET VALIDATION REPORT")
    print("=" * 60)

    status = "VALID" if results['valid'] else "INVALID"
    print(f"\nStatus: {status}")

    print(f"\nStatistics:")
    print(f"  Total images:      {results['statistics']['total_images']}")
    print(f"  Total annotations: {results['statistics']['total_annotations']}")

    print(f"\nSplits:")
    for split, stats in results['statistics']['splits'].items():
        print(f"  {split}:")
        print(f"    Images:         {stats['images']}")
        print(f"    Annotations:    {stats['annotations']}")
        print(f"    Valid pairs:    {stats['valid_pairs']}")
        if stats['missing_labels']:
            print(f"    Missing labels: {stats['missing_labels']}")
        if stats['invalid_images']:
            print(f"    Invalid images: {stats['invalid_images']}")

    print(f"\nClass distribution:")
    for class_name, count in results['statistics']['class_distribution'].items():
        print(f"  {class_name}: {count}")

    if results['warnings']:
        print(f"\nWarnings ({len(results['warnings'])}):")
        for w in results['warnings'][:10]:
            print(f"  - {w}")
        if len(results['warnings']) > 10:
            print(f"  ... and {len(results['warnings']) - 10} more")

    if results['errors']:
        print(f"\nErrors ({len(results['errors'])}):")
        for e in results['errors'][:10]:
            print(f"  - {e}")
        if len(results['errors']) > 10:
            print(f"  ... and {len(results['errors']) - 10} more")

    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='Validate nail detection dataset')
    parser.add_argument('--dataset', type=str, required=True,
                        help='Path to dataset directory')
    parser.add_argument('--output', type=str, default=None,
                        help='Output path for validation report JSON')

    args = parser.parse_args()

    if not os.path.exists(args.dataset):
        print(f"Error: Dataset not found: {args.dataset}")
        return

    results = validate_dataset(args.dataset)
    print_report(results)

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nReport saved to: {args.output}")


if __name__ == '__main__':
    main()
