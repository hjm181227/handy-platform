#!/usr/bin/env python3
"""
Export Segmentation Model to TFLite/CoreML

Converts trained Keras segmentation model to mobile formats.

Usage:
    python training/scripts/export_segmentation.py --model runs/segment/train_xxx/best_model.keras --output models/nail_segmentation/v1.0.0/
"""

import os
import sys
import argparse
import json
import logging
from pathlib import Path
from datetime import datetime

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
from tensorflow import keras
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description='Export segmentation model to mobile formats')
    parser.add_argument('--model', type=str, required=True,
                        help='Path to trained Keras model (.keras)')
    parser.add_argument('--output', type=str, required=True,
                        help='Output directory for exported models')
    parser.add_argument('--quantization', type=str, default='float16',
                        choices=['none', 'float16', 'int8'],
                        help='TFLite quantization type')
    parser.add_argument('--input-size', type=int, default=256,
                        help='Model input size (default: 256)')
    return parser.parse_args()


def export_tflite(model, output_path: Path, quantization: str = 'float16', input_size: int = 256):
    """
    Export model to TFLite format.

    Args:
        model: Keras model
        output_path: Output directory
        quantization: Quantization type ('none', 'float16', 'int8')
        input_size: Input image size
    """
    logger.info("Exporting to TFLite...")

    # Create converter
    converter = tf.lite.TFLiteConverter.from_keras_model(model)

    # Set optimization options
    if quantization == 'float16':
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        logger.info("Using float16 quantization")
    elif quantization == 'int8':
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        # For full int8 quantization, you'd need representative dataset
        # converter.representative_dataset = representative_data_gen
        logger.info("Using default quantization (float32 with size optimization)")
    else:
        logger.info("No quantization (float32)")

    # Convert
    tflite_model = converter.convert()

    # Save
    tflite_path = output_path / 'nail_segmentation.tflite'
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)

    # Get model info
    interpreter = tf.lite.Interpreter(model_content=tflite_model)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    model_info = {
        'format': 'tflite',
        'quantization': quantization,
        'file_size_bytes': len(tflite_model),
        'file_size_mb': round(len(tflite_model) / (1024 * 1024), 2),
        'input': {
            'name': input_details[0]['name'],
            'shape': input_details[0]['shape'].tolist(),
            'dtype': str(input_details[0]['dtype'])
        },
        'output': {
            'name': output_details[0]['name'],
            'shape': output_details[0]['shape'].tolist(),
            'dtype': str(output_details[0]['dtype'])
        }
    }

    logger.info(f"TFLite model saved to: {tflite_path}")
    logger.info(f"Model size: {model_info['file_size_mb']} MB")
    logger.info(f"Input shape: {model_info['input']['shape']}")
    logger.info(f"Output shape: {model_info['output']['shape']}")

    return model_info


def export_coreml(model, output_path: Path, input_size: int = 256):
    """
    Export model to CoreML format (iOS).

    Args:
        model: Keras model
        output_path: Output directory
        input_size: Input image size
    """
    try:
        import coremltools as ct
    except ImportError:
        logger.warning("coremltools not installed. Skipping CoreML export.")
        logger.warning("Install with: pip install coremltools")
        return None

    logger.info("Exporting to CoreML...")

    # Convert to CoreML
    mlmodel = ct.convert(
        model,
        inputs=[ct.ImageType(
            name='image',
            shape=(1, input_size, input_size, 3),
            scale=1/255.0
        )],
        minimum_deployment_target=ct.target.iOS14
    )

    # Save
    coreml_path = output_path / 'nail_segmentation.mlmodel'
    mlmodel.save(str(coreml_path))

    model_info = {
        'format': 'coreml',
        'minimum_ios': '14.0',
        'file_path': str(coreml_path)
    }

    logger.info(f"CoreML model saved to: {coreml_path}")

    return model_info


def verify_tflite_model(model_path: Path, input_size: int = 256):
    """
    Verify TFLite model with random input.

    Args:
        model_path: Path to TFLite model
        input_size: Input image size
    """
    logger.info("Verifying TFLite model...")

    # Load model
    interpreter = tf.lite.Interpreter(model_path=str(model_path))
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Create random input
    input_data = np.random.rand(1, input_size, input_size, 3).astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], input_data)

    # Run inference
    import time
    start = time.time()
    interpreter.invoke()
    inference_time = (time.time() - start) * 1000

    # Get output
    output_data = interpreter.get_tensor(output_details[0]['index'])

    logger.info(f"Inference time: {inference_time:.2f} ms")
    logger.info(f"Output shape: {output_data.shape}")
    logger.info(f"Output range: [{output_data.min():.4f}, {output_data.max():.4f}]")

    return {
        'inference_time_ms': round(inference_time, 2),
        'output_shape': list(output_data.shape),
        'output_min': float(output_data.min()),
        'output_max': float(output_data.max())
    }


def main():
    args = parse_args()

    # Create output directory
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    logger.info(f"Loading model from: {args.model}")

    # Custom objects for loading (matches original Kaggle training code)
    def focal_tversky_loss(y_true, y_pred, alpha=0.7, beta=0.3, gamma=0.75):
        """Focal Tversky Loss - handles class imbalance well."""
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.cast(y_pred, tf.float32)
        tp = tf.reduce_sum(y_true * y_pred)
        fp = tf.reduce_sum((1 - y_true) * y_pred)
        fn = tf.reduce_sum(y_true * (1 - y_pred))
        tversky = (tp + 1e-7) / (tp + alpha * fp + beta * fn + 1e-7)
        return tf.pow((1 - tversky), gamma)

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

    # Load model
    model = keras.models.load_model(
        args.model,
        custom_objects={
            'focal_tversky_loss': focal_tversky_loss,
            'iou_metric': iou_metric,
            'dice_coefficient': dice_coefficient
        },
        safe_mode=False
    )

    logger.info("Model loaded successfully")

    # Export to TFLite
    tflite_info = export_tflite(
        model,
        output_path,
        quantization=args.quantization,
        input_size=args.input_size
    )

    # Verify TFLite model
    verification = verify_tflite_model(
        output_path / 'nail_segmentation.tflite',
        input_size=args.input_size
    )
    tflite_info['verification'] = verification

    # Export to CoreML (if available)
    coreml_info = export_coreml(model, output_path, args.input_size)

    # Save export metadata
    metadata = {
        'export_time': datetime.now().isoformat(),
        'source_model': str(args.model),
        'input_size': args.input_size,
        'tflite': tflite_info,
        'coreml': coreml_info
    }

    with open(output_path / 'export_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"\nExport complete!")
    logger.info(f"Output directory: {output_path}")
    logger.info(f"\nFiles:")
    for f in output_path.iterdir():
        logger.info(f"  - {f.name}")


if __name__ == '__main__':
    main()
