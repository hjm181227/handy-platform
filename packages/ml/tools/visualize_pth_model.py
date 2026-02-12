#!/usr/bin/env python3
"""
PyTorch (.pth) 손톱 세그멘테이션 모델 시각화 스크립트

DeepLabV3+ ResNet101 모델의 예측 결과를 GT 마스크와 비교 시각화합니다.
kaggle_mixed_training.md 학습 설정 기반 (activation=None, CLAHE 전처리).

사용법:
    # GT 비교 시각화 (val 데이터셋)
    python visualize_pth_model.py \
        --model "/path/to/best_model.pth" \
        --input-dir "/path/to/val/images" \
        --masks-dir "/path/to/val/masks" \
        --output-dir "./results"

    # 샘플 수 제한
    python visualize_pth_model.py \
        --model "/path/to/best_model.pth" \
        --input-dir "/path/to/val/images" \
        --masks-dir "/path/to/val/masks" \
        --max-samples 8

    # 단일 이미지 (GT 없이)
    python visualize_pth_model.py \
        --model "/path/to/best_model.pth" \
        --image "/path/to/test.jpg"

    # 후처리 적용 (GaussianBlur + morphological open/close)
    python visualize_pth_model.py \
        --model "/path/to/best_model.pth" \
        --input-dir "/path/to/val/images" \
        --masks-dir "/path/to/val/masks" \
        --smooth
"""

import argparse
import os
import sys
from pathlib import Path

import albumentations as A
import cv2
import matplotlib.pyplot as plt
import numpy as np
import segmentation_models_pytorch as smp
import torch
from albumentations.pytorch import ToTensorV2


def get_val_transform(size):
    """Validation 전처리 (kaggle_mixed_training.md Cell 4)."""
    return A.Compose([
        A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=1.0),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])


def load_model(model_path, encoder='resnet101', device='cpu'):
    """모델 로드 (state_dict / checkpoint 자동 감지)."""
    model = smp.DeepLabV3Plus(
        encoder_name=encoder,
        encoder_weights=None,
        classes=1,
        activation=None,  # raw logits
    )

    data = torch.load(model_path, map_location=device)

    if isinstance(data, dict) and 'model_state_dict' in data:
        model.load_state_dict(data['model_state_dict'])
        epoch = data.get('epoch', '?')
        best_iou = data.get('best_iou', '?')
        val_iou = data.get('val_iou', '?')
        print(f"Checkpoint loaded: epoch={epoch}, best_iou={best_iou}, val_iou={val_iou}")
    else:
        model.load_state_dict(data)
        print("State dict loaded (no epoch/iou info)")

    model = model.to(device)
    model.eval()
    return model


def predict(model, image_rgb, input_size, device, threshold=0.5, smooth=False):
    """이미지 추론 → binary mask 반환.

    Args:
        smooth: GaussianBlur + morphological open/close 후처리 적용
    """
    img_resized = cv2.resize(image_rgb, (input_size, input_size))
    transform = get_val_transform(input_size)
    tensor = transform(image=img_resized)['image'].unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        prob = torch.sigmoid(logits).squeeze().cpu().numpy()

    if smooth:
        prob = cv2.GaussianBlur(prob, (5, 5), 0)

    binary = (prob > threshold).astype(np.uint8)

    if smooth:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return prob, binary.astype(np.float32)


def compute_iou(pred_binary, gt_binary):
    """IoU 계산."""
    intersection = (pred_binary * gt_binary).sum()
    union = pred_binary.sum() + gt_binary.sum() - intersection
    return float((intersection + 1e-6) / (union + 1e-6))


