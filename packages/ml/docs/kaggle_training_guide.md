# Kaggle 손톱 세그멘테이션 학습 가이드

> 이 문서는 Kaggle에서 손톱 세그멘테이션 모델을 학습할 때 사용하는 Cell 코드를 정리한 것입니다.

---

## 사전 준비

1. **GPU 설정**: Settings > Accelerator > GPU T4 x2
2. **데이터셋 추가**: `nail-segmentation-dataset` (NailSegmentationDatasetV2)
3. **체크포인트 추가** (이어서 학습 시): 이전 모델을 Kaggle Models로 업로드 후 추가

---

## 데이터셋 구조

```
NailSegmentationDatasetV2/
├── train/
│   ├── images/
│   │   └── nail_train_XXXXXX.jpg
│   └── masks/
│       └── nail_train_XXXXXX.png
├── val/
│   ├── images/
│   │   └── nail_valid_XXXXXX.jpg
│   └── masks/
│       └── nail_valid_XXXXXX.png
└── test/
    ├── images/
    │   └── nail_test_XXXXXX.jpg
    └── masks/
        └── nail_test_XXXXXX.png
```

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

## Cell 2: 설정값

```python
CONFIG = {
    'encoder': 'resnet101',
    'input_size': 640,
    'epochs': 100,
    'batch_size': 8,
    'learning_rate': 0.00005,      # 이어서 학습 시 낮은 LR 권장
    'weight_decay': 0.0005,
    'patience': 20,
    'previous_best_iou': 0.0,      # ★ 이전 최고 IoU 값으로 수정
}

# Kaggle 경로
DATASET_PATH = Path('/kaggle/input/nail-segmentation-dataset/NailSegmentationDatasetV2')

# ★ 체크포인트 경로 (이어서 학습 시 수정 필요)
# 형식: /kaggle/input/{모델이름}/pytorch/default/1/{파일경로}
CHECKPOINT_FILE = '/kaggle/input/nail-segmentation-checkpoint-v2/pytorch/default/1/models/best_model_20260130_225910.pth'

OUTPUT_DIR = Path('/kaggle/working/models')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 경로 확인
print("="*50)
print("경로 확인")
print("="*50)
print(f"Dataset exists: {DATASET_PATH.exists()}")
print(f"Checkpoint exists: {Path(CHECKPOINT_FILE).exists()}")
```

---

## Cell 3: 데이터셋 클래스

```python
class NailDataset(Dataset):
    def __init__(self, images_dir, masks_dir, transform=None, size=640):
        self.images_dir = Path(images_dir)
        self.masks_dir = Path(masks_dir)
        self.transform = transform
        self.size = size
        self.image_files = sorted([
            f for f in self.images_dir.glob('*')
            if f.suffix.lower() in ['.jpg', '.jpeg', '.png']
        ])
        print(f"Found {len(self.image_files)} images in {images_dir}")

    def __len__(self):
        return len(self.image_files)

    def __getitem__(self, idx):
        img_path = self.image_files[idx]
        img = cv2.imread(str(img_path))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.size, self.size))

        mask_name = img_path.stem + '.png'
        mask_path = self.masks_dir / mask_name
        if not mask_path.exists():
            mask_path = self.masks_dir / (img_path.stem + img_path.suffix)

        if mask_path.exists():
            mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
            mask = cv2.resize(mask, (self.size, self.size))
            mask = (mask > 127).astype(np.float32)
        else:
            mask = np.zeros((self.size, self.size), dtype=np.float32)

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
    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.Rotate(limit=15, p=0.5, border_mode=cv2.BORDER_CONSTANT),
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=30, val_shift_limit=20, p=0.5),
        # Phase 3: 추가 증강 (성능 개선 필요 시 주석 해제)
        # A.ElasticTransform(alpha=50, sigma=10, alpha_affine=10, p=0.3),
        # A.GridDistortion(num_steps=5, distort_limit=0.3, p=0.3),
        # A.CoarseDropout(max_holes=8, max_height=32, max_width=32, fill_value=0, p=0.3),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])

def get_val_transform(size):
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
if Path(CHECKPOINT_FILE).exists():
    print(f"\n★ Loading checkpoint: {CHECKPOINT_FILE}")
    checkpoint = torch.load(CHECKPOINT_FILE, map_location=device)
    model.load_state_dict(checkpoint)
    print("★ Checkpoint loaded successfully!")
else:
    print(f"\n⚠ Checkpoint not found: {CHECKPOINT_FILE}")
    print("Training from scratch with ImageNet weights.")
```

