#!/usr/bin/env python3
"""
데이터셋 준비 도구

기능:
1. 원본 이미지 리사이즈 및 정규화
2. train/val/test 분할
3. Label Studio 내보내기를 YOLO 형식으로 변환
4. 데이터셋 메타데이터 업데이트

사용법:
    python prepare_dataset.py --input raw_images/ --output datasets/nail_v1/
    python prepare_dataset.py --label-studio export.json --output datasets/nail_v1/
"""

import argparse
import json
import os
import random
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image


# 클래스 매핑
CLASS_MAPPING = {
    'credit_card': 0,
    'nail_thumb': 1,
    'nail_index': 2,
    'nail_middle': 3,
    'nail_ring': 4,
    'nail_little': 5,
}


def resize_image(
    input_path: str,
    output_path: str,
    max_size: int = 1280,
    quality: int = 90
) -> Tuple[int, int]:
    """이미지 리사이즈 및 저장."""
    with Image.open(input_path) as img:
        # EXIF 회전 적용
        img = apply_exif_rotation(img)

        # 비율 유지하며 리사이즈
        original_size = img.size
        ratio = min(max_size / img.width, max_size / img.height)

        if ratio < 1:
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # RGB 변환 (RGBA, P 모드 처리)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # 저장
        img.save(output_path, 'JPEG', quality=quality)

        return img.size


def apply_exif_rotation(img: Image.Image) -> Image.Image:
    """EXIF 정보에 따른 이미지 회전."""
    try:
        from PIL import ExifTags
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break

        exif = img._getexif()
        if exif is not None:
            orientation_value = exif.get(orientation)
            if orientation_value == 3:
                img = img.rotate(180, expand=True)
            elif orientation_value == 6:
                img = img.rotate(270, expand=True)
            elif orientation_value == 8:
                img = img.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        pass

    return img


def split_dataset(
    images: List[str],
    train_ratio: float = 0.7,
    val_ratio: float = 0.2,
    seed: int = 42
) -> Dict[str, List[str]]:
    """데이터셋을 train/val/test로 분할."""
    random.seed(seed)
    shuffled = images.copy()
    random.shuffle(shuffled)

    total = len(shuffled)
    train_end = int(total * train_ratio)
    val_end = int(total * (train_ratio + val_ratio))

    return {
        'train': shuffled[:train_end],
        'val': shuffled[train_end:val_end],
        'test': shuffled[val_end:]
    }


def convert_label_studio_to_yolo(
    label_studio_json: str,
    output_dir: str,
    images_dir: str = None
) -> Dict:
    """Label Studio JSON을 YOLO 형식으로 변환."""

    with open(label_studio_json, 'r') as f:
        data = json.load(f)

    stats = {
        'total_images': 0,
        'total_annotations': 0,
        'class_counts': {name: 0 for name in CLASS_MAPPING.keys()}
    }

    labels_dir = Path(output_dir) / 'annotations'
    labels_dir.mkdir(parents=True, exist_ok=True)

    for task in data:
        image_path = task.get('data', {}).get('image', '')
        image_name = Path(image_path).stem

        annotations = task.get('annotations', [])
        if not annotations:
            continue

        # 가장 최근 annotation 사용
        annotation = annotations[-1]
        results = annotation.get('result', [])

        yolo_lines = []

        for result in results:
            if result.get('type') != 'rectanglelabels':
                continue

            value = result.get('value', {})
            labels = value.get('rectanglelabels', [])

            if not labels:
                continue

            label = labels[0]
            if label not in CLASS_MAPPING:
                continue

            class_id = CLASS_MAPPING[label]

            # Label Studio 좌표 (%, 원점 좌상단)
            x = value.get('x', 0) / 100
            y = value.get('y', 0) / 100
            width = value.get('width', 0) / 100
            height = value.get('height', 0) / 100

            # YOLO 좌표 (중심점 기준)
            x_center = x + width / 2
            y_center = y + height / 2

            yolo_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
            stats['class_counts'][label] += 1
            stats['total_annotations'] += 1

        if yolo_lines:
            label_file = labels_dir / f"{image_name}.txt"
            with open(label_file, 'w') as f:
                f.write('\n'.join(yolo_lines))

            stats['total_images'] += 1

    return stats