def visualize_with_gt(image_rgb, gt_mask, pred_prob, pred_binary, iou, title, output_path=None):
    """GT 비교 4패널 시각화."""
    fig, axes = plt.subplots(1, 4, figsize=(20, 5))

    # 1. 원본 이미지
    axes[0].imshow(image_rgb)
    axes[0].set_title('Input')
    axes[0].axis('off')

    # 2. Ground Truth
    axes[1].imshow(gt_mask, cmap='gray')
    axes[1].set_title('Ground Truth')
    axes[1].axis('off')

    # 3. 모델 예측
    axes[2].imshow(pred_binary, cmap='gray')
    axes[2].set_title(f'Prediction (IoU: {iou:.4f})')
    axes[2].axis('off')

    # 4. 오버레이 비교 (GT=파랑, Pred=녹색, 겹침=시안)
    h, w = gt_mask.shape
    overlay = cv2.resize(image_rgb, (w, h)).astype(np.float32) / 255.0
    color_overlay = overlay.copy()

    # GT only (파랑)
    gt_only = (gt_mask > 0) & (pred_binary == 0)
    color_overlay[gt_only] = color_overlay[gt_only] * 0.4 + np.array([0.0, 0.0, 1.0]) * 0.6

    # Pred only (빨강)
    pred_only = (pred_binary > 0) & (gt_mask == 0)
    color_overlay[pred_only] = color_overlay[pred_only] * 0.4 + np.array([1.0, 0.0, 0.0]) * 0.6

    # 겹침 (녹색)
    both = (gt_mask > 0) & (pred_binary > 0)
    color_overlay[both] = color_overlay[both] * 0.4 + np.array([0.0, 1.0, 0.0]) * 0.6

    axes[3].imshow(np.clip(color_overlay, 0, 1))
    axes[3].set_title('Overlap (G=match, R=FP, B=FN)')
    axes[3].axis('off')

    fig.suptitle(title, fontsize=12, fontweight='bold')
    plt.tight_layout()

    if output_path:
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
    else:
        plt.show()


def visualize_single(image_rgb, pred_prob, pred_binary, title, output_path=None):
    """단일 이미지 시각화 (GT 없음)."""
    fig, axes = plt.subplots(1, 4, figsize=(20, 5))

    axes[0].imshow(image_rgb)
    axes[0].set_title('Input')
    axes[0].axis('off')

    im = axes[1].imshow(pred_prob, cmap='hot', vmin=0, vmax=1)
    axes[1].set_title('Probability Map')
    axes[1].axis('off')
    plt.colorbar(im, ax=axes[1], fraction=0.046)

    axes[2].imshow(pred_binary, cmap='gray')
    axes[2].set_title('Binary Mask')
    axes[2].axis('off')

    # 녹색 오버레이
    h, w = pred_binary.shape
    overlay = cv2.resize(image_rgb, (w, h)).astype(np.float32) / 255.0
    mask_area = pred_binary > 0
    overlay[mask_area] = overlay[mask_area] * 0.5 + np.array([0.0, 1.0, 0.0]) * 0.5
    axes[3].imshow(np.clip(overlay, 0, 1))
    axes[3].set_title(f'Overlay (positive: {pred_binary.mean()*100:.1f}%)')
    axes[3].axis('off')

    fig.suptitle(title, fontsize=12, fontweight='bold')
    plt.tight_layout()

    if output_path:
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
    else:
        plt.show()


