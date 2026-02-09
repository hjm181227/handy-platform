# Mixed Training Kaggle 노트북

> 엄지 + 기존 4손가락 + Roboflow 데이터를 균형있게 학습하여 단일 모델로 최고 성능 달성

## 배경

### 문제점
- 기존 모델 IoU: 0.8446
- 엄지만 Fine-tuning 후: ~0.80 (성능 저하 - Catastrophic Forgetting)

### 해결책: Balanced Mixed Training
- 엄지 데이터 + 기존 데이터 + Roboflow 데이터를 **균형있게 혼합**
- Encoder **부분 Freeze**로 기존 지식 보존 + 새로운 패턴 학습

## 데이터 출처

| 데이터셋 | 출처 | 설명 |
|----------|------|------|
| 기존 데이터 | 내부 수집 | 4손가락 손톱 데이터 (~2,000장) |
| 엄지 데이터 | 내부 촬영 | 엄지 손톱 (18장) |
| Roboflow | [nail_segmentation](https://universe.roboflow.com/nailproject-padk9/nail_segmentation) | COCO → PNG 마스크 변환 (266장) |

---

## 사전 준비 (Kaggle)

### 1. Dataset 업로드
`~/Downloads/thumb_train_dataset.zip`을 Kaggle에 업로드:
- Title: `Thumb Nail Training Data`
- Visibility: Private

### 2. 노트북 Input 추가
| Dataset | 용도 |
|---------|------|
| `nail-segmentation-dataset` | 기존 Train + Validation Set |
| `nail-segmentation-checkpoint-v3` | 기존 학습된 모델 |
| `thumb-nail-training-data` | 엄지 데이터 |
| `roboflow-nail-detection` | Roboflow 손톱 데이터 (266장) |

### 3. GPU 설정
Settings > Accelerator > GPU T4 x2

---

## Cell 1: 환경 설정

```python
!pip install -q segmentation-models-pytorch albumentations

import os
import random
import torch
import torch.nn as nn
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2
import cv2
import numpy as np
from pathlib import Path
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm
import matplotlib.pyplot as plt

print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

# 재현성을 위한 시드 설정
random.seed(42)
np.random.seed(42)
torch.manual_seed(42)
```

---

## Cell 2: Mixed Training 설정

```python
# ★★★ Fine-tuning 전용 설정 (Dice + BCE Combined Loss) ★★★
CONFIG = {
    'encoder': 'resnet101',
    'input_size': 640,
    'epochs': 20,                  # 3차 Fine-tuning: 충분한 학습 (20 epoch)
    'batch_size': 8,               # 충분한 데이터로 배치 증가
    'learning_rate': 0.00001,      # 3차 Fine-tuning: LR 복원 (1e-5)
    'weight_decay': 0.0005,
    'patience': 10,                # 3차 Fine-tuning: 충분한 patience (10)
    'freeze_encoder_layers': 3,    # ★ 처음 3개 layer만 freeze
    'thumb_repeat': 15,            # ★ 엄지 15배 반복
    'original_sample': 300,        # ★ 기존 데이터 300장 샘플링
    'roboflow_sample': 266,        # ★ Roboflow 전체 사용 (266장)
    'dice_weight': 0.4,            # ★ Dice Loss 가중치
    'bce_weight': 0.6,             # ★ BCE Loss 가중치
}

# 체크포인트 동적 탐색 (버전 번호에 의존하지 않음)
_loss_ckpt = list(Path('/kaggle/input/nail-segmentation-loss-checkpoint').glob('**/best_checkpoint.pth'))
CHECKPOINT_FILE = str(_loss_ckpt[0]) if _loss_ckpt else ''
THUMB_DATA_DIR = Path('/kaggle/input/thumb-nail-training-data/thumb_train')
ORIGINAL_TRAIN_DIR = Path('/kaggle/input/nail-segmentation-dataset/NailSegmentationDatasetV2/train')
ROBOFLOW_DATA_DIR = Path('/kaggle/input/roboflow-nail-detection/roboflow_nail_masks')  # ★ Roboflow 데이터
VAL_DATA_DIR = Path('/kaggle/input/nail-segmentation-dataset/NailSegmentationDatasetV2/val')
OUTPUT_DIR = Path('/kaggle/working/models')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 경로 확인
print("=" * 60)
print("Mixed Training Configuration")
print("=" * 60)
print(f"Checkpoint: {CHECKPOINT_FILE or 'NOT FOUND'}")
print(f"Checkpoint exists: {bool(CHECKPOINT_FILE) and Path(CHECKPOINT_FILE).exists()}")
print(f"Thumb data exists: {THUMB_DATA_DIR.exists()}")
print(f"Original train exists: {ORIGINAL_TRAIN_DIR.exists()}")
print(f"Roboflow data exists: {ROBOFLOW_DATA_DIR.exists()}")
print(f"Val data exists: {VAL_DATA_DIR.exists()}")

if THUMB_DATA_DIR.exists():
    thumb_count = len(list((THUMB_DATA_DIR / 'images').glob('*.jpg')))
    print(f"\nThumb images: {thumb_count}")
    print(f"  → After repeat ({CONFIG['thumb_repeat']}x): {thumb_count * CONFIG['thumb_repeat']}")

if ORIGINAL_TRAIN_DIR.exists():
    original_count = len(list((ORIGINAL_TRAIN_DIR / 'images').glob('*')))
    print(f"\nOriginal train images: {original_count}")
    print(f"  → Sampling: {CONFIG['original_sample']}")

if ROBOFLOW_DATA_DIR.exists():
    roboflow_count = len(list((ROBOFLOW_DATA_DIR / 'images').glob('*.jpg')))
    print(f"\nRoboflow images: {roboflow_count}")
    print(f"  → Using: {CONFIG['roboflow_sample']}")

total_expected = thumb_count * CONFIG['thumb_repeat'] + CONFIG['original_sample'] + CONFIG['roboflow_sample']
print(f"\n★ Expected mixed dataset: {total_expected} images")
print(f"★ Ratio - Thumb: {thumb_count * CONFIG['thumb_repeat']} | Original: {CONFIG['original_sample']} | Roboflow: {CONFIG['roboflow_sample']}")
```

---

## Cell 3: 데이터셋 클래스

```python
class NailDataset(Dataset):
    """손톱 세그멘테이션 데이터셋"""

    def __init__(self, image_paths, mask_paths, transform=None, size=640):
        self.image_paths = list(image_paths)
        self.mask_paths = list(mask_paths)
        self.transform = transform
        self.size = size
        print(f"Dataset: {len(self.image_paths)} images")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        # 이미지 로드
        img = cv2.imread(str(self.image_paths[idx]))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.size, self.size))

        # 마스크 로드
        mask = cv2.imread(str(self.mask_paths[idx]), cv2.IMREAD_GRAYSCALE)
        mask = cv2.resize(mask, (self.size, self.size))
        mask = (mask > 127).astype(np.float32)

        # Transform 적용
        if self.transform:
            augmented = self.transform(image=img, mask=mask)
            img = augmented['image']
            mask = augmented['mask']

        if not isinstance(mask, torch.Tensor):
            mask = torch.tensor(mask).float()

        return img, mask.unsqueeze(0)
```

---

## Cell 4: Data Augmentation

```python
def get_train_transform(size):
    """학습용 augmentation (강화)"""
    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.Rotate(limit=30, p=0.5, border_mode=cv2.BORDER_CONSTANT),
        A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.5),
        A.HueSaturationValue(hue_shift_limit=15, sat_shift_limit=40, val_shift_limit=30, p=0.5),
        A.GaussNoise(std_range=(0.02, 0.1), p=0.3),
        A.RandomScale(scale_limit=0.2, p=0.3),
        A.PadIfNeeded(min_height=size, min_width=size, border_mode=cv2.BORDER_CONSTANT),
        A.CenterCrop(height=size, width=size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])


def get_val_transform(size):
    """검증용 transform (augmentation 없음)"""
    return A.Compose([
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])
```

---

## Cell 5: 모델 생성 및 부분 Encoder Freeze

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# 모델 생성
model = smp.DeepLabV3Plus(
    encoder_name=CONFIG['encoder'],
    encoder_weights='imagenet',
    classes=1,
    activation='sigmoid',
)
model = model.to(device)

total_params = sum(p.numel() for p in model.parameters())
print(f"Total parameters: {total_params:,}")

# 체크포인트 로드
previous_best_iou = 0.0
start_epoch = 0

if Path(CHECKPOINT_FILE).exists():
    print(f"\n★ Loading checkpoint: {CHECKPOINT_FILE}")
    checkpoint_data = torch.load(CHECKPOINT_FILE, map_location=device)

    if isinstance(checkpoint_data, dict) and 'model_state_dict' in checkpoint_data:
        model.load_state_dict(checkpoint_data['model_state_dict'])
        # Fine-tuning: epoch 0부터 시작, optimizer/scheduler는 새로 생성
        # (새 loss function에 맞게 처음부터 적응)
        start_epoch = 0  # ★ Fine-tuning 세션 - epoch 카운트 리셋
        previous_best_iou = checkpoint_data.get('best_iou', 0.0)
        print(f"★ Loaded weights from checkpoint (IoU: {previous_best_iou:.4f})")
        print(f"★ Fine-tuning with Dice+BCE loss from epoch 0")
    else:
        model.load_state_dict(checkpoint_data)
        print("★ Checkpoint loaded (legacy format)")
else:
    print("⚠ Checkpoint not found!")

# ★★★ 부분 Encoder Freeze (핵심!) ★★★
freeze_layers = CONFIG.get('freeze_encoder_layers', 0)
if freeze_layers > 0:
    frozen_params = 0
    trainable_params = 0

    for name, param in model.encoder.named_parameters():
        # layer 번호 추출 (layer0, layer1, layer2, layer3, layer4)
        layer_num = -1
        for i in range(5):
            if f'layer{i}' in name or name.startswith(f'{i}.'):
                layer_num = i
                break

        # conv1, bn1 등 초기 레이어는 layer 0으로 처리
        if layer_num == -1:
            if any(x in name for x in ['conv1', 'bn1', 'relu', 'maxpool']):
                layer_num = 0

        # freeze_layers 미만인 layer는 freeze
        if layer_num >= 0 and layer_num < freeze_layers:
            param.requires_grad = False
            frozen_params += param.numel()
        else:
            trainable_params += param.numel()

    decoder_params = sum(p.numel() for p in model.decoder.parameters())
    segmentation_head_params = sum(p.numel() for p in model.segmentation_head.parameters())

    total_trainable = trainable_params + decoder_params + segmentation_head_params

    print(f"\n★ PARTIAL ENCODER FREEZE (layers 0-{freeze_layers - 1})")
    print(f"  Frozen encoder params: {frozen_params:,}")
    print(f"  Trainable encoder params: {trainable_params:,}")
    print(f"  Decoder params: {decoder_params:,}")
    print(f"  Segmentation head params: {segmentation_head_params:,}")
    print(f"  Total trainable: {total_trainable:,} ({total_trainable / total_params * 100:.1f}%)")
```

---

## Cell 6: Mixed 데이터 로더 준비

```python
# ==================== 엄지 데이터 ====================
thumb_images = sorted((THUMB_DATA_DIR / 'images').glob('*.jpg'))
thumb_masks = sorted((THUMB_DATA_DIR / 'masks').glob('*.png'))

print(f"Thumb raw: {len(thumb_images)} images")

# 엄지 데이터 반복 (heavy oversampling)
thumb_images_repeated = list(thumb_images) * CONFIG['thumb_repeat']
thumb_masks_repeated = list(thumb_masks) * CONFIG['thumb_repeat']

print(f"Thumb after {CONFIG['thumb_repeat']}x repeat: {len(thumb_images_repeated)} images")

# ==================== 기존 Train 데이터 ====================
original_images_all = sorted((ORIGINAL_TRAIN_DIR / 'images').glob('*'))
original_masks_all = sorted((ORIGINAL_TRAIN_DIR / 'masks').glob('*'))

print(f"Original train total: {len(original_images_all)} images")

# 랜덤 샘플링 (매 epoch 동일하게 유지하기 위해 seed 고정됨)
sample_size = min(CONFIG['original_sample'], len(original_images_all))
indices = random.sample(range(len(original_images_all)), sample_size)
original_images = [original_images_all[i] for i in indices]
original_masks = [original_masks_all[i] for i in indices]

print(f"Original sampled: {len(original_images)} images")

# ==================== Roboflow 데이터 ====================
roboflow_images_all = sorted((ROBOFLOW_DATA_DIR / 'images').glob('*.jpg'))
roboflow_masks_all = sorted((ROBOFLOW_DATA_DIR / 'masks').glob('*.png'))

print(f"Roboflow total: {len(roboflow_images_all)} images")

# 샘플링 (전체 사용 시 그대로)
roboflow_sample_size = min(CONFIG['roboflow_sample'], len(roboflow_images_all))
if roboflow_sample_size < len(roboflow_images_all):
    roboflow_indices = random.sample(range(len(roboflow_images_all)), roboflow_sample_size)
    roboflow_images = [roboflow_images_all[i] for i in roboflow_indices]
    roboflow_masks = [roboflow_masks_all[i] for i in roboflow_indices]
else:
    roboflow_images = list(roboflow_images_all)
    roboflow_masks = list(roboflow_masks_all)

print(f"Roboflow sampled: {len(roboflow_images)} images")

# ==================== 병합 및 셔플 ====================
all_images = thumb_images_repeated + original_images + roboflow_images
all_masks = thumb_masks_repeated + original_masks + roboflow_masks

# 셔플
combined = list(zip(all_images, all_masks))
random.shuffle(combined)
all_images, all_masks = zip(*combined)

print(f"\n★ Mixed Dataset Summary:")
print(f"  Total: {len(all_images)} images")
print(f"  - Thumb: {len(thumb_images_repeated)} ({len(thumb_images)} × {CONFIG['thumb_repeat']})")
print(f"  - Original: {len(original_images)}")
print(f"  - Roboflow: {len(roboflow_images)}")
thumb_ratio = len(thumb_images_repeated) / len(all_images) * 100
original_ratio = len(original_images) / len(all_images) * 100
roboflow_ratio = len(roboflow_images) / len(all_images) * 100
print(f"  Ratio: Thumb {thumb_ratio:.1f}% | Original {original_ratio:.1f}% | Roboflow {roboflow_ratio:.1f}%")

# Train 데이터셋 생성
train_dataset = NailDataset(
    image_paths=list(all_images),
    mask_paths=list(all_masks),
    transform=get_train_transform(CONFIG['input_size']),
    size=CONFIG['input_size']
)

# ==================== Validation 데이터셋 ====================
val_images = sorted((VAL_DATA_DIR / 'images').glob('*'))
val_masks = sorted((VAL_DATA_DIR / 'masks').glob('*'))

val_dataset = NailDataset(
    image_paths=val_images,
    mask_paths=val_masks,
    transform=get_val_transform(CONFIG['input_size']),
    size=CONFIG['input_size']
)

# DataLoader
train_loader = DataLoader(
    train_dataset,
    batch_size=CONFIG['batch_size'],
    shuffle=True,
    num_workers=2,
    pin_memory=True
)
val_loader = DataLoader(
    val_dataset,
    batch_size=CONFIG['batch_size'],
    shuffle=False,
    num_workers=2,
    pin_memory=True
)

print(f"\n★ DataLoader Summary:")
print(f"  Train: {len(train_dataset)} samples, {len(train_loader)} batches")
print(f"  Val: {len(val_dataset)} samples, {len(val_loader)} batches (기존 validation set)")
```

---

## Cell 7: Loss, Optimizer

```python
# ★★★ Dice + BCE Combined Loss ★★★
# 모델이 activation='sigmoid'로 출력이 이미 [0,1] 확률값이므로
# BCEWithLogitsLoss가 아닌 BCELoss를 사용해야 함 (double sigmoid 방지)
dice_loss_fn = smp.losses.DiceLoss(mode='binary')
bce_loss_fn = nn.BCELoss()

def criterion(pred, target):
    return CONFIG['dice_weight'] * dice_loss_fn(pred, target) + CONFIG['bce_weight'] * bce_loss_fn(pred, target)

# Fine-tuning용 낮은 LR
optimizer = torch.optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),  # 학습 가능한 파라미터만
    lr=CONFIG['learning_rate'],
    weight_decay=CONFIG['weight_decay']
)