---

## Cell 6: 데이터 로더 준비

```python
train_dataset = NailDataset(
    images_dir=DATASET_PATH / 'train' / 'images',
    masks_dir=DATASET_PATH / 'train' / 'masks',
    transform=get_train_transform(CONFIG['input_size']),
    size=CONFIG['input_size']
)

val_dataset = NailDataset(
    images_dir=DATASET_PATH / 'val' / 'images',
    masks_dir=DATASET_PATH / 'val' / 'masks',
    transform=get_val_transform(CONFIG['input_size']),
    size=CONFIG['input_size']
)

train_loader = DataLoader(train_dataset, batch_size=CONFIG['batch_size'], shuffle=True, num_workers=2, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=CONFIG['batch_size'], shuffle=False, num_workers=2, pin_memory=True)

print(f"\nTrain: {len(train_dataset)} samples, {len(train_loader)} batches")
print(f"Val: {len(val_dataset)} samples, {len(val_loader)} batches")
```

---

## Cell 7: Loss, Optimizer, Scheduler

```python
criterion = smp.losses.DiceLoss(mode='binary')

# Phase 4: Loss 조합 (성능 개선 필요 시 아래로 교체)
# dice_loss = smp.losses.DiceLoss(mode='binary')
# focal_loss = smp.losses.FocalLoss(mode='binary')
# def criterion(pred, target):
#     return 0.5 * dice_loss(pred, target) + 0.5 * focal_loss(pred, target)

optimizer = torch.optim.AdamW(model.parameters(), lr=CONFIG['learning_rate'], weight_decay=CONFIG['weight_decay'])

scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=5, T_mult=2, eta_min=1e-6)

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
print("="*60)
print("Starting Training")
print("="*60)

best_iou = CONFIG['previous_best_iou']
patience_counter = 0
history = {'train_loss': [], 'train_iou': [], 'val_loss': [], 'val_iou': [], 'lr': []}

for epoch in range(CONFIG['epochs']):
    current_lr = optimizer.param_groups[0]['lr']
    print(f"\nEpoch {epoch + 1}/{CONFIG['epochs']} | LR: {current_lr:.6f}")

    train_loss, train_iou = train_one_epoch(model, train_loader, criterion, optimizer, device)
    val_loss, val_iou = validate(model, val_loader, criterion, device)
    scheduler.step()

    history['train_loss'].append(train_loss)
    history['train_iou'].append(train_iou)
    history['val_loss'].append(val_loss)
    history['val_iou'].append(val_iou)
    history['lr'].append(current_lr)

    print(f"  Train Loss: {train_loss:.4f} | Train IoU: {train_iou:.4f}")
    print(f"  Val Loss:   {val_loss:.4f} | Val IoU:   {val_iou:.4f}")

    if val_iou > best_iou:
        improvement = val_iou - best_iou
        best_iou = val_iou
        patience_counter = 0
        torch.save(model.state_dict(), OUTPUT_DIR / 'best_model.pth')
        print(f"  ★★★ NEW BEST! IoU: {best_iou:.4f} (+{improvement:.4f}) ★★★")
    else:
        patience_counter += 1
        print(f"  No improvement for {patience_counter}/{CONFIG['patience']} epochs")

    if patience_counter >= CONFIG['patience']:
        print(f"\n★ EARLY STOPPING at epoch {epoch + 1}")
        break

    torch.save(model.state_dict(), OUTPUT_DIR / 'last_model.pth')

print(f"\nTraining Complete! Best IoU: {best_iou:.4f}")
```

---

## Cell 10: 학습 결과 시각화

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].plot(history['train_loss'], label='Train')
axes[0].plot(history['val_loss'], label='Val')
axes[0].set_xlabel('Epoch'); axes[0].set_ylabel('Loss'); axes[0].set_title('Loss')
axes[0].legend(); axes[0].grid(True)

