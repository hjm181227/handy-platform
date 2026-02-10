#!/usr/bin/env python3
"""
Nail Detector Model Export Script

Exports trained PyTorch model to mobile-friendly formats (TFLite, CoreML).

Usage:
    python export.py --model runs/train/exp/weights/best.pt --output ../models/nail_detector/v1.0.0/
    python export.py --model best.pt --output ./export --formats tflite coreml
"""

import argparse
import hashlib
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import List

from ultralytics import YOLO


def calculate_sha256(file_path: str) -> str:
    """Calculate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    return os.path.getsize(file_path)


def export_model(
    model_path: str,
    output_dir: str,
    formats: List[str] = None,
    image_size: int = 640,
    optimize: bool = True,
    half: bool = True,
) -> dict:
    """
    Export model to specified formats.

    Args:
        model_path: Path to trained .pt model
        output_dir: Output directory for exported models
        formats: List of formats to export ['tflite', 'coreml', 'onnx']
        image_size: Input image size
        optimize: Optimize for mobile
        half: Use FP16 (half precision)

    Returns:
        Dictionary with export metadata
    """
    if formats is None:
        formats = ['tflite', 'coreml', 'onnx']

    print(f"Loading model: {model_path}")
    model = YOLO(model_path)

    os.makedirs(output_dir, exist_ok=True)

    export_info = {
        'source_model': model_path,
        'exported_at': datetime.now().isoformat(),
        'image_size': image_size,
        'optimize': optimize,
        'half': half,
        'files': {}
    }

    # Copy original PyTorch model
    pt_dest = os.path.join(output_dir, 'model.pt')
    shutil.copy(model_path, pt_dest)
    export_info['files']['pytorch'] = {
        'filename': 'model.pt',
        'size_bytes': get_file_size(pt_dest),
        'sha256': calculate_sha256(pt_dest)
    }
    print(f"Copied PyTorch model: {pt_dest}")

    # Export to each format
    for fmt in formats:
        print(f"\nExporting to {fmt}...")
        try:
            if fmt == 'onnx':
                exported = model.export(
                    format='onnx',
                    imgsz=image_size,
                    optimize=optimize,
                    half=half,
                    simplify=True,
                )
                dest_name = 'model.onnx'

            elif fmt == 'tflite':
                exported = model.export(
                    format='tflite',
                    imgsz=image_size,
                    half=half,
                )
                dest_name = 'model.tflite'

            elif fmt == 'coreml':
                exported = model.export(
                    format='coreml',
                    imgsz=image_size,
                    half=half,
                    nms=True,
                )
                dest_name = 'model.mlpackage'

            else:
                print(f"Unknown format: {fmt}, skipping")
                continue

            # Move exported file to output directory
            if exported and os.path.exists(exported):
                dest_path = os.path.join(output_dir, dest_name)

                # Handle directory (CoreML .mlpackage) vs file
                if os.path.isdir(exported):
                    if os.path.exists(dest_path):
                        shutil.rmtree(dest_path)
                    shutil.move(exported, dest_path)
                else:
                    shutil.move(exported, dest_path)

                # Calculate metadata
                if os.path.isdir(dest_path):
                    # For directories, calculate total size
                    total_size = sum(
                        os.path.getsize(os.path.join(dirpath, filename))
                        for dirpath, _, filenames in os.walk(dest_path)
                        for filename in filenames
                    )
                    file_hash = "directory"
                else:
                    total_size = get_file_size(dest_path)
                    file_hash = calculate_sha256(dest_path)

                export_info['files'][fmt] = {
                    'filename': dest_name,
                    'size_bytes': total_size,
                    'sha256': file_hash
                }
                print(f"Exported {fmt}: {dest_path} ({total_size / 1024 / 1024:.2f} MB)")

        except Exception as e:
            print(f"Error exporting {fmt}: {e}")
            export_info['files'][fmt] = {'error': str(e)}

    # Save export metadata
    metadata_path = os.path.join(output_dir, 'export_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(export_info, f, indent=2)
    print(f"\nExport metadata saved: {metadata_path}")

    return export_info


def main():
    parser = argparse.ArgumentParser(description='Export nail detector model')
    parser.add_argument('--model', type=str, required=True,
                        help='Path to trained model weights (.pt)')
    parser.add_argument('--output', type=str, required=True,
                        help='Output directory for exported models')
    parser.add_argument('--formats', nargs='+',
                        default=['onnx', 'tflite', 'coreml'],
                        help='Export formats (default: onnx tflite coreml)')
    parser.add_argument('--imgsz', type=int, default=640,
                        help='Input image size (default: 640)')
    parser.add_argument('--no-optimize', action='store_true',
                        help='Disable optimization')
    parser.add_argument('--fp32', action='store_true',
                        help='Use FP32 instead of FP16')

    args = parser.parse_args()

    if not os.path.exists(args.model):
        print(f"Error: Model not found: {args.model}")
        return

    export_model(
        model_path=args.model,
        output_dir=args.output,
        formats=args.formats,
        image_size=args.imgsz,
        optimize=not args.no_optimize,
        half=not args.fp32,
    )


if __name__ == '__main__':
    main()