# Scheduler (20 epoch에 맞춤 T_0=3)
scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
    optimizer, T_0=3, T_mult=2, eta_min=1e-7
)

print(f"Loss: CombinedDiceBCE (Dice {CONFIG['dice_weight']} + BCE {CONFIG['bce_weight']})")
print(f"  - DiceLoss(mode='binary') weight={CONFIG['dice_weight']}")
print(f"  - BCELoss() weight={CONFIG['bce_weight']}")
print(f"  - Note: BCELoss (not BCEWithLogitsLoss) because model uses activation='sigmoid'")
print(f"Optimizer: AdamW (lr={CONFIG['learning_rate']})")
print(f"Scheduler: CosineAnnealingWarmRestarts (T_0=3, T_mult=2)")
```

---

## Cell 8: 학습 함수

```python
def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss, total_iou = 0, 0
    pbar = tqdm(loader, desc='Training')

    for images, masks in pbar:
        images, masks = images.to(device), masks.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, masks)
        loss.backward()
        optimizer.step()

        with torch.no_grad():
            preds = (outputs > 0.5).float()
            intersection = (preds * masks).sum()
            union = preds.sum() + masks.sum() - intersection
            iou = (intersection + 1e-6) / (union + 1e-6)

        total_loss += loss.item()
        total_iou += iou.item()
        pbar.set_postfix({'loss': f'{loss.item():.4f}', 'iou': f'{iou.item():.4f}'})

    return total_loss / len(loader), total_iou / len(loader)


