#!/usr/bin/env python3
"""
Nail Segmentation Training Script

Based on ademakdogan/nails_segmentation architecture (DeepLabV3+)
Uses segmentation-models-pytorch library for flexible encoder selection.

Usage:
    python train_segmentation.py --config configs/nail_segmentation_deeplabv3.yaml
    python train_segmentation.py --config configs/nail_segmentation_deeplabv3.yaml --encoder resnet101
    python train_segmentation.py --config configs/nail_segmentation_deeplabv3.yaml --resume runs/train/exp/best_model.pth
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import albumentations as A
import cv2
import mlflow
import numpy as np
import segmentation_models_pytorch as smp
import torch
import torch.nn as nn
import yaml
from albumentations.pytorch import ToTensorV2
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm


class NailSegmentationDataset(Dataset):
    """Dataset for nail segmentation training."""

    def __init__(
        self,
        images_dir: str,
        masks_dir: str,
        image_size: int = 256,
        augmentation: Optional[A.Compose] = None,
        preprocessing: Optional[A.Compose] = None,
    ):
        self.images_dir = Path(images_dir)
        self.masks_dir = Path(masks_dir)
        self.image_size = image_size
        self.augmentation = augmentation
        self.preprocessing = preprocessing

        # Find all image files
        self.image_files = sorted([
            f for f in self.images_dir.glob('*')
            if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']
        ])

        print(f"Found {len(self.image_files)} images in {images_dir}")

    def __len__(self) -> int:
        return len(self.image_files)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        # Load image
        image_path = self.image_files[idx]
        image = cv2.imread(str(image_path))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Load mask
        mask_name = image_path.stem + '.png'  # Masks are typically PNG
        mask_path = self.masks_dir / mask_name
        if not mask_path.exists():
            # Try with same extension
            mask_path = self.masks_dir / (image_path.stem + image_path.suffix)

        if mask_path.exists():
            mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        else:
            # Create empty mask if not found
            mask = np.zeros((image.shape[0], image.shape[1]), dtype=np.uint8)

        # Resize to target size
        image = cv2.resize(image, (self.image_size, self.image_size))
        mask = cv2.resize(mask, (self.image_size, self.image_size))

        # Normalize mask to 0-1
        mask = (mask > 127).astype(np.float32)

        # Apply augmentation
        if self.augmentation:
            augmented = self.augmentation(image=image, mask=mask)
            image = augmented['image']
            mask = augmented['mask']

        # Apply preprocessing (normalization for encoder)
        if self.preprocessing:
            preprocessed = self.preprocessing(image=image, mask=mask)
            image = preprocessed['image']
            mask = preprocessed['mask']

        # Convert to tensors
        if not isinstance(image, torch.Tensor):
            image = torch.from_numpy(image.transpose(2, 0, 1)).float()
        if not isinstance(mask, torch.Tensor):
            mask = torch.from_numpy(mask).float().unsqueeze(0)

        return image, mask


def get_training_augmentation(config: dict) -> A.Compose:
    """Get augmentation pipeline for training."""
    aug_config = config.get('augmentation', {})

    transforms = [
        A.HorizontalFlip(p=0.5 if aug_config.get('horizontal_flip', True) else 0),
    ]

    if aug_config.get('rotate_limit', 0) > 0:
        transforms.append(A.Rotate(limit=aug_config['rotate_limit'], p=0.5))

    if aug_config.get('brightness_limit', 0) > 0 or aug_config.get('contrast_limit', 0) > 0:
        transforms.append(A.RandomBrightnessContrast(
            brightness_limit=aug_config.get('brightness_limit', 0.2),
            contrast_limit=aug_config.get('contrast_limit', 0.2),
            p=0.5
        ))

    if aug_config.get('hue_shift_limit', 0) > 0:
        transforms.append(A.HueSaturationValue(
            hue_shift_limit=int(aug_config.get('hue_shift_limit', 0.05) * 180),
            sat_shift_limit=int(aug_config.get('saturation_shift_limit', 0.3) * 255),
            val_shift_limit=20,
            p=0.5
        ))

    return A.Compose(transforms)


def get_validation_augmentation() -> A.Compose:
    """Get augmentation pipeline for validation (no augmentation)."""
    return A.Compose([])


def get_preprocessing(preprocessing_fn) -> A.Compose:
    """Get preprocessing transform."""
    return A.Compose([
        A.Lambda(image=preprocessing_fn),
        ToTensorV2(),
    ])


def load_config(config_path: str) -> dict:
    """Load training configuration from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def setup_mlflow(config: dict) -> str:
    """Setup MLflow experiment tracking."""
    mlflow_config = config.get('mlflow', {})
    tracking_uri = mlflow_config.get('tracking_uri', './mlruns')
    experiment_name = mlflow_config.get('experiment_name', 'nail_segmentation')

    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(experiment_name)

    return experiment_name


