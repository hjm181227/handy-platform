# 엄지 Fine-tuning Kaggle 노트북

> 기존 학습된 모델에 엄지 손톱 데이터를 추가 학습하는 Fine-tuning 노트북

## 사전 준비 (Kaggle)

### 1. Dataset 업로드
`~/Downloads/thumb_train_dataset.zip`을 Kaggle에 업로드:
- Title: `Thumb Nail Training Data`
- Visibility: Private

### 2. 노트북 Input 추가
| Dataset | 용도 |
|---------|------|
| `nail-segmentation-dataset` | 기존 Validation Set |
| `nail-segmentation-checkpoint-v3` | 기존 학습된 모델 |
| `thumb-nail-training-data` | 엄지 데이터 (새로 추가) |

### 3. GPU 설정
Settings > Accelerator > GPU T4 x2

---

## Cell 1: 환경 설정

```python
!pip install -q segmentation-models-pytorch albumentations

import os
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
```

---

## Cell 2: Fine-tuning 설정

```python
# ★★★ Fine-tuning 전용 설정 ★★★
CONFIG = {
    'encoder': 'resnet101',
    'input_size': 640,
    'epochs': 15,                  # 짧은 학습 (망각 방지)
    'batch_size': 4,               # 작은 배치 (18장 데이터)
    'learning_rate': 0.00001,      # 매우 낮은 LR (기존 지식 보존)
    'weight_decay': 0.0005,
    'patience': 10,
    'freeze_encoder': True,        # ★ Encoder 고정 (핵심!)
    'data_repeat': 5,              # 18장 → 90장으로 반복
}

# 경로 설정
CHECKPOINT_FILE = '/kaggle/input/nail-segmentation-checkpoint-v3/pytorch/default/1/best_checkpoint.pth'
THUMB_DATA_DIR = Path('/kaggle/input/thumb-nail-training-data/thumb_train')
VAL_DATA_DIR = Path('/kaggle/input/nail-segmentation-dataset/NailSegmentationDatasetV2/val')
OUTPUT_DIR = Path('/kaggle/working/models')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 경로 확인
print("=" * 50)
print("경로 확인")
print("=" * 50)
print(f"Checkpoint exists: {Path(CHECKPOINT_FILE).exists()}")
print(f"Thumb data exists: {THUMB_DATA_DIR.exists()}")
print(f"Val data exists: {VAL_DATA_DIR.exists()}")

if THUMB_DATA_DIR.exists():
    thumb_images = list((THUMB_DATA_DIR / 'images').glob('*.jpg'))
    print(f"Thumb images: {len(thumb_images)}")
```

---

## Cell 3: 데이터셋 클래스

```python
class NailDataset(Dataset):
    """손톱 세그멘테이션 데이터셋"""

    def __init__(self, image_paths, mask_paths, transform=None, size=640):
        self.image_paths = image_paths
        self.mask_paths = mask_paths
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


class RepeatedDataset(Dataset):
    """데이터를 N배 반복하는 래퍼"""

    def __init__(self, base_dataset, repeat=5):
        self.base_dataset = base_dataset
        self.repeat = repeat

    def __len__(self):
        return len(self.base_dataset) * self.repeat

    def __getitem__(self, idx):
        return self.base_dataset[idx % len(self.base_dataset)]
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

## Cell 5: 모델 생성 및 체크포인트 로드

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
        start_epoch = checkpoint_data.get('epoch', 0) + 1
        previous_best_iou = checkpoint_data.get('best_iou', 0.0)
        print(f"★ Loaded from epoch {start_epoch}, best IoU: {previous_best_iou:.4f}")
    else:
        model.load_state_dict(checkpoint_data)
        print("★ Checkpoint loaded (legacy format)")
else:
    print("⚠ Checkpoint not found!")

# ★★★ Encoder Freeze (핵심!) ★★★
if CONFIG.get('freeze_encoder', False):
    frozen_count = 0
    for param in model.encoder.parameters():
        param.requires_grad = False
        frozen_count += 1
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\n★ ENCODER FROZEN")
    print(f"  Frozen params: {total_params - trainable_params:,}")
    print(f"  Trainable params: {trainable_params:,} (Decoder only)")
```