@torch.no_grad()
def validate(model, loader, criterion, device):
    model.eval()
    total_loss, total_iou = 0, 0

    for images, masks in tqdm(loader, desc='Validation'):
        images, masks = images.to(device), masks.to(device)
        outputs = model(images)
        loss = criterion(outputs, masks)

        preds = (outputs > 0.5).float()
        intersection = (preds * masks).sum()
        union = preds.sum() + masks.sum() - intersection
        iou = (intersection + 1e-6) / (union + 1e-6)

        total_loss += loss.item()
        total_iou += iou.item()

    return total_loss / len(loader), total_iou / len(loader)
```

---

## Cell 9: 메인 학습 루프

```python
print("=" * 60)
print("Starting Fine-tuning with Dice+BCE Loss (Thumb + Original + Roboflow Data)")
print("=" * 60)

# ★ 이번 학습 세션에서 새로 시작 (previous_best_iou와 비교하지 않음)
best_iou = 0.0  # 0부터 시작하여 이번 학습의 best를 추적
patience_counter = 0
history = {'train_loss': [], 'train_iou': [], 'val_loss': [], 'val_iou': [], 'lr': []}

end_epoch = start_epoch + CONFIG['epochs']
print(f"Training from epoch {start_epoch} to {end_epoch}")
print(f"Previous checkpoint IoU: {previous_best_iou:.4f} (참고용)")
print(f"★ Fine-tuning with Dice+BCE loss - tracking best from 0.0")
print(f"Encoder layers frozen: 0 to {CONFIG['freeze_encoder_layers'] - 1}")
print(f"Mixed dataset: {len(train_dataset)} images (Thumb {len(thumb_images_repeated)} + Original {len(original_images)} + Roboflow {len(roboflow_images)})")