def process_raw_images(
    input_dir: str,
    output_dir: str,
    max_size: int = 1280
) -> List[str]:
    """원본 이미지 디렉토리 처리."""

    input_path = Path(input_dir)
    output_path = Path(output_dir) / 'images' / 'all'
    output_path.mkdir(parents=True, exist_ok=True)

    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.heic'}
    processed = []

    for img_file in input_path.iterdir():
        if img_file.suffix.lower() not in image_extensions:
            continue

        output_file = output_path / f"{img_file.stem}.jpg"
        try:
            resize_image(str(img_file), str(output_file), max_size)
            processed.append(str(output_file))
            print(f"처리됨: {img_file.name}")
        except Exception as e:
            print(f"오류: {img_file.name} - {e}")

    return processed


def organize_splits(
    dataset_dir: str,
    splits: Dict[str, List[str]]
):
    """이미지와 라벨을 train/val/test 폴더로 분류."""

    for split_name, files in splits.items():
        img_split_dir = Path(dataset_dir) / 'images' / split_name
        lbl_split_dir = Path(dataset_dir) / 'annotations' / split_name
        img_split_dir.mkdir(parents=True, exist_ok=True)
        lbl_split_dir.mkdir(parents=True, exist_ok=True)

        for img_path in files:
            img_file = Path(img_path)
            label_file = Path(dataset_dir) / 'annotations' / f"{img_file.stem}.txt"

            # 이미지 이동
            shutil.move(str(img_file), str(img_split_dir / img_file.name))

            # 라벨 이동 (있으면)
            if label_file.exists():
                shutil.move(str(label_file), str(lbl_split_dir / label_file.name))


def update_metadata(dataset_dir: str, stats: Dict):
    """데이터셋 메타데이터 업데이트."""

    metadata_path = Path(dataset_dir) / 'metadata.json'

    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {}

    metadata['updated_at'] = datetime.now().isoformat()
    metadata['statistics'] = stats

    # Split 통계
    splits_stats = {}
    for split in ['train', 'val', 'test']:
        img_dir = Path(dataset_dir) / 'images' / split
        lbl_dir = Path(dataset_dir) / 'annotations' / split

        if img_dir.exists():
            img_count = len(list(img_dir.glob('*.jpg')))
            lbl_count = len(list(lbl_dir.glob('*.txt'))) if lbl_dir.exists() else 0
            splits_stats[split] = {
                'images': img_count,
                'annotations': lbl_count
            }

    metadata['splits'] = splits_stats

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"메타데이터 업데이트됨: {metadata_path}")


def main():
    parser = argparse.ArgumentParser(description='데이터셋 준비 도구')

    parser.add_argument('--input', type=str,
                        help='원본 이미지 디렉토리')
    parser.add_argument('--output', type=str, required=True,
                        help='출력 데이터셋 디렉토리')
    parser.add_argument('--label-studio', type=str,
                        help='Label Studio 내보내기 JSON 파일')
    parser.add_argument('--max-size', type=int, default=1280,
                        help='이미지 최대 크기 (기본: 1280)')
    parser.add_argument('--split', action='store_true',
                        help='train/val/test 분할 실행')
    parser.add_argument('--train-ratio', type=float, default=0.7,
                        help='학습 데이터 비율 (기본: 0.7)')
    parser.add_argument('--val-ratio', type=float, default=0.2,
                        help='검증 데이터 비율 (기본: 0.2)')

    args = parser.parse_args()

    stats = {}

    # 1. 원본 이미지 처리
    if args.input:
        print(f"\n=== 원본 이미지 처리: {args.input} ===")
        processed = process_raw_images(args.input, args.output, args.max_size)
        print(f"처리된 이미지: {len(processed)}개")

    # 2. Label Studio 변환
    if args.label_studio:
        print(f"\n=== Label Studio 변환: {args.label_studio} ===")
        stats = convert_label_studio_to_yolo(args.label_studio, args.output)
        print(f"변환된 이미지: {stats['total_images']}개")
        print(f"총 어노테이션: {stats['total_annotations']}개")

    # 3. 데이터셋 분할
    if args.split:
        print(f"\n=== 데이터셋 분할 ===")
        all_images_dir = Path(args.output) / 'images' / 'all'
        if all_images_dir.exists():
            all_images = list(all_images_dir.glob('*.jpg'))
            splits = split_dataset(
                [str(p) for p in all_images],
                args.train_ratio,
                args.val_ratio
            )
            organize_splits(args.output, splits)
            print(f"Train: {len(splits['train'])}개")
            print(f"Val: {len(splits['val'])}개")
            print(f"Test: {len(splits['test'])}개")

            # all 폴더 정리
            shutil.rmtree(all_images_dir)

    # 4. 메타데이터 업데이트
    update_metadata(args.output, stats)

    print("\n=== 완료 ===")


if __name__ == '__main__':
    main()
