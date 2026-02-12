#!/usr/bin/env python3
"""
PyTorch -> ONNX 변환 스크립트

v0.0.1 모델(DeepLabV3+ ResNet101, 800x800)을 ONNX 형식으로 변환합니다.
ONNX Runtime으로 추론 시 PyTorch 의존성 없이 ~50MB로 실행 가능.

Usage:
    python scripts/export_to_onnx.py

    # 커스텀 경로
    python scripts/export_to_onnx.py \
        --model models/nail_segmentation/v0.0.1/best_model.pth \
        --output models/nail_segmentation/v0.0.1/model.onnx

    # 검증 포함
    python scripts/export_to_onnx.py --verify
"""

import argparse
import os
import sys
import time
from pathlib import Path

import numpy as np
import torch
import segmentation_models_pytorch as smp


def export_to_onnx(
    model_path: str,
    output_path: str,
    input_size: int = 800,
    encoder: str = "resnet101",
    opset_version: int = 17,
    verify: bool = False,
) -> str:
    """PyTorch 모델을 ONNX로 변환합니다."""

    print(f"[Export] Loading PyTorch model: {model_path}")
    print(f"[Export] Encoder: {encoder}, Input size: {input_size}x{input_size}")

    # 모델 생성
    model = smp.DeepLabV3Plus(
        encoder_name=encoder,
        encoder_weights=None,
        classes=1,
        activation=None,
    )

    # 가중치 로드
    state_dict = torch.load(model_path, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()

    print(f"[Export] Model loaded successfully")

    # 더미 입력 (batch=1, channels=3, H=800, W=800)
    dummy_input = torch.randn(1, 3, input_size, input_size)

    # ONNX export
    print(f"[Export] Exporting to ONNX (opset {opset_version})...")
    start_time = time.time()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch"},
            "output": {0: "batch"},
        },
        opset_version=opset_version,
        do_constant_folding=True,
    )

    export_time = time.time() - start_time
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)

    print(f"[Export] ONNX export completed in {export_time:.1f}s")
    print(f"[Export] Output: {output_path} ({file_size_mb:.1f} MB)")

    # 검증
    if verify:
        verify_onnx(output_path, dummy_input, model)

    return output_path


def verify_onnx(onnx_path: str, dummy_input: torch.Tensor, pytorch_model: torch.nn.Module):
    """ONNX 모델 출력이 PyTorch 모델과 일치하는지 검증합니다."""
    try:
        import onnxruntime as ort
    except ImportError:
        print("[Verify] onnxruntime not installed, skipping verification")
        print("[Verify] Install with: pip install onnxruntime")
        return

    print("[Verify] Verifying ONNX model output...")

    # PyTorch 추론
    with torch.no_grad():
        pytorch_output = pytorch_model(dummy_input).numpy()

    # ONNX Runtime 추론
    session = ort.InferenceSession(onnx_path)
    onnx_output = session.run(None, {"input": dummy_input.numpy()})[0]

    # 비교
    max_diff = np.abs(pytorch_output - onnx_output).max()
    mean_diff = np.abs(pytorch_output - onnx_output).mean()

    print(f"[Verify] Max difference: {max_diff:.8f}")
    print(f"[Verify] Mean difference: {mean_diff:.8f}")

    if max_diff < 1e-4:
        print("[Verify] PASSED - outputs match within tolerance")
    else:
        print(f"[Verify] WARNING - max difference {max_diff:.6f} exceeds 1e-4")


def main():
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX")
    parser.add_argument(
        "--model",
        default="models/nail_segmentation/v0.0.1/best_model.pth",
        help="Path to PyTorch model (.pth)",
    )
    parser.add_argument(
        "--output",
        default="models/nail_segmentation/v0.0.1/model.onnx",
        help="Output ONNX file path",
    )
    parser.add_argument(
        "--input-size",
        type=int,
        default=800,
        help="Model input size (default: 800)",
    )
    parser.add_argument(
        "--encoder",
        default="resnet101",
        help="Encoder name (default: resnet101)",
    )
    parser.add_argument(
        "--opset",
        type=int,
        default=17,
        help="ONNX opset version (default: 17)",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify ONNX output matches PyTorch",
    )

    args = parser.parse_args()

    # packages/ml/ 디렉토리 기준으로 경로 해석
    script_dir = Path(__file__).parent
    ml_dir = script_dir.parent
    os.chdir(ml_dir)

    if not os.path.exists(args.model):
        print(f"[Error] Model file not found: {args.model}")
        sys.exit(1)

    export_to_onnx(
        model_path=args.model,
        output_path=args.output,
        input_size=args.input_size,
        encoder=args.encoder,
        opset_version=args.opset,
        verify=args.verify,
    )


if __name__ == "__main__":
    main()
