#!/usr/bin/env python3
"""
Nail Segmentation Model Training Script

Trains a DeepLabV3Plus based segmentation model for nail region extraction.
Based on the original Kaggle training code.

Usage:
    python training/scripts/train_segmentation.py --config training/configs/nail_segmentation_v1.yaml
"""

import os
import sys
import argparse
import yaml
import json
import logging
from pathlib import Path
from datetime import datetime
from glob import glob

import numpy as np
from PIL import Image

# TensorFlow/Keras imports
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TF warnings
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description='Train nail segmentation model')
    parser.add_argument('--config', type=str, required=True,
                        help='Path to config YAML file')
    parser.add_argument('--output-dir', type=str, default='runs/segment',
                        help='Output directory for training results')
    parser.add_argument('--resume', type=str, default=None,
                        help='Path to checkpoint to resume from')
    return parser.parse_args()


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


# ------------------------------
# DeepLabV3Plus Model (Original Architecture)
# ------------------------------

def ASPP(x, filters=256):
    """Atrous Spatial Pyramid Pooling module."""
    shape = x.shape

    # 1x1 conv
    conv1 = layers.Conv2D(filters, 1, padding='same', use_bias=False)(x)
    conv1 = layers.BatchNormalization()(conv1)
    conv1 = layers.Activation('relu')(conv1)

    # 3x3 conv, rate=6
    conv2 = layers.Conv2D(filters, 3, padding='same', dilation_rate=6, use_bias=False)(x)
    conv2 = layers.BatchNormalization()(conv2)
    conv2 = layers.Activation('relu')(conv2)

    # 3x3 conv, rate=12
    conv3 = layers.Conv2D(filters, 3, padding='same', dilation_rate=12, use_bias=False)(x)
    conv3 = layers.BatchNormalization()(conv3)
    conv3 = layers.Activation('relu')(conv3)

    # 3x3 conv, rate=18
    conv4 = layers.Conv2D(filters, 3, padding='same', dilation_rate=18, use_bias=False)(x)
    conv4 = layers.BatchNormalization()(conv4)
    conv4 = layers.Activation('relu')(conv4)

    # Image-level pooling
    pool = layers.GlobalAveragePooling2D()(x)
    pool = layers.Reshape((1, 1, shape[-1]))(pool)
    pool = layers.Conv2D(filters, 1, padding='same', use_bias=False)(pool)
    pool = layers.BatchNormalization()(pool)
    pool = layers.Activation('relu')(pool)
    pool = layers.UpSampling2D(size=(shape[1], shape[2]), interpolation='bilinear')(pool)

    # Concatenate all
    concat = layers.Concatenate()([conv1, conv2, conv3, conv4, pool])

    # Final 1x1 conv
    output = layers.Conv2D(filters, 1, padding='same', use_bias=False)(concat)
    output = layers.BatchNormalization()(output)
    output = layers.Activation('relu')(output)

    return output


def DeepLabV3Plus(input_shape=(256, 256, 3), num_classes=1):
    """
    DeepLabV3+ with MobileNetV3Large encoder.
    This matches the original Kaggle training code.
    """
    inputs = keras.Input(shape=input_shape)

    # Encoder: MobileNetV3Large
    base_model = keras.applications.MobileNetV3Large(
        input_tensor=inputs,
        include_top=False,
        weights='imagenet'
    )

    # Low-level features (1/4 resolution)
    low_level_features = base_model.get_layer('expanded_conv_2/project/BatchNorm').output  # 64x64

    # High-level features (1/16 resolution)
    high_level_features = base_model.get_layer('expanded_conv_14/Add').output  # 16x16

    # ASPP
    x = ASPP(high_level_features, filters=256)

    # Upsample ASPP output
    x = layers.UpSampling2D(size=(4, 4), interpolation='bilinear')(x)

    # Process low-level features
    low = layers.Conv2D(48, 1, padding='same', use_bias=False)(low_level_features)
    low = layers.BatchNormalization()(low)
    low = layers.Activation('relu')(low)

    # Concatenate
    x = layers.Concatenate()([x, low])

    # Decoder
    x = layers.Conv2D(256, 3, padding='same', use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)

    x = layers.Conv2D(256, 3, padding='same', use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)

    # Upsample to original size
    x = layers.UpSampling2D(size=(4, 4), interpolation='bilinear')(x)

    # Output
    outputs = layers.Conv2D(num_classes, 1, activation='sigmoid')(x)

    model = Model(inputs, outputs, name='DeepLabV3Plus')

    return model


