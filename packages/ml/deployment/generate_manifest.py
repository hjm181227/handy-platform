#!/usr/bin/env python3
"""
Generate OTA Manifest Script

Generates manifest.json for CDN deployment from model registry.

Usage:
    python generate_manifest.py --output manifest.json
    python generate_manifest.py --output manifest.json --cdn-url https://cdn.example.com/models
"""

import argparse
import json
import os
from datetime import datetime


def load_registry() -> dict:
    """Load model registry."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    registry_path = os.path.join(script_dir, '../models/registry/model_registry.json')

    with open(registry_path, 'r') as f:
        return json.load(f)


def generate_manifest(cdn_base_url: str, output_path: str):
    """
    Generate OTA manifest from model registry.

    Args:
        cdn_base_url: Base URL for CDN (e.g., https://cdn.example.com/models)
        output_path: Output path for manifest.json
    """
    registry = load_registry()

    manifest = {
        'version': '1.0.0',
        'generated_at': datetime.now().isoformat(),
        'models': {}
    }

    for model_name, model_info in registry['models'].items():
        # Get production version (or latest if no production)
        prod_version = model_info.get('production') or model_info.get('latest')

        if not prod_version:
            continue

        version_info = model_info['versions'].get(prod_version)
        if not version_info:
            continue

        files = version_info.get('files', {})

        model_manifest = {
            'latest': prod_version,
            'minimum_app_version': '1.0.0',
            'files': {},
            'release_notes': version_info.get('changelog', ''),
            'deprecated_versions': [
                v for v, info in model_info['versions'].items()
                if info.get('status') == 'deprecated'
            ]
        }

        # Android (TFLite)
        if 'tflite' in files:
            tflite_info = files['tflite']
            model_manifest['files']['android'] = {
                'url': f"{cdn_base_url}/{model_name}/v{prod_version}/{tflite_info['filename']}",
                'size': tflite_info.get('size_bytes', 0),
                'checksum': f"sha256:{tflite_info.get('sha256', '')}",
                'format': 'tflite'
            }

        # iOS (CoreML)
        if 'coreml' in files:
            coreml_info = files['coreml']
            filename = coreml_info['filename']
            # CoreML packages need to be zipped for download
            if filename.endswith('.mlpackage'):
                filename = filename + '.zip'
            model_manifest['files']['ios'] = {
                'url': f"{cdn_base_url}/{model_name}/v{prod_version}/{filename}",
                'size': coreml_info.get('size_bytes', 0),
                'checksum': f"sha256:{coreml_info.get('sha256', '')}",
                'format': 'mlpackage'
            }

        manifest['models'][model_name] = model_manifest

    # Write manifest
    with open(output_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"Manifest generated: {output_path}")
    print(f"Models: {list(manifest['models'].keys())}")

    return manifest


def main():
    parser = argparse.ArgumentParser(description='Generate OTA manifest')
    parser.add_argument('--output', type=str, default='manifest.json',
                        help='Output path for manifest.json')
    parser.add_argument('--cdn-url', type=str,
                        default='https://cdn.handy-platform.com/models',
                        help='CDN base URL')

    args = parser.parse_args()
    generate_manifest(args.cdn_url, args.output)


if __name__ == '__main__':
    main()