for epoch in range(start_epoch, end_epoch):
    current_lr = optimizer.param_groups[0]['lr']
    print(f"\nEpoch {epoch + 1}/{end_epoch} | LR: {current_lr:.8f}")

    train_loss, train_iou = train_one_epoch(model, train_loader, criterion, optimizer, device)
    val_loss, val_iou = validate(model, val_loader, criterion, device)
    scheduler.step()

    history['train_loss'].append(train_loss)
    history['train_iou'].append(train_iou)
    history['val_loss'].append(val_loss)
    history['val_iou'].append(val_iou)
    history['lr'].append(current_lr)

    print(f"  Train - Loss: {train_loss:.4f} | IoU: {train_iou:.4f}")
    print(f"  Val   - Loss: {val_loss:.4f} | IoU: {val_iou:.4f}")

    # 체크포인트 저장
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'scheduler_state_dict': scheduler.state_dict(),
        'best_iou': best_iou,
        'val_iou': val_iou,
        'config': CONFIG,
    }
    torch.save(checkpoint, OUTPUT_DIR / 'last_checkpoint.pth')

    if val_iou > best_iou:
        improvement = val_iou - best_iou
        best_iou = val_iou
        checkpoint['best_iou'] = best_iou
        patience_counter = 0
        torch.save(checkpoint, OUTPUT_DIR / 'best_checkpoint.pth')
        torch.save(model.state_dict(), OUTPUT_DIR / 'best_model.pth')
        print(f"  ★★★ NEW BEST! IoU: {best_iou:.4f} (+{improvement:.4f}) ★★★")
    else:
        patience_counter += 1
        print(f"  No improvement ({patience_counter}/{CONFIG['patience']})")

    if patience_counter >= CONFIG['patience']:
        print(f"\n★ EARLY STOPPING at epoch {epoch + 1}")
        break