def main():
    parser = argparse.ArgumentParser(description='PyTorch 손톱 세그멘테이션 모델 시각화')
    parser.add_argument('--model', type=str, required=True, help='모델 파일 경로 (.pth)')
    parser.add_argument('--image', type=str, help='단일 이미지 경로')
    parser.add_argument('--input-dir', type=str, help='이미지 디렉토리')
    parser.add_argument('--masks-dir', type=str, help='GT 마스크 디렉토리')
    parser.add_argument('--output-dir', type=str, help='출력 디렉토리')
    parser.add_argument('--input-size', type=int, default=800, help='모델 입력 크기 (default: 800)')
    parser.add_argument('--threshold', type=float, default=0.5, help='이진화 threshold (default: 0.5)')
    parser.add_argument('--encoder', type=str, default='resnet101', help='Encoder 이름 (default: resnet101)')
    parser.add_argument('--max-samples', type=int, default=0, help='최대 시각화 샘플 수 (0=전체)')
    parser.add_argument('--smooth', action='store_true', help='GaussianBlur + morphological 후처리 적용')
    args = parser.parse_args()

    if not args.image and not args.input_dir:
        parser.print_help()
        print("\n[ERROR] --image 또는 --input-dir 중 하나를 지정해야 합니다.")
        sys.exit(1)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")
    print(f"Input size: {args.input_size}x{args.input_size}")
    print(f"Threshold: {args.threshold}")
    print(f"Smooth: {args.smooth}")

    # 모델 로드
    model = load_model(args.model, args.encoder, device)

    # 단일 이미지 모드
    if args.image:
        img = cv2.imread(args.image)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        prob, binary = predict(model, img_rgb, args.input_size, device, args.threshold, args.smooth)

        title = f'{Path(args.image).name} | {args.input_size}px'
        output_path = args.output_dir and os.path.join(args.output_dir, f'viz_{Path(args.image).stem}.png')
        if output_path:
            os.makedirs(args.output_dir, exist_ok=True)

        visualize_single(
            cv2.resize(img_rgb, (args.input_size, args.input_size)),
            prob, binary, title, output_path,
        )
        if output_path:
            print(f"Saved: {output_path}")
        return

    # 디렉토리 모드
    input_dir = Path(args.input_dir)
    extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
    image_files = sorted([f for f in input_dir.iterdir() if f.suffix.lower() in extensions])

    if args.max_samples > 0:
        image_files = image_files[:args.max_samples]

    has_gt = args.masks_dir and os.path.isdir(args.masks_dir)
    masks_dir = Path(args.masks_dir) if has_gt else None

    if args.output_dir:
        os.makedirs(args.output_dir, exist_ok=True)

    print(f"\nImages: {len(image_files)} | GT masks: {'YES' if has_gt else 'NO'}")
    print("=" * 60)

    iou_list = []

    for i, img_path in enumerate(image_files):
        img = cv2.imread(str(img_path))
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (args.input_size, args.input_size))

        prob, binary = predict(model, img_rgb, args.input_size, device, args.threshold, args.smooth)

        output_path = None
        if args.output_dir:
            output_path = os.path.join(args.output_dir, f'viz_{img_path.stem}.png')

        if has_gt:
            # GT 마스크 로드
            mask_path = masks_dir / (img_path.stem + '.png')
            if not mask_path.exists():
                mask_path = masks_dir / (img_path.stem + img_path.suffix)

            if mask_path.exists():
                gt = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
                gt = cv2.resize(gt, (args.input_size, args.input_size))
                gt_binary = (gt > 127).astype(np.float32)

                iou = compute_iou(binary, gt_binary)
                iou_list.append(iou)

                title = f'[{i+1}/{len(image_files)}] {img_path.name} | IoU: {iou:.4f}'
                print(f"  {title}")

                visualize_with_gt(img_resized, gt_binary, prob, binary, iou, title, output_path)
            else:
                print(f"  [{i+1}/{len(image_files)}] {img_path.name} — GT mask not found, skipping")
        else:
            title = f'[{i+1}/{len(image_files)}] {img_path.name}'
            print(f"  {title}")
            visualize_single(img_resized, prob, binary, title, output_path)

    # 요약
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total images: {len(image_files)}")

    if iou_list:
        iou_arr = np.array(iou_list)
        print(f"Mean IoU:  {iou_arr.mean():.4f}")
        print(f"Std IoU:   {iou_arr.std():.4f}")
        print(f"Min IoU:   {iou_arr.min():.4f}")
        print(f"Max IoU:   {iou_arr.max():.4f}")
        print(f"Median:    {np.median(iou_arr):.4f}")

        # IoU 분포 히스토그램
        if args.output_dir:
            fig, ax = plt.subplots(figsize=(8, 4))
            ax.hist(iou_arr, bins=20, color='steelblue', edgecolor='white', alpha=0.8)
            ax.axvline(x=iou_arr.mean(), color='red', linestyle='--', label=f'Mean: {iou_arr.mean():.4f}')
            ax.set_xlabel('IoU')
            ax.set_ylabel('Count')
            ax.set_title(f'IoU Distribution ({len(iou_list)} images)')
            ax.legend()
            ax.grid(True, alpha=0.3)
            hist_path = os.path.join(args.output_dir, 'iou_distribution.png')
            plt.savefig(hist_path, dpi=150, bbox_inches='tight')
            plt.close()
            print(f"\nIoU histogram saved: {hist_path}")

    if args.output_dir:
        print(f"Output directory: {args.output_dir}")


if __name__ == '__main__':
    main()