def create_model(config: dict, encoder_override: Optional[str] = None) -> Tuple[nn.Module, callable]:
    """Create segmentation model."""
    model_config = config['model']

    encoder = encoder_override or model_config.get('encoder', 'mobilenet_v3_large')
    encoder_weights = model_config.get('encoder_weights', 'imagenet')
    num_classes = model_config.get('num_classes', 1)
    activation = model_config.get('activation', 'sigmoid')

    print(f"Creating DeepLabV3+ with encoder: {encoder}")

    model = smp.DeepLabV3Plus(
        encoder_name=encoder,
        encoder_weights=encoder_weights,
        classes=num_classes,
        activation=activation,
    )

    # Get preprocessing function for the encoder
    preprocessing_fn = smp.encoders.get_preprocessing_fn(encoder, encoder_weights)

    return model, preprocessing_fn


def train_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> Tuple[float, float]:
    """Train for one epoch."""
    model.train()
    total_loss = 0
    total_iou = 0
    num_batches = 0

    for images, masks in tqdm(dataloader, desc='Training'):
        images = images.to(device)
        masks = masks.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, masks)
        loss.backward()
        optimizer.step()

        # Calculate IoU
        with torch.no_grad():
            preds = (outputs > 0.5).float()
            intersection = (preds * masks).sum()
            union = preds.sum() + masks.sum() - intersection
            iou = (intersection + 1e-6) / (union + 1e-6)

        total_loss += loss.item()
        total_iou += iou.item()
        num_batches += 1

    return total_loss / num_batches, total_iou / num_batches


def validate_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, float]:
    """Validate for one epoch."""
    model.eval()
    total_loss = 0
    total_iou = 0
    num_batches = 0

    with torch.no_grad():
        for images, masks in tqdm(dataloader, desc='Validation'):
            images = images.to(device)
            masks = masks.to(device)

            outputs = model(images)
            loss = criterion(outputs, masks)

            # Calculate IoU
            preds = (outputs > 0.5).float()
            intersection = (preds * masks).sum()
            union = preds.sum() + masks.sum() - intersection
            iou = (intersection + 1e-6) / (union + 1e-6)

            total_loss += loss.item()
            total_iou += iou.item()
            num_batches += 1

    return total_loss / num_batches, total_iou / num_batches