print(f"\n{'=' * 60}")
print(f"Fine-tuning (Dice+BCE) Complete!")
print(f"  Epochs: {start_epoch} → {epoch + 1}")
print(f"  Best IoU: {best_iou:.4f}")
print(f"  Previous IoU: {previous_best_iou:.4f}")
print(f"  Change: {best_iou - previous_best_iou:+.4f}")
print(f"{'=' * 60}")
```

---

## Cell 10: 학습 결과 시각화

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].plot(history['train_loss'], label='Train', marker='o')
axes[0].plot(history['val_loss'], label='Val', marker='s')
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('Loss')
axes[0].set_title('Loss')
axes[0].legend()
axes[0].grid(True)

axes[1].plot(history['train_iou'], label='Train', marker='o')
axes[1].plot(history['val_iou'], label='Val', marker='s')
axes[1].axhline(y=previous_best_iou, color='gray', linestyle='--', label=f'Previous: {previous_best_iou:.4f}')
axes[1].axhline(y=best_iou, color='r', linestyle='--', label=f'Best: {best_iou:.4f}')
axes[1].set_xlabel('Epoch')
axes[1].set_ylabel('IoU')
axes[1].set_title('IoU')
axes[1].legend()
axes[1].grid(True)

axes[2].plot(history['lr'], marker='o')
axes[2].set_xlabel('Epoch')
axes[2].set_ylabel('Learning Rate')
axes[2].set_title('LR Schedule')
axes[2].grid(True)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'training_history.png', dpi=150)
plt.show()
```

