#!/usr/bin/env python3
"""
Model Registration Script

Registers a trained and exported model version to the model registry.

Usage:
    python register_model.py --version 1.0.0 --model-dir ../models/nail_detector/v1.0.0/ --status staging
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path


REGISTRY_PATH = '../models/registry/model_registry.json'


def load_registry(registry_path: str) -> dict:
    """Load model registry."""
    with open(registry_path, 'r') as f:
        return json.load(f)


def save_registry(registry: dict, registry_path: str):
    """Save model registry."""
    with open(registry_path, 'w') as f:
        json.dump(registry, f, indent=2)


def load_export_metadata(model_dir: str) -> dict:
    """Load export metadata from model directory."""
    metadata_path = os.path.join(model_dir, 'export_metadata.json')
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return {}


def register_model(
    version: str,
    model_dir: str,
    dataset_version: str,
    status: str = 'development',
    metrics: dict = None,
    changelog: str = None,
    base_model: str = 'yolov8n',
    training_config: str = None,
):
    """
    Register a model version to the registry.

    Args:
        version: Semantic version (e.g., '1.0.0')
        model_dir: Directory containing exported model files
        dataset_version: Dataset version used for training
        status: Model status (development, staging, production, deprecated)
        metrics: Evaluation metrics dictionary
        changelog: Version changelog
        base_model: Base model architecture
        training_config: Path to training config used
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    registry_path = os.path.normpath(os.path.join(script_dir, REGISTRY_PATH))

    print(f"Loading registry: {registry_path}")
    registry = load_registry(registry_path)

    # Load export metadata
    export_metadata = load_export_metadata(model_dir)

    # Create version entry
    version_entry = {
        'version': version,
        'created_at': datetime.now().isoformat(),
        'dataset_version': dataset_version,
        'base_model': base_model,
        'training_config': training_config,
        'status': status,
        'metrics': metrics or {},
        'files': export_metadata.get('files', {}),
        'changelog': changelog or f'Version {version} release'
    }

    # Update registry
    model_name = 'nail_detector'
    if model_name not in registry['models']:
        registry['models'][model_name] = {
            'description': 'Nail detector for size measurement',
            'task': 'object_detection',
            'latest': None,
            'production': None,
            'staging': None,
            'versions': {}
        }

    # Add version
    registry['models'][model_name]['versions'][version] = version_entry

    # Update latest pointer
    registry['models'][model_name]['latest'] = version

    # Update status pointers
    if status == 'production':
        # Deprecate previous production version
        old_prod = registry['models'][model_name].get('production')
        if old_prod and old_prod in registry['models'][model_name]['versions']:
            registry['models'][model_name]['versions'][old_prod]['status'] = 'deprecated'
        registry['models'][model_name]['production'] = version

    elif status == 'staging':
        registry['models'][model_name]['staging'] = version

    # Save registry
    save_registry(registry, registry_path)
    print(f"Model registered: {model_name} v{version} ({status})")

    # Print summary
    print("\n" + "=" * 50)
    print("REGISTRATION SUMMARY")
    print("=" * 50)
    print(f"Model:          {model_name}")
    print(f"Version:        {version}")
    print(f"Status:         {status}")
    print(f"Dataset:        {dataset_version}")
    print(f"Base Model:     {base_model}")
    if metrics:
        print(f"mAP@50:         {metrics.get('mAP50', 'N/A')}")
        print(f"mAP@50-95:      {metrics.get('mAP50_95', 'N/A')}")
    print("=" * 50)

    return version_entry


def main():
    parser = argparse.ArgumentParser(description='Register model to registry')
    parser.add_argument('--version', type=str, required=True,
                        help='Model version (semver format, e.g., 1.0.0)')
    parser.add_argument('--model-dir', type=str, required=True,
                        help='Directory containing exported model files')
    parser.add_argument('--dataset', type=str, required=True,
                        help='Dataset version used for training')
    parser.add_argument('--status', type=str, default='development',
                        choices=['development', 'staging', 'production', 'deprecated'],
                        help='Model status')
    parser.add_argument('--base-model', type=str, default='yolov8n',
                        help='Base model architecture')
    parser.add_argument('--config', type=str, default=None,
                        help='Training config file path')
    parser.add_argument('--metrics', type=str, default=None,
                        help='Path to evaluation metrics JSON')
    parser.add_argument('--changelog', type=str, default=None,
                        help='Version changelog message')

    args = parser.parse_args()

    # Load metrics if provided
    metrics = None
    if args.metrics and os.path.exists(args.metrics):
        with open(args.metrics, 'r') as f:
            metrics_data = json.load(f)
            metrics = metrics_data.get('detection_metrics', {})

    register_model(
        version=args.version,
        model_dir=args.model_dir,
        dataset_version=args.dataset,
        status=args.status,
        metrics=metrics,
        changelog=args.changelog,
        base_model=args.base_model,
        training_config=args.config,
    )


if __name__ == '__main__':
    main()