---

## Cell 6: 데이터 로더 준비

```python
# 엄지 데이터 로드 (Train)
thumb_images = sorted((THUMB_DATA_DIR / 'images').glob('*.jpg'))
thumb_masks = sorted((THUMB_DATA_DIR / 'masks').glob('*.png'))

print(f"Thumb images: {len(thumb_images)}")

# Train 데이터셋 (엄지만, 반복 적용)
train_base = NailDataset(
    image_paths=thumb_images,
    mask_paths=thumb_masks,
    transform=get_train_transform(CONFIG['input_size']),
    size=CONFIG['input_size']
)
train_dataset = RepeatedDataset(train_base, repeat=CONFIG['data_repeat'])

# Validation 데이터셋 (기존 val set - 전체 성능 모니터링용)
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

print(f"\n★ Data Summary:")
print(f"  Train: {len(train_dataset)} samples ({len(thumb_images)} × {CONFIG['data_repeat']})")
print(f"  Val: {len(val_dataset)} samples (기존 validation set)")
print(f"  Train batches: {len(train_loader)}")
print(f"  Val batches: {len(val_loader)}")
```

---

## Cell 7: Loss, Optimizer

```python
criterion = smp.losses.DiceLoss(mode='binary')

# Fine-tuning용 낮은 LR
optimizer = torch.optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),  # 학습 가능한 파라미터만
    lr=CONFIG['learning_rate'],
    weight_decay=CONFIG['weight_decay']
)

# Scheduler
scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
    optimizer, T_0=5, T_mult=2, eta_min=1e-7
)

print(f"Loss: DiceLoss")
print(f"Optimizer: AdamW (lr={CONFIG['learning_rate']})")
print(f"Scheduler: CosineAnnealingWarmRestarts")
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
print("Starting Fine-tuning (Thumb Data)")
print("=" * 60)

best_iou = previous_best_iou
patience_counter = 0
history = {'train_loss': [], 'train_iou': [], 'val_loss': [], 'val_iou': [], 'lr': []}

end_epoch = start_epoch + CONFIG['epochs']
print(f"Training from epoch {start_epoch} to {end_epoch}")
print(f"Previous best IoU: {best_iou:.4f}")
print(f"Encoder frozen: {CONFIG.get('freeze_encoder', False)}")

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
print(f"Fine-tuning Complete!")
print(f"  Epochs: {start_epoch} → {epoch + 1}")
print(f"  Best IoU: {best_iou:.4f}")
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

        # 시각화
        axes[i, 0].imshow(img_resized)
        axes[i, 0].set_title(f'Thumb {i+1}')
        axes[i, 0].axis('off')

        axes[i, 1].imshow(mask_resized, cmap='gray')
        axes[i, 1].set_title('Ground Truth')
        axes[i, 1].axis('off')

        axes[i, 2].imshow(pred_binary, cmap='gray')
        axes[i, 2].set_title('Prediction')
        axes[i, 2].axis('off')

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'thumb_predictions.png', dpi=150)
    plt.show()


# Best 모델 로드 후 시각화
model.load_state_dict(torch.load(OUTPUT_DIR / 'best_model.pth'))
visualize_thumb_predictions(model, device)
```

---

## Cell 12: 출력 파일 확인

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

## 주요 변경점 (기존 학습 코드 대비)

| 항목 | 기존 학습 | 엄지 Fine-tuning |
|------|----------|------------------|
| 데이터 | 전체 5000+ 이미지 | 엄지 18장 × 5배 = 90장 |
| Learning Rate | 0.00005 | 0.00001 (5배 낮음) |
| Batch Size | 8 | 4 |
| Epochs | 30 | 15 |
| Encoder | 학습됨 | **Frozen** (핵심!) |
| Augmentation | 기본 | 강화 (작은 데이터셋용) |
| Validation | 같은 분포 | 기존 Val Set (성능 모니터링) |