---

## Cell 11: 엄지 예측 시각화

```python
@torch.no_grad()
def visualize_thumb_predictions(model, device, num_samples=4):
    """엄지 데이터에 대한 예측 시각화"""
    model.eval()

    # 원본 엄지 이미지 사용 (transform 없이)
    fig, axes = plt.subplots(num_samples, 3, figsize=(12, 4 * num_samples))

    for i in range(min(num_samples, len(thumb_images))):
        # 이미지 로드
        img = cv2.imread(str(thumb_images[i]))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img, (CONFIG['input_size'], CONFIG['input_size']))

        # 마스크 로드
        mask = cv2.imread(str(thumb_masks[i]), cv2.IMREAD_GRAYSCALE)
        mask_resized = cv2.resize(mask, (CONFIG['input_size'], CONFIG['input_size']))

        # 전처리 및 예측
        img_tensor = get_val_transform(CONFIG['input_size'])(image=img_resized)['image']
        pred = model(img_tensor.unsqueeze(0).to(device)).squeeze().cpu().numpy()
        pred_binary = (pred > 0.5).astype(np.float32)

        # IoU 계산
        gt = (mask_resized > 127).astype(np.float32)
        intersection = (pred_binary * gt).sum()
        union = pred_binary.sum() + gt.sum() - intersection
        iou = intersection / (union + 1e-6)

        # 시각화
        axes[i, 0].imshow(img_resized)
        axes[i, 0].set_title(f'Thumb {i+1}')
        axes[i, 0].axis('off')

        axes[i, 1].imshow(mask_resized, cmap='gray')
        axes[i, 1].set_title('Ground Truth')
        axes[i, 1].axis('off')

        axes[i, 2].imshow(pred_binary, cmap='gray')
        axes[i, 2].set_title(f'Prediction (IoU: {iou:.4f})')
        axes[i, 2].axis('off')

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'thumb_predictions.png', dpi=150)
    plt.show()


# Best 모델 로드 후 시각화 (파일 존재 여부 확인)
best_model_path = OUTPUT_DIR / 'best_model.pth'
last_checkpoint_path = OUTPUT_DIR / 'last_checkpoint.pth'

if best_model_path.exists():
    print(f"★ Loading best model: {best_model_path}")
    model.load_state_dict(torch.load(best_model_path))
elif last_checkpoint_path.exists():
    print(f"⚠ best_model.pth not found, loading last checkpoint: {last_checkpoint_path}")
    checkpoint = torch.load(last_checkpoint_path)
    model.load_state_dict(checkpoint['model_state_dict'])
else:
    print("⚠ No saved model found, using current model state")

visualize_thumb_predictions(model, device)
```

