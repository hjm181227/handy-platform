#!/usr/bin/env python3
"""
Nail Segmentation Model Export Script

Exports trained PyTorch DeepLabV3+ model to TFLite format for mobile deployment.

Usage:
    python export_segmentation.py --model runs/segmentation/exp/best_model.pth --config configs/nail_segmentation_deeplabv3.yaml --output ../models/nail_segmentation/v2.0.0/
    python export_segmentation.py --model best_model.pth --config config.yaml --output ./export --encoder mobilenet_v3_large
"""

import argparse
import hashlib
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import segmentation_models_pytorch as smp
import torch
import yaml


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


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def create_model(config: dict, encoder_override: Optional[str] = None) -> torch.nn.Module:
    """Create segmentation model."""
    model_config = config['model']

    encoder = encoder_override or model_config.get('encoder', 'mobilenet_v3_large')
    num_classes = model_config.get('num_classes', 1)
    activation = model_config.get('activation', 'sigmoid')

    print(f"Creating DeepLabV3+ with encoder: {encoder}")

    model = smp.DeepLabV3Plus(
        encoder_name=encoder,
        encoder_weights=None,  # Will load from checkpoint
        classes=num_classes,
        activation=activation,
    )

    return model


def export_to_onnx(
    model: torch.nn.Module,
    input_size: int,
    output_path: str,
    opset_version: int = 12,
) -> str:
    """Export PyTorch model to ONNX format."""
    model.eval()

    # Create dummy input
    dummy_input = torch.randn(1, 3, input_size, input_size)

    # Export
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        opset_version=opset_version,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'},
        },
    )

    print(f"Exported ONNX model: {output_path}")
    return output_path


def export_to_tflite(
    onnx_path: str,
    output_path: str,
    input_size: int,
    quantize: bool = False,
) -> str:
    """Convert ONNX model to TFLite format."""
    try:
        import onnx
        import tensorflow as tf
        from onnx_tf.backend import prepare
    except ImportError as e:
        print(f"Error: Missing dependencies for TFLite conversion: {e}")
        print("Install with: pip install onnx onnx-tf tensorflow")
        return None

    # Load ONNX model
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)

    # Convert ONNX to TensorFlow
    tf_rep = prepare(onnx_model)

    # Export to SavedModel format
    saved_model_dir = output_path.replace('.tflite', '_saved_model')
    tf_rep.export_graph(saved_model_dir)

    # Convert SavedModel to TFLite
    converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)

    if quantize:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]

    # Convert
    tflite_model = converter.convert()

    # Save TFLite model
    with open(output_path, 'wb') as f:
        f.write(tflite_model)

    # Clean up SavedModel directory
    shutil.rmtree(saved_model_dir)

    print(f"Exported TFLite model: {output_path}")
    return output_path


def export_to_tflite_via_keras(
    model: torch.nn.Module,
    input_size: int,
    output_path: str,
    quantize: bool = False,
) -> Optional[str]:
    """Alternative: Export directly using torch to TFLite via keras conversion."""
    try:
        import tensorflow as tf
    except ImportError:
        print("TensorFlow not installed. Skipping TFLite export.")
        return None

    print("Exporting to TFLite via TorchScript -> ONNX -> TFLite...")

    # First export to ONNX
    onnx_path = output_path.replace('.tflite', '.onnx')
    export_to_onnx(model, input_size, onnx_path)

    # Then convert ONNX to TFLite
    return export_to_tflite(onnx_path, output_path, input_size, quantize)


def verify_tflite_model(tflite_path: str, input_size: int) -> bool:
    """Verify TFLite model by running inference."""
    try:
        import tensorflow as tf

        # Load TFLite model
        interpreter = tf.lite.Interpreter(model_path=tflite_path)
        interpreter.allocate_tensors()

        # Get input/output details
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        print(f"Input shape: {input_details[0]['shape']}")
        print(f"Input dtype: {input_details[0]['dtype']}")
        print(f"Output shape: {output_details[0]['shape']}")
        print(f"Output dtype: {output_details[0]['dtype']}")

        # Run test inference
        input_data = np.random.rand(1, input_size, input_size, 3).astype(np.float32)
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]['index'])

        print(f"Test inference output shape: {output_data.shape}")
        print(f"Output range: [{output_data.min():.4f}, {output_data.max():.4f}]")

        return True
    except Exception as e:
        print(f"TFLite verification failed: {e}")
        return False