axes[1].plot(history['train_iou'], label='Train')
axes[1].plot(history['val_iou'], label='Val')
axes[1].axhline(y=best_iou, color='r', linestyle='--', label=f'Best: {best_iou:.4f}')
axes[1].set_xlabel('Epoch'); axes[1].set_ylabel('IoU'); axes[1].set_title('IoU')
axes[1].legend(); axes[1].grid(True)

axes[2].plot(history['lr'])
axes[2].set_xlabel('Epoch'); axes[2].set_ylabel('Learning Rate'); axes[2].set_title('LR Schedule')
axes[2].grid(True)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'training_history.png', dpi=150)
plt.show()
```

---

## Cell 11: 예측 결과 시각화

```python
@torch.no_grad()
def visualize_predictions(model, dataset, device, num_samples=4):
    model.eval()
    fig, axes = plt.subplots(num_samples, 3, figsize=(12, 4*num_samples))
    indices = np.random.choice(len(dataset), num_samples, replace=False)

    for i, idx in enumerate(indices):
        img, mask = dataset[idx]
        pred = model(img.unsqueeze(0).to(device)).squeeze().cpu().numpy()
        pred_binary = (pred > 0.5).astype(np.float32)

        img_np = img.permute(1, 2, 0).cpu().numpy()
        img_np = img_np * np.array([0.229, 0.224, 0.225]) + np.array([0.485, 0.456, 0.406])
        img_np = np.clip(img_np, 0, 1)

        axes[i, 0].imshow(img_np); axes[i, 0].set_title('Input'); axes[i, 0].axis('off')
        axes[i, 1].imshow(mask.squeeze().cpu().numpy(), cmap='gray'); axes[i, 1].set_title('GT'); axes[i, 1].axis('off')
        axes[i, 2].imshow(pred_binary, cmap='gray'); axes[i, 2].set_title('Pred'); axes[i, 2].axis('off')

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'predictions.png', dpi=150)
    plt.show()

model.load_state_dict(torch.load(OUTPUT_DIR / 'best_model.pth'))
visualize_predictions(model, val_dataset, device)
```

---

## Cell 12: 출력 파일 확인

```python
print("="*60)
print("Output Files")
print("="*60)

for f in sorted(OUTPUT_DIR.glob('*')):
    size_mb = f.stat().st_size / (1024 * 1024)
    print(f"  {f.name}: {size_mb:.2f} MB")

print("\n★ 다운로드: /kaggle/working/models/best_model.pth")
```

---

## 이어서 학습하기 (다음 버전)

### 1. 모델 저장
학습 완료 후 Output에서 `best_model.pth` 선택 > "Create Model" 클릭

### 2. 모델 업로드 설정
| 항목 | 값 |
|------|-----|
| Model Name | `nail-segmentation-checkpoint-v3` |
| Framework | PyTorch |
| License | Apache 2.0 |
| Visibility | Private |

### 3. 새 노트북에서 Input 추가
- `nail-segmentation-dataset` (데이터셋)
- `nail-segmentation-checkpoint-v3` (새 모델)

### 4. Cell 2 수정
```python
CHECKPOINT_FILE = '/kaggle/input/nail-segmentation-checkpoint-v3/pytorch/default/1/models/best_model.pth'
CONFIG['previous_best_iou'] = 0.XX  # 이전 최고 IoU
```

---

## 성능 개선 옵션

| Phase | 수정 내용 | 예상 개선 |
|-------|----------|----------|
| Phase 2 | `learning_rate: 0.00001` (더 낮춤) | +0.01~0.02 |
| Phase 3 | Cell 4 추가 증강 주석 해제 | +0.01~0.02 |
| Phase 4 | Cell 7 Loss 조합 주석 해제 | +0.01~0.02 |
| Phase 5 | `encoder: 'resnet152'` 또는 `'efficientnet-b4'` | +0.02~0.03 |

---

## 학습 이력

| 버전 | 날짜 | Epochs | Best IoU | 비고 |
|------|------|--------|----------|------|
| v1 | 2026-01-30 | 50 | 0.XX | 초기 학습 |
| v2 | 2026-01-31 | +100 | 0.XX | 이어서 학습 |

---

## 참고

- 데이터셋: `nail-segmentation-dataset/NailSegmentationDatasetV2`
- 모델: DeepLabV3+ with ResNet101 encoder
- 프레임워크: PyTorch + segmentation-models-pytorch