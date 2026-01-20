#!/usr/bin/env python3
"""
Nail Detector Training Script

Usage:
    python train.py --config configs/nail_detector_v1.yaml
    python train.py --config configs/nail_detector_v1.yaml --resume runs/train/exp/weights/last.pt
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

import mlflow
import yaml
from ultralytics import YOLO


def load_config(config_path: str) -> dict:
    """Load training configuration from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def setup_mlflow(config: dict) -> str:
    """Setup MLflow experiment tracking."""
    mlflow_config = config.get('mlflow', {})
    tracking_uri = mlflow_config.get('tracking_uri', './mlruns')
    experiment_name = mlflow_config.get('experiment_name', 'nail_detector')

    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(experiment_name)

    return experiment_name


def create_dataset_yaml(config: dict, output_path: str) -> str:
    """Create YOLO format dataset.yaml file."""
    dataset_config = config['dataset']
    model_config = config['model']

    # Class names based on our schema
    class_names = [
        'credit_card',
        'nail_thumb',
        'nail_index',
        'nail_middle',
        'nail_ring',
        'nail_little'
    ]

    dataset_yaml = {
        'path': os.path.abspath(dataset_config['path']),
        'train': dataset_config['train'],
        'val': dataset_config['val'],
        'test': dataset_config.get('test', dataset_config['val']),
        'nc': model_config['num_classes'],
        'names': class_names
    }

    yaml_path = os.path.join(output_path, 'dataset.yaml')
    with open(yaml_path, 'w') as f:
        yaml.dump(dataset_yaml, f)

    return yaml_path


def train(config_path: str, resume: str = None):
    """Main training function."""
    # Load configuration
    config = load_config(config_path)

    print(f"Starting training with config: {config_path}")
    print(f"Model: {config['model']['base']}")
    print(f"Dataset: {config['dataset']['name']}")

    # Setup MLflow
    experiment_name = setup_mlflow(config)

    # Create output directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_dir = f"runs/train/{config['dataset']['name']}_{timestamp}"
    os.makedirs(output_dir, exist_ok=True)

    # Create dataset.yaml
    dataset_yaml = create_dataset_yaml(config, output_dir)

    # Initialize model
    model_config = config['model']
    if resume:
        print(f"Resuming from: {resume}")
        model = YOLO(resume)
    else:
        base_model = f"{model_config['base']}.pt"
        model = YOLO(base_model)

    # Training parameters
    train_config = config['training']
    aug_config = config.get('augmentation', {})

    # Start MLflow run
    with mlflow.start_run(run_name=f"{config['dataset']['name']}_{timestamp}"):
        # Log parameters
        mlflow.log_params({
            'model_base': model_config['base'],
            'dataset': config['dataset']['name'],
            'epochs': train_config['epochs'],
            'batch_size': train_config['batch_size'],
            'image_size': train_config['image_size'],
            'optimizer': train_config['optimizer'],
            'lr0': train_config['lr0'],
        })

        # Train
        results = model.train(
            data=dataset_yaml,
            epochs=train_config['epochs'],
            batch=train_config['batch_size'],
            imgsz=train_config['image_size'],
            optimizer=train_config['optimizer'],
            lr0=train_config['lr0'],
            lrf=train_config['lrf'],
            momentum=train_config['momentum'],
            weight_decay=train_config['weight_decay'],
            warmup_epochs=train_config['warmup_epochs'],
            patience=train_config['patience'],
            # Augmentation
            hsv_h=aug_config.get('hsv_h', 0.015),
            hsv_s=aug_config.get('hsv_s', 0.7),
            hsv_v=aug_config.get('hsv_v', 0.4),
            degrees=aug_config.get('degrees', 0),
            translate=aug_config.get('translate', 0.1),
            scale=aug_config.get('scale', 0.5),
            shear=aug_config.get('shear', 0),
            flipud=aug_config.get('flipud', 0),
            fliplr=aug_config.get('fliplr', 0.5),
            mosaic=aug_config.get('mosaic', 1.0),
            mixup=aug_config.get('mixup', 0),
            # Output
            project=output_dir,
            name='train',
            exist_ok=True,
            pretrained=model_config.get('pretrained', True),
            verbose=True,
        )

        # Log metrics
        if results:
            metrics = results.results_dict
            mlflow.log_metrics({
                'mAP50': metrics.get('metrics/mAP50(B)', 0),
                'mAP50_95': metrics.get('metrics/mAP50-95(B)', 0),
                'precision': metrics.get('metrics/precision(B)', 0),
                'recall': metrics.get('metrics/recall(B)', 0),
            })

        # Log model artifacts
        best_model_path = os.path.join(output_dir, 'train', 'weights', 'best.pt')
        if os.path.exists(best_model_path):
            mlflow.log_artifact(best_model_path)

        print(f"\nTraining completed!")
        print(f"Results saved to: {output_dir}")
        print(f"Best model: {best_model_path}")

        return output_dir, best_model_path


def main():
    parser = argparse.ArgumentParser(description='Train nail detector model')
    parser.add_argument('--config', type=str, required=True,
                        help='Path to training config YAML file')
    parser.add_argument('--resume', type=str, default=None,
                        help='Path to checkpoint to resume from')

    args = parser.parse_args()

    if not os.path.exists(args.config):
        print(f"Error: Config file not found: {args.config}")
        sys.exit(1)

    train(args.config, args.resume)


if __name__ == '__main__':
    main()