def export_model(
    model_path: str,
    config_path: str,
    output_dir: str,
    encoder_override: Optional[str] = None,
    quantize: bool = False,
) -> dict:
    """
    Export model to multiple formats.

    Args:
        model_path: Path to trained PyTorch model weights (.pth)
        config_path: Path to training config YAML
        output_dir: Output directory for exported models
        encoder_override: Override encoder name
        quantize: Apply quantization for smaller model

    Returns:
        Dictionary with export metadata
    """
    # Load configuration
    config = load_config(config_path)
    input_size = config.get('input', {}).get('size', 256)
    encoder = encoder_override or config['model'].get('encoder', 'mobilenet_v3_large')

    print(f"Loading model: {model_path}")
    print(f"Encoder: {encoder}")
    print(f"Input size: {input_size}")

    # Create model architecture
    model = create_model(config, encoder)

    # Load weights
    state_dict = torch.load(model_path, map_location='cpu')
    model.load_state_dict(state_dict)
    model.eval()

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    export_info = {
        'source_model': model_path,
        'config': config_path,
        'exported_at': datetime.now().isoformat(),
        'encoder': encoder,
        'input_size': input_size,
        'quantized': quantize,
        'files': {}
    }

    # Copy original PyTorch model
    pt_dest = os.path.join(output_dir, 'model.pth')
    shutil.copy(model_path, pt_dest)
    export_info['files']['pytorch'] = {
        'filename': 'model.pth',
        'size_bytes': get_file_size(pt_dest),
        'sha256': calculate_sha256(pt_dest)
    }
    print(f"Copied PyTorch model: {pt_dest}")

    # Export to ONNX
    try:
        onnx_path = os.path.join(output_dir, 'model.onnx')
        export_to_onnx(model, input_size, onnx_path)
        export_info['files']['onnx'] = {
            'filename': 'model.onnx',
            'size_bytes': get_file_size(onnx_path),
            'sha256': calculate_sha256(onnx_path)
        }
    except Exception as e:
        print(f"ONNX export failed: {e}")
        export_info['files']['onnx'] = {'error': str(e)}

    # Export to TFLite
    try:
        tflite_path = os.path.join(output_dir, 'nail_segmentation.tflite')
        result = export_to_tflite(
            os.path.join(output_dir, 'model.onnx'),
            tflite_path,
            input_size,
            quantize
        )

        if result and os.path.exists(tflite_path):
            export_info['files']['tflite'] = {
                'filename': 'nail_segmentation.tflite',
                'size_bytes': get_file_size(tflite_path),
                'sha256': calculate_sha256(tflite_path)
            }

            # Verify TFLite model
            print("\nVerifying TFLite model...")
            verify_tflite_model(tflite_path, input_size)
    except Exception as e:
        print(f"TFLite export failed: {e}")
        export_info['files']['tflite'] = {'error': str(e)}

    # Create model metadata for mobile app
    mobile_metadata = {
        'model_name': 'nail_segmentation',
        'version': datetime.now().strftime('%Y.%m.%d'),
        'architecture': 'DeepLabV3Plus',
        'encoder': encoder,
        'input': {
            'shape': [1, input_size, input_size, 3],
            'dtype': 'float32',
            'range': [0, 255],  # Input range
            'format': 'NHWC'  # TFLite uses NHWC
        },
        'output': {
            'shape': [1, input_size, input_size, 1],
            'dtype': 'float32',
            'range': [0, 1],  # Sigmoid output
            'format': 'NHWC'
        },
        'preprocessing': {
            'resize': input_size,
            'normalize': False,  # Raw 0-255 values
            'mean': None,
            'std': None,
        },
        'postprocessing': {
            'threshold': 0.5,
            'output_type': 'binary_mask',
        }
    }

    metadata_path = os.path.join(output_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(mobile_metadata, f, indent=2)
    print(f"Saved model metadata: {metadata_path}")

    # Save export info
    export_info_path = os.path.join(output_dir, 'export_info.json')
    with open(export_info_path, 'w') as f:
        json.dump(export_info, f, indent=2)
    print(f"\nExport info saved: {export_info_path}")

    return export_info


def main():
    parser = argparse.ArgumentParser(description='Export nail segmentation model')
    parser.add_argument('--model', type=str, required=True,
                        help='Path to trained model weights (.pth)')
    parser.add_argument('--config', type=str, required=True,
                        help='Path to training config YAML file')
    parser.add_argument('--output', type=str, required=True,
                        help='Output directory for exported models')
    parser.add_argument('--encoder', type=str, default=None,
                        help='Override encoder (must match trained model)')
    parser.add_argument('--quantize', action='store_true',
                        help='Apply quantization for smaller model')

    args = parser.parse_args()

    if not os.path.exists(args.model):
        print(f"Error: Model not found: {args.model}")
        return

    if not os.path.exists(args.config):
        print(f"Error: Config not found: {args.config}")
        return

    export_model(
        model_path=args.model,
        config_path=args.config,
        output_dir=args.output,
        encoder_override=args.encoder,
        quantize=args.quantize,
    )


if __name__ == '__main__':
    main()
