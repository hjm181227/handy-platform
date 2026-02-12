#!/usr/bin/env python3
"""
Nail Detector Evaluation Script

Evaluates model performance with special focus on nail width measurement accuracy.

Usage:
    python evaluate.py --model runs/train/exp/weights/best.pt --data dataset.yaml
    python evaluate.py --model runs/train/exp/weights/best.pt --data dataset.yaml --output reports/
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import yaml
from ultralytics import YOLO


# Credit card width in mm (ISO/IEC 7810 ID-1)
CREDIT_CARD_WIDTH_MM = 85.6


def load_model(model_path: str) -> YOLO:
    """Load trained YOLO model."""
    return YOLO(model_path)


def calculate_nail_width_error(
    predictions: List[Dict],
    ground_truth: List[Dict],
    image_width: int
) -> Dict:
    """
    Calculate nail width measurement error.

    Uses credit card detection to establish pixel-to-mm ratio,
    then measures nail width accuracy.
    """
    errors = []

    for pred, gt in zip(predictions, ground_truth):
        # Find credit card in both pred and gt
        pred_card = next((p for p in pred['boxes'] if p['class'] == 0), None)
        gt_card = next((g for g in gt['boxes'] if g['class'] == 0), None)

        if not pred_card or not gt_card:
            continue

        # Calculate pixel-to-mm ratio from credit card
        gt_card_width_px = gt_card['width']
        px_per_mm = gt_card_width_px / CREDIT_CARD_WIDTH_MM

        # Compare nail widths
        for class_id in range(1, 6):  # nail classes
            pred_nail = next((p for p in pred['boxes'] if p['class'] == class_id), None)
            gt_nail = next((g for g in gt['boxes'] if g['class'] == class_id), None)

            if pred_nail and gt_nail:
                pred_width_mm = pred_nail['width'] / px_per_mm
                gt_width_mm = gt_nail['width'] / px_per_mm
                error_mm = abs(pred_width_mm - gt_width_mm)
                errors.append({
                    'class_id': class_id,
                    'pred_mm': pred_width_mm,
                    'gt_mm': gt_width_mm,
                    'error_mm': error_mm
                })

    if not errors:
        return {'mean': None, 'std': None, 'p95': None}

    error_values = [e['error_mm'] for e in errors]
    return {
        'mean': float(np.mean(error_values)),
        'std': float(np.std(error_values)),
        'p95': float(np.percentile(error_values, 95)),
        'max': float(np.max(error_values)),
        'min': float(np.min(error_values)),
        'count': len(error_values)
    }


def evaluate(
    model_path: str,
    data_yaml: str,
    output_dir: str = None,
    split: str = 'test'
) -> Dict:
    """
    Evaluate model on dataset.

    Returns:
        Dictionary with evaluation metrics
    """
    print(f"Loading model: {model_path}")
    model = load_model(model_path)

    print(f"Evaluating on: {data_yaml} ({split} split)")

    # Run validation
    results = model.val(
        data=data_yaml,
        split=split,
        verbose=True,
        save_json=True,
    )

    # Extract metrics
    metrics = {
        'model_path': model_path,
        'dataset': data_yaml,
        'split': split,
        'evaluated_at': datetime.now().isoformat(),
        'detection_metrics': {
            'mAP50': float(results.results_dict.get('metrics/mAP50(B)', 0)),
            'mAP50_95': float(results.results_dict.get('metrics/mAP50-95(B)', 0)),
            'precision': float(results.results_dict.get('metrics/precision(B)', 0)),
            'recall': float(results.results_dict.get('metrics/recall(B)', 0)),
        },
        'per_class_metrics': {},
        'speed': {
            'preprocess_ms': float(results.speed.get('preprocess', 0)),
            'inference_ms': float(results.speed.get('inference', 0)),
            'postprocess_ms': float(results.speed.get('postprocess', 0)),
        }
    }

    # Per-class metrics
    class_names = ['credit_card', 'nail_thumb', 'nail_index', 'nail_middle', 'nail_ring', 'nail_little']
    if hasattr(results, 'maps') and results.maps is not None:
        for i, name in enumerate(class_names):
            if i < len(results.maps):
                metrics['per_class_metrics'][name] = {
                    'mAP50': float(results.maps[i]) if results.maps[i] else 0
                }

    # Save results
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_path = os.path.join(output_dir, f'evaluation_{timestamp}.json')

        with open(output_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        print(f"\nResults saved to: {output_path}")

    # Print summary
    print("\n" + "=" * 50)
    print("EVALUATION SUMMARY")
    print("=" * 50)
    print(f"mAP@50:     {metrics['detection_metrics']['mAP50']:.4f}")
    print(f"mAP@50-95:  {metrics['detection_metrics']['mAP50_95']:.4f}")
    print(f"Precision:  {metrics['detection_metrics']['precision']:.4f}")
    print(f"Recall:     {metrics['detection_metrics']['recall']:.4f}")
    print(f"Inference:  {metrics['speed']['inference_ms']:.2f}ms")
    print("=" * 50)

    return metrics


def main():
    parser = argparse.ArgumentParser(description='Evaluate nail detector model')
    parser.add_argument('--model', type=str, required=True,
                        help='Path to trained model weights')
    parser.add_argument('--data', type=str, required=True,
                        help='Path to dataset.yaml')
    parser.add_argument('--split', type=str, default='test',
                        choices=['train', 'val', 'test'],
                        help='Dataset split to evaluate on')
    parser.add_argument('--output', type=str, default=None,
                        help='Output directory for evaluation report')

    args = parser.parse_args()

    if not os.path.exists(args.model):
        print(f"Error: Model not found: {args.model}")
        return

    if not os.path.exists(args.data):
        print(f"Error: Dataset config not found: {args.data}")
        return

    evaluate(args.model, args.data, args.output, args.split)


if __name__ == '__main__':
    main()