# ------------------------------
# Focal Tversky Loss (Original)
# ------------------------------

def focal_tversky_loss(y_true, y_pred, alpha=0.7, beta=0.3, gamma=0.75):
    """
    Focal Tversky Loss - handles class imbalance well.
    alpha > beta: penalizes false negatives more (good for small objects like nails)
    """
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.cast(y_pred, tf.float32)

    tp = tf.reduce_sum(y_true * y_pred)
    fp = tf.reduce_sum((1 - y_true) * y_pred)
    fn = tf.reduce_sum(y_true * (1 - y_pred))

    tversky = (tp + 1e-7) / (tp + alpha * fp + beta * fn + 1e-7)
    return tf.pow((1 - tversky), gamma)


# ------------------------------
# Evaluation Metrics (Original)
# ------------------------------

def iou_metric(y_true, y_pred):
    """Intersection over Union metric."""
    y_pred = tf.cast(y_pred > 0.5, tf.float32)
    intersection = tf.reduce_sum(y_true * y_pred)
    union = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred) - intersection
    return (intersection + tf.keras.backend.epsilon()) / (union + tf.keras.backend.epsilon())


def dice_coefficient(y_true, y_pred):
    """Dice coefficient metric."""
    y_pred = tf.cast(y_pred > 0.5, tf.float32)
    numerator = 2 * tf.reduce_sum(y_true * y_pred)
    denominator = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred)
    return (numerator + tf.keras.backend.epsilon()) / (denominator + tf.keras.backend.epsilon())


# ------------------------------
# Dataset with PNG Masks
# ------------------------------

def parse_image_mask(image_path, mask_path, target_size=(256, 256)):
    """
    Parse image and mask files.
    Preprocessing matches original: image * 255.0 for MobileNetV3 input.
    """
    # Load image
    image = tf.io.read_file(image_path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.resize(image, target_size)
    image = image * 255.0  # MobileNetV3 expects 0-255 range

    # Load mask
    mask = tf.io.read_file(mask_path)
    mask = tf.image.decode_png(mask, channels=1)
    mask = tf.image.convert_image_dtype(mask, tf.float32)
    mask = tf.image.resize(mask, target_size, method=tf.image.ResizeMethod.NEAREST_NEIGHBOR)
    mask = tf.where(mask > 0, 1.0, 0.0)

    return image, mask


def augment(image, mask):
    """Data augmentation for training."""
    # Random horizontal flip
    if tf.random.uniform([]) > 0.5:
        image = tf.image.flip_left_right(image)
        mask = tf.image.flip_left_right(mask)

    # Random brightness
    image = tf.image.random_brightness(image, max_delta=25.5)  # ~10% of 255

    # Random contrast
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)

    # Clip values
    image = tf.clip_by_value(image, 0.0, 255.0)

    return image, mask


def create_dataset(image_paths, mask_paths, batch_size=16, augment_data=False, shuffle=True):
    """Create tf.data.Dataset from image and mask paths."""
    dataset = tf.data.Dataset.from_tensor_slices((image_paths, mask_paths))

    if shuffle:
        dataset = dataset.shuffle(buffer_size=len(image_paths))

    dataset = dataset.map(
        lambda x, y: parse_image_mask(x, y),
        num_parallel_calls=tf.data.AUTOTUNE
    )

    if augment_data:
        dataset = dataset.map(
            lambda x, y: augment(x, y),
            num_parallel_calls=tf.data.AUTOTUNE
        )

    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(tf.data.AUTOTUNE)

    return dataset