---

## Cell 12: Roboflow 데이터 예측 시각화

```python
@torch.no_grad()
def visualize_roboflow_predictions(model, device, num_samples=4):
    """Roboflow 데이터에 대한 예측 시각화"""
    model.eval()

    # Roboflow 이미지 사용
    sample_indices = random.sample(range(len(roboflow_images)), min(num_samples, len(roboflow_images)))

    fig, axes = plt.subplots(num_samples, 3, figsize=(12, 4 * num_samples))

    for i, idx in enumerate(sample_indices):
        # 이미지 로드
        img = cv2.imread(str(roboflow_images[idx]))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img, (CONFIG['input_size'], CONFIG['input_size']))

        # 마스크 로드
        mask = cv2.imread(str(roboflow_masks[idx]), cv2.IMREAD_GRAYSCALE)
        mask_resized = cv2.resize(mask, (CONFIG['input_size'], CONFIG['input_size']))

        # 전처리 및 예측
        img_tensor = get_val_transform(CONFIG['input_size'])(image=img_resized)['image']
        pred = model(img_tensor.unsqueeze(0).to(device)).squeeze().cpu().numpy()
        pred_binary = (pred > 0.5).astype(np.float32)

        # IoU 계산
        gt = (mask_resized > 127).astype(np.float32)
        intersection = (pred_binary * gt).sum()
        union = pred_binary.sum() + gt.sum() - intersection
        iou = intersection / (union + 1e-6)

        # 시각화
        axes[i, 0].imshow(img_resized)
        axes[i, 0].set_title(f'Roboflow {idx}')
        axes[i, 0].axis('off')

        axes[i, 1].imshow(mask_resized, cmap='gray')
        axes[i, 1].set_title('Ground Truth')
        axes[i, 1].axis('off')

        axes[i, 2].imshow(pred_binary, cmap='gray')
        axes[i, 2].set_title(f'Prediction (IoU: {iou:.4f})')
        axes[i, 2].axis('off')

    plt.suptitle('Roboflow Data Predictions', fontsize=14)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'roboflow_predictions.png', dpi=150)
    plt.show()


# Roboflow 예측 시각화
visualize_roboflow_predictions(model, device)
```

---

## Cell 13: 4손가락 (기존 데이터) 예측 시각화