def train(
    config_path: str,
    encoder_override: Optional[str] = None,
    resume: Optional[str] = None,
):
    """Main training function."""
    # Load configuration
    config = load_config(config_path)

    print(f"Starting training with config: {config_path}")
    print(f"Encoder: {encoder_override or config['model'].get('encoder', 'mobilenet_v3_large')}")

    # Setup device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Setup MLflow
    setup_mlflow(config)

    # Create output directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    encoder_name = encoder_override or config['model'].get('encoder', 'mobilenet_v3_large')
    output_dir = f"runs/segmentation/{encoder_name}_{timestamp}"
    os.makedirs(output_dir, exist_ok=True)

    # Create model
    model, preprocessing_fn = create_model(config, encoder_override)
    model = model.to(device)

    # Resume from checkpoint if provided
    if resume and os.path.exists(resume):
        print(f"Resuming from: {resume}")
        model.load_state_dict(torch.load(resume, map_location=device))

    # Get input size
    input_size = config.get('input', {}).get('size', 256)

    # Create datasets
    dataset_config = config['dataset']
    dataset_path = Path(config_path).parent.parent.parent / dataset_config['path']

    train_dataset = NailSegmentationDataset(
        images_dir=str(dataset_path / dataset_config['train_images']),
        masks_dir=str(dataset_path / dataset_config['train_masks']),
        image_size=input_size,
        augmentation=get_training_augmentation(config),
        preprocessing=get_preprocessing(preprocessing_fn),
    )

    val_dataset = NailSegmentationDataset(
        images_dir=str(dataset_path / dataset_config['val_images']),
        masks_dir=str(dataset_path / dataset_config['val_masks']),
        image_size=input_size,
        augmentation=get_validation_augmentation(),
        preprocessing=get_preprocessing(preprocessing_fn),
    )

    # Create dataloaders
    train_config = config['training']
    batch_size = train_config.get('batch_size', 16)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4,
        pin_memory=True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True,
    )

    # Create loss function
    loss_config = config.get('loss', {})
    loss_type = loss_config.get('type', 'DiceLoss')
    if loss_type == 'DiceLoss':
        criterion = smp.losses.DiceLoss(mode='binary')
    elif loss_type == 'BCEWithLogitsLoss':
        criterion = nn.BCEWithLogitsLoss()
    elif loss_type == 'FocalLoss':
        criterion = smp.losses.FocalLoss(mode='binary')
    else:
        criterion = smp.losses.DiceLoss(mode='binary')

    # Create optimizer
    lr = train_config.get('learning_rate', 0.0001)
    weight_decay = train_config.get('weight_decay', 0.0005)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)

    # Create learning rate scheduler
    scheduler_params = train_config.get('scheduler_params', {})
    scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
        optimizer,
        T_0=scheduler_params.get('T_0', 1),
        T_mult=scheduler_params.get('T_mult', 2),
        eta_min=scheduler_params.get('eta_min', 5e-5),
    )

    # Training loop
    epochs = train_config.get('epochs', 100)
    patience = train_config.get('early_stopping_patience', 20)
    best_iou = 0
    patience_counter = 0

    with mlflow.start_run(run_name=f"{encoder_name}_{timestamp}"):
        # Log parameters
        mlflow.log_params({
            'encoder': encoder_name,
            'input_size': input_size,
            'batch_size': batch_size,
            'learning_rate': lr,
            'epochs': epochs,
        })

        for epoch in range(epochs):
            print(f"\nEpoch {epoch + 1}/{epochs}")

            # Train
            train_loss, train_iou = train_epoch(
                model, train_loader, criterion, optimizer, device
            )

            # Validate
            val_loss, val_iou = validate_epoch(
                model, val_loader, criterion, device
            )

            # Update scheduler
            scheduler.step()

            # Log metrics
            print(f"Train Loss: {train_loss:.4f}, Train IoU: {train_iou:.4f}")
            print(f"Val Loss: {val_loss:.4f}, Val IoU: {val_iou:.4f}")

            mlflow.log_metrics({
                'train_loss': train_loss,
                'train_iou': train_iou,
                'val_loss': val_loss,
                'val_iou': val_iou,
                'lr': optimizer.param_groups[0]['lr'],
            }, step=epoch)

            # Save best model
            if val_iou > best_iou:
                best_iou = val_iou
                patience_counter = 0
                best_model_path = os.path.join(output_dir, 'best_model.pth')
                torch.save(model.state_dict(), best_model_path)
                print(f"Saved best model with IoU: {best_iou:.4f}")
                mlflow.log_artifact(best_model_path)
            else:
                patience_counter += 1

            # Early stopping
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch + 1}")
                break

            # Save last model
            last_model_path = os.path.join(output_dir, 'last_model.pth')
            torch.save(model.state_dict(), last_model_path)

        print(f"\nTraining completed!")
        print(f"Best IoU: {best_iou:.4f}")
        print(f"Results saved to: {output_dir}")

        return output_dir, best_iou


def main():
    parser = argparse.ArgumentParser(description='Train nail segmentation model')
    parser.add_argument('--config', type=str, required=True,
                        help='Path to training config YAML file')
    parser.add_argument('--encoder', type=str, default=None,
                        help='Override encoder (resnet101, mobilenet_v3_large, etc.)')
    parser.add_argument('--resume', type=str, default=None,
                        help='Path to checkpoint to resume from')

    args = parser.parse_args()

    if not os.path.exists(args.config):
        print(f"Error: Config file not found: {args.config}")
        sys.exit(1)

    train(args.config, args.encoder, args.resume)


if __name__ == '__main__':
    main()