# ------------------------------
# Dataset with YOLO Labels (Fallback)
# ------------------------------

def create_mask_from_yolo(label_path, image_size, target_size=(256, 256), nail_classes=[1, 2, 3, 4, 5]):
    """
    Create mask from YOLO format labels.
    Used when PNG masks are not available.
    """
    mask = np.zeros((target_size[0], target_size[1], 1), dtype=np.float32)

    if os.path.exists(label_path):
        with open(label_path, 'r') as f:
            lines = f.readlines()

        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 5:
                class_id = int(parts[0])
                if class_id in nail_classes:
                    x_center = float(parts[1])
                    y_center = float(parts[2])
                    width = float(parts[3])
                    height = float(parts[4])

                    x1 = int((x_center - width / 2) * target_size[1])
                    y1 = int((y_center - height / 2) * target_size[0])
                    x2 = int((x_center + width / 2) * target_size[1])
                    y2 = int((y_center + height / 2) * target_size[0])

                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(target_size[1], x2), min(target_size[0], y2)

                    mask[y1:y2, x1:x2, 0] = 1.0

    return mask


def parse_image_yolo(image_path, label_path, target_size=(256, 256)):
    """Parse image and create mask from YOLO labels."""
    # Load image
    image = tf.io.read_file(image_path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.convert_image_dtype(image, tf.float32)
    orig_size = tf.shape(image)[:2]
    image = tf.image.resize(image, target_size)
    image = image * 255.0

    # Create mask from YOLO (wrapped in py_function)
    mask = tf.py_function(
        lambda p: create_mask_from_yolo(p.numpy().decode('utf-8'), None, target_size),
        [label_path],
        tf.float32
    )
    mask.set_shape([target_size[0], target_size[1], 1])

    return image, mask


def create_dataset_yolo(image_dir, label_dir, batch_size=16, augment_data=False, shuffle=True):
    """Create dataset from YOLO format labels."""
    image_dir = Path(image_dir)
    label_dir = Path(label_dir)

    image_files = sorted(
        list(image_dir.glob('*.jpg')) +
        list(image_dir.glob('*.png')) +
        list(image_dir.glob('*.jpeg'))
    )

    image_paths = [str(p) for p in image_files]
    label_paths = [str(label_dir / f"{p.stem}.txt") for p in image_files]

    logger.info(f"Found {len(image_paths)} images in {image_dir}")

    dataset = tf.data.Dataset.from_tensor_slices((image_paths, label_paths))

    if shuffle:
        dataset = dataset.shuffle(buffer_size=len(image_paths))

    dataset = dataset.map(
        lambda x, y: parse_image_yolo(x, y),
        num_parallel_calls=tf.data.AUTOTUNE
    )

    if augment_data:
        dataset = dataset.map(
            lambda x, y: augment(x, y),
            num_parallel_calls=tf.data.AUTOTUNE
        )

    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(tf.data.AUTOTUNE)

    return dataset, len(image_paths)


# ------------------------------
# Training Function
# ------------------------------

def train(config: dict, output_dir: str, resume_path: str = None):
    """Main training function."""

    # Create output directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    run_dir = Path(output_dir) / f"train_{timestamp}"
    run_dir.mkdir(parents=True, exist_ok=True)

    log_dir = run_dir / 'logs'
    log_dir.mkdir(exist_ok=True)

    logger.info(f"Output directory: {run_dir}")

    # Save config
    with open(run_dir / 'config.yaml', 'w') as f:
        yaml.dump(config, f)

    # Dataset paths
    dataset_root = Path(config['dataset']['root'])
    input_size = config['model']['input_size']
    batch_size = config['training']['batch_size']

    # Check for PNG masks or YOLO labels
    train_mask_dir = dataset_root / 'train' / 'masks'
    use_png_masks = train_mask_dir.exists() and len(list(train_mask_dir.glob('*.png'))) > 0

    if use_png_masks:
        logger.info("Using PNG mask files")
        train_images = sorted(glob(str(dataset_root / 'train' / 'images' / '*.jpg')))
        train_masks = sorted(glob(str(dataset_root / 'train' / 'masks' / '*.png')))
        val_images = sorted(glob(str(dataset_root / 'val' / 'images' / '*.jpg')))
        val_masks = sorted(glob(str(dataset_root / 'val' / 'masks' / '*.png')))

        train_ds = create_dataset(train_images, train_masks, batch_size, augment_data=True)
        val_ds = create_dataset(val_images, val_masks, batch_size, augment_data=False, shuffle=False)

        steps_per_epoch = len(train_images) // batch_size
        validation_steps = len(val_images) // batch_size
    else:
        logger.info("Using YOLO labels (converting to masks)")
        train_ds, train_count = create_dataset_yolo(
            dataset_root / 'train' / 'images',
            dataset_root / 'train' / 'labels',
            batch_size, augment_data=True
        )
        val_ds, val_count = create_dataset_yolo(
            dataset_root / 'val' / 'images',
            dataset_root / 'val' / 'labels',
            batch_size, augment_data=False, shuffle=False
        )

        steps_per_epoch = train_count // batch_size
        validation_steps = val_count // batch_size

    logger.info(f"Steps per epoch: {steps_per_epoch}, Validation steps: {validation_steps}")

    # Create model
    model = DeepLabV3Plus(
        input_shape=(input_size, input_size, 3),
        num_classes=1
    )

    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config['training']['learning_rate']),
        loss=focal_tversky_loss,
        metrics=['accuracy', iou_metric, dice_coefficient]
    )

    model.summary(print_fn=logger.info)

    # Resume from checkpoint if specified
    if resume_path:
        logger.info(f"Resuming from checkpoint: {resume_path}")
        model.load_weights(resume_path)

    # Callbacks
    callbacks = [
        ModelCheckpoint(
            filepath=str(run_dir / 'best_model.keras'),
            monitor='val_iou_metric',
            mode='max',
            save_best_only=True,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=str(run_dir / 'last_model.keras'),
            save_best_only=False,
            verbose=0
        ),
        EarlyStopping(
            monitor='val_iou_metric',
            mode='max',
            patience=config['training']['early_stopping']['patience'],
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_iou_metric',
            mode='max',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        TensorBoard(log_dir=str(log_dir))
    ]

    # Train
    logger.info("🚀 Starting training...")

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=config['training']['epochs'],
        steps_per_epoch=steps_per_epoch,
        validation_steps=validation_steps,
        callbacks=callbacks,
        verbose=1
    )

    logger.info("✅ Training complete.")

    # Save training history
    with open(run_dir / 'history.json', 'w') as f:
        history_dict = {k: [float(v) for v in vals] for k, vals in history.history.items()}
        json.dump(history_dict, f, indent=2)

    # Final evaluation
    logger.info("📊 Evaluating on validation set...")
    val_results = model.evaluate(val_ds, steps=validation_steps)

    metrics_names = model.metrics_names
    results_dict = {name: float(val) for name, val in zip(metrics_names, val_results)}

    logger.info(f"Validation results: {results_dict}")

    with open(run_dir / 'final_metrics.json', 'w') as f:
        json.dump(results_dict, f, indent=2)

    return run_dir, model


def main():
    args = parse_args()

    # Load config
    config = load_config(args.config)

    logger.info(f"Config loaded from: {args.config}")
    logger.info(f"Model: DeepLabV3Plus with MobileNetV3Large encoder")
    logger.info(f"Input size: {config['model']['input_size']}x{config['model']['input_size']}")
    logger.info(f"Loss: Focal Tversky Loss")

    # Train
    run_dir, model = train(config, args.output_dir, args.resume)

    logger.info(f"\n✅ Training complete!")
    logger.info(f"Results saved to: {run_dir}")
    logger.info(f"\nTo export the model, run:")
    logger.info(f"  python training/scripts/export_segmentation.py --model {run_dir / 'best_model.keras'}")


if __name__ == '__main__':
    main()