```python
@torch.no_grad()
def visualize_finger_predictions(model, device, num_samples=4):
    """기존 4손가락 데이터에 대한 예측 시각화 (망각 확인용)"""
    model.eval()

    # Validation set에서 샘플링
    sample_indices = random.sample(range(len(val_images)), min(num_samples, len(val_images)))

    fig, axes = plt.subplots(num_samples, 3, figsize=(12, 4 * num_samples))

    for i, idx in enumerate(sample_indices):
        # 이미지 로드
        img = cv2.imread(str(val_images[idx]))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img, (CONFIG['input_size'], CONFIG['input_size']))

        # 마스크 로드
        mask = cv2.imread(str(val_masks[idx]), cv2.IMREAD_GRAYSCALE)
        mask_resized = cv2.resize(mask, (CONFIG['input_size'], CONFIG['input_size']))

        # 전처리 및 예측
        img_tensor = get_val_transform(CONFIG['input_size'])(image=img_resized)['image']
        pred = model(img_tensor.unsqueeze(0).to(device)).squeeze().cpu().numpy()
        pred_binary = (pred > 0.5).astype(np.float32)

        # IoU 계산
        gt = (mask_resized > 127).astype(np.float32)
        intersection = (pred_binary * gt).sum()
        union = pred_binary.sum() + gt.sum() - intersection
        iou = intersection / (union + 1e-6)

        # 시각화
        axes[i, 0].imshow(img_resized)
        axes[i, 0].set_title(f'Val Sample {idx}')
        axes[i, 0].axis('off')

        axes[i, 1].imshow(mask_resized, cmap='gray')
        axes[i, 1].set_title('Ground Truth')
        axes[i, 1].axis('off')

        axes[i, 2].imshow(pred_binary, cmap='gray')
        axes[i, 2].set_title(f'Prediction (IoU: {iou:.4f})')
        axes[i, 2].axis('off')

    plt.suptitle('4-Finger Validation Samples (Forgetting Check)', fontsize=14)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'finger_predictions.png', dpi=150)
    plt.show()


# 4손가락 예측 시각화
visualize_finger_predictions(model, device)
```

---

## Cell 14: 출력 파일 확인

```python
print("=" * 60)
print("Output Files")
print("=" * 60)

for f in sorted(OUTPUT_DIR.glob('*')):
    size_mb = f.stat().st_size / (1024 * 1024)
    print(f"  {f.name}: {size_mb:.2f} MB")

print("\n★ 다운로드할 파일:")
print("  - best_model.pth (추론용)")
print("  - best_checkpoint.pth (이어서 학습용)")
print("  - training_history.png (학습 그래프)")
print("  - thumb_predictions.png (엄지 예측 결과)")
print("  - roboflow_predictions.png (Roboflow 예측 결과)")
print("  - finger_predictions.png (4손가락 예측 결과)")
```

---

## 학습 완료 후 로컬 배포

```bash
# 1. best_model.pth 다운로드 후 배치
cp ~/Downloads/best_model.pth \
   packages/ml/models/nail_segmentation/v2.0.0/best_model.pth

# 2. 서버 재시작
pkill -f uvicorn
./packages/ml/scripts/start_server.sh

# 3. 테스트
curl -X POST http://localhost:8000/api/segment-with-overlay \
  -F "image=@~/Downloads/thumb_images/KakaoTalk_20260202_010536008_01.jpg" \
  | jq '.success, .mask_stats'
```

---

## Fine-tuning vs Mixed Training 비교

| 항목 | 엄지만 Fine-tuning | Mixed Training |
|------|-------------------|----------------|
| **데이터** | 엄지 18장 × 5배 = 90장 | 엄지 270 + 기존 300 + Roboflow 266 = **836장** |
| **Encoder** | 전체 Frozen | **부분 Frozen** (layer 0-2만) |
| **Learning Rate** | 0.00001 | **0.00003** |
| **Batch Size** | 4 | **8** |
| **Epochs** | 15 | **25** |
| **망각 위험** | 높음 | **낮음** |
| **예상 Val IoU** | ~0.80 (저하) | **0.84~0.86** (유지/개선) |

---

## 데이터 구성 비율

| 데이터 소스 | 원본 수 | 반복/샘플 | 최종 수 | 비율 |
|------------|---------|----------|--------|------|
| 엄지 | 18 | ×15 | 270 | 32% |
| 기존 (4손가락) | ~2,000 | 300 샘플 | 300 | 36% |
| Roboflow | 266 | 전체 사용 | 266 | 32% |
| **합계** | - | - | **836** | 100% |

---

## 기대 결과

| 메트릭 | 기존 모델 | 예상 결과 |
|--------|----------|-----------|
| Val IoU (전체) | 0.8446 | 0.84 ~ 0.86 |
| 엄지 성능 | 부족 | **개선** |
| 4손가락 성능 | 양호 | **유지** |
