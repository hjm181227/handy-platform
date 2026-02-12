# Full Training Kaggle 노트북 — v0.0.0

> CLAHE 전처리 + Dice+1.5xBCE Loss + 800px로 처음부터 전체 학습
> 모델 배포: `models/nail_segmentation/v0.0.0/`

## 핵심 변경 (vs 이전 Fine-tuning)

| 항목 | 이전 | 현재 |
|------|------|------|
| 학습 방식 | Fine-tuning (checkpoint) | **From scratch** (ImageNet encoder) |
| 데이터 | 836장 (샘플링) | **5,536+장** (전체) |
| CLAHE | 없음 | **clip_limit=4.0** |
| Loss | Dice(0.4)+BCE(0.6) | **Dice(1.0)+BCE(1.5)** |
| Activation | sigmoid (model 내) | **None** (logits → 후처리) |
| Freeze | layer 0-2 | **없음** (전체 학습) |
| LR | 1e-5 | **1e-4** |

## 데이터 출처

| 데이터셋 | 출처 | 설명 |
|----------|------|------|
| 기존 데이터 | 내부 수집 | 4손가락 손톱 데이터 (5,000+장, 640x640) |
| 엄지 데이터 | 내부 촬영 | 엄지 손톱 (18장) |
| Roboflow | [nail_segmentation](https://universe.roboflow.com/nailproject-padk9/nail_segmentation) | COCO → PNG 마스크 변환 (266장) |

---

## 사전 준비 (Kaggle)

### 1. 노트북 Input 추가

| Dataset | 용도 |
|---------|------|
| `nail-segmentation-dataset` | 기존 Train + Validation Set (5,000+장) |
| `thumb-nail-training-data` | 엄지 데이터 (18장) |
| `roboflow-nail-detection` | Roboflow 손톱 데이터 (266장) |
| `credit-card-negative` | 신용카드 negative sample (529장, all-black mask) |

### 2. GPU 설정
Settings > Accelerator > GPU T4 x2

---

## Cell 1: 환경 설정

```python
!pip install -q segmentation-models-pytorch albumentations

import os
import json
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

## Cell 2: 설정

```python
VERSION = 'v0.0.0'

CONFIG = {
    'version': VERSION,
    'encoder': 'resnet101',
    'input_size': 800,                 # 측정 정밀도 향상 (1px ≈ 0.107mm)
    'epochs': 30,                      # ★ 이번 세션 학습할 에포크 수
    'batch_size': 4,                   # 800px T4 메모리 고려
    'learning_rate': 0.0001,           # 처음부터 학습: 1e-4
    'weight_decay': 0.0005,
    'patience': 10,                    # LR 스케줄 dip 회복 여유
    'freeze_encoder_layers': 0,        # Freeze 없음
    'thumb_repeat': 15,
    'original_sample': None,           # 전체 사용
    'roboflow_sample': None,           # 전체 사용
    'dice_weight': 1.0,
    'bce_weight': 1.5,
    'previous_best_iou': 0.0,         # ★ 이전 best IoU (체크포인트에서 자동 로드)
    'start_epoch': 0,                  # ★ 이전 에포크 (체크포인트에서 자동 로드)
}

# ★ 체크포인트 경로 (이어서 학습 시 수정)
# ⚠️ best_checkpoint.pth가 아닌 last_checkpoint.pth를 사용해야 마지막 에포크부터 이어서 학습됩니다.
#    best_checkpoint.pth를 사용하면 best IoU 시점으로 되돌아가서 이후 학습이 날아갑니다.
# 방법 A: 이전 노트북 output 직접 참조 (Add Input > 노트북 이름 검색 > 추가)
#   CHECKPOINT_FILE = '/kaggle/input/notebooks/heojmin/advanced-nail-segmentation/models/last_checkpoint.pth'
# 방법 B: Kaggle Models 업로드 후 참조
#   CHECKPOINT_FILE = '/kaggle/input/nail-mixed-checkpoint-v1/pytorch/default/1/last_checkpoint.pth'
CHECKPOINT_FILE = '/kaggle/input/models/heojmin/nail-checkpoint/pytorch/default/1/last_checkpoint.pth'

# 체크포인트 경로 확인 & 정보 출력
if CHECKPOINT_FILE:
    _ckpt_path = Path(CHECKPOINT_FILE)
    if _ckpt_path.is_file():
        print(f"★ Checkpoint found: {CHECKPOINT_FILE}")
        _ckpt = torch.load(CHECKPOINT_FILE, map_location='cpu')
        if isinstance(_ckpt, dict) and 'epoch' in _ckpt:
            print(f"  epoch: {_ckpt['epoch']} | best_iou: {_ckpt.get('best_iou', 'N/A')}")
            print(f"  val_iou: {_ckpt.get('val_iou', 'N/A')}")
            print(f"  → 이어서 학습 시 epoch {_ckpt['epoch'] + 1}부터 시작됩니다")
            if 'best_checkpoint' in CHECKPOINT_FILE:
                print(f"  ⚠️ best_checkpoint 사용 중! last_checkpoint.pth를 권장합니다")
        else:
            print(f"  (state_dict only — epoch/IoU 정보 없음)")
        del _ckpt
    elif _ckpt_path.is_dir():
        print(f"⚠️ 경로가 디렉토리입니다 (파일명 누락): {CHECKPOINT_FILE}")
        _files = [f.name for f in _ckpt_path.glob('*.pth')]
        if _files:
            print(f"  사용 가능한 파일: {_files}")
            print(f"  → CHECKPOINT_FILE 경로 끝에 파일명을 추가하세요")
    else:
        print(f"⚠️ Checkpoint NOT FOUND: {CHECKPOINT_FILE}")

THUMB_DATA_DIR = Path('/kaggle/input/thumb-nail-training-data/thumb_train')
ORIGINAL_TRAIN_DIR = Path('/kaggle/input/nail-segmentation-dataset/NailSegmentationDatasetV2/train')
ROBOFLOW_DATA_DIR = Path('/kaggle/input/roboflow-nail-detection/roboflow_nail_masks')
CARD_DATA_DIR = Path('/kaggle/input/datasets/heojmin/credit-cards/credit_card_negative')
VAL_DATA_DIR = Path('/kaggle/input/nail-segmentation-dataset/NailSegmentationDatasetV2/val')
OUTPUT_DIR = Path('/kaggle/working/models')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 60)
print("Full Training: CLAHE + Dice+1.5xBCE")
print("=" * 60)
for label, path in [('Thumb', THUMB_DATA_DIR), ('Original', ORIGINAL_TRAIN_DIR),
                     ('Roboflow', ROBOFLOW_DATA_DIR), ('Card', CARD_DATA_DIR), ('Val', VAL_DATA_DIR)]:
    print(f"  {label}: {'OK' if path.exists() else 'NOT FOUND'} — {path}")

thumb_count = len(list((THUMB_DATA_DIR / 'images').glob('*.jpg')))
original_count = len(list((ORIGINAL_TRAIN_DIR / 'images').glob('*')))
roboflow_count = len(list((ROBOFLOW_DATA_DIR / 'images').glob('*.jpg')))
card_count = len(list((CARD_DATA_DIR / 'images').glob('*.jpg')))

total = thumb_count * CONFIG['thumb_repeat'] + original_count + roboflow_count + card_count
print(f"\nThumb: {thumb_count} x{CONFIG['thumb_repeat']} = {thumb_count * CONFIG['thumb_repeat']}")
print(f"Original: {original_count} (전체)")
print(f"Roboflow: {roboflow_count} (전체)")
print(f"Card (negative): {card_count} (전체)")
print(f"★ Total: {total} images")
```

---

## Cell 3: 데이터셋 클래스

```python
class NailDataset(Dataset):
    def __init__(self, image_paths, mask_paths, transform=None, size=640):
        self.image_paths = list(image_paths)
        self.mask_paths = list(mask_paths)
        self.transform = transform
        self.size = size
        print(f"Dataset: {len(self.image_paths)} images")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img = cv2.imread(str(self.image_paths[idx]))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.size, self.size))

        mask = cv2.imread(str(self.mask_paths[idx]), cv2.IMREAD_GRAYSCALE)
        mask = cv2.resize(mask, (self.size, self.size))
        mask = (mask > 127).astype(np.float32)

        if self.transform:
            augmented = self.transform(image=img, mask=mask)
            img = augmented['image']
            mask = augmented['mask']

        if not isinstance(mask, torch.Tensor):
            mask = torch.tensor(mask).float()

        return img, mask.unsqueeze(0)
```

---

## Cell 4: Augmentation (CLAHE 포함)

```python
def get_train_transform(size):
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
        A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=1.0),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])

def get_val_transform(size):
    return A.Compose([
        A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=1.0),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])
```

---

## Cell 5: 모델 생성

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

model = smp.DeepLabV3Plus(
    encoder_name=CONFIG['encoder'],
    encoder_weights='imagenet',
    classes=1,
    activation=None,  # raw logits
)
model = model.to(device)

total_params = sum(p.numel() for p in model.parameters())
print(f"Parameters: {total_params:,} (all trainable)")

# ★ 체크포인트 로드 (이어서 학습 시)
checkpoint_data = None
if CHECKPOINT_FILE and Path(CHECKPOINT_FILE).exists():
    print(f"\n★ Loading checkpoint: {CHECKPOINT_FILE}")
    checkpoint_data = torch.load(CHECKPOINT_FILE, map_location=device)

    if isinstance(checkpoint_data, dict) and 'model_state_dict' in checkpoint_data:
        model.load_state_dict(checkpoint_data['model_state_dict'])
        CONFIG['start_epoch'] = checkpoint_data.get('epoch', 0) + 1
        CONFIG['previous_best_iou'] = checkpoint_data.get('best_iou', 0.0)
        print(f"★ Resuming from epoch {CONFIG['start_epoch']}, best IoU: {CONFIG['previous_best_iou']:.4f}")
    else:
        model.load_state_dict(checkpoint_data)
        checkpoint_data = None
        print("★ Loaded state_dict only (no optimizer state)")
elif CHECKPOINT_FILE:
    print(f"\n⚠️ CHECKPOINT_FILE 설정됨, 파일을 찾을 수 없음: {CHECKPOINT_FILE}")
    print("⚠️ ImageNet weights로 처음부터 학습합니다. 경로를 확인하세요.")
    if 'best_checkpoint' in CHECKPOINT_FILE:
        print("⚠️ best_checkpoint.pth 대신 last_checkpoint.pth를 사용하세요!")
        print("   best는 best IoU 시점으로 되돌아가서 이후 에포크가 날아갑니다.")
else:
    print("Training from scratch with ImageNet weights")
```

---

## Cell 6: 데이터 로더

```python
# === 엄지 ===
thumb_images = sorted((THUMB_DATA_DIR / 'images').glob('*.jpg'))
thumb_masks = sorted((THUMB_DATA_DIR / 'masks').glob('*.png'))
thumb_images_repeated = list(thumb_images) * CONFIG['thumb_repeat']
thumb_masks_repeated = list(thumb_masks) * CONFIG['thumb_repeat']

# === Original (전체) ===
original_images_all = sorted((ORIGINAL_TRAIN_DIR / 'images').glob('*'))
original_masks_all = sorted((ORIGINAL_TRAIN_DIR / 'masks').glob('*'))

if CONFIG['original_sample'] is None:
    original_images = list(original_images_all)
    original_masks = list(original_masks_all)
else:
    indices = random.sample(range(len(original_images_all)), min(CONFIG['original_sample'], len(original_images_all)))
    original_images = [original_images_all[i] for i in indices]
    original_masks = [original_masks_all[i] for i in indices]

# === Roboflow (전체) ===
roboflow_images_all = sorted((ROBOFLOW_DATA_DIR / 'images').glob('*.jpg'))
roboflow_masks_all = sorted((ROBOFLOW_DATA_DIR / 'masks').glob('*.png'))

if CONFIG['roboflow_sample'] is None:
    roboflow_images = list(roboflow_images_all)
    roboflow_masks = list(roboflow_masks_all)
else:
    n = min(CONFIG['roboflow_sample'], len(roboflow_images_all))
    indices = random.sample(range(len(roboflow_images_all)), n)
    roboflow_images = [roboflow_images_all[i] for i in indices]
    roboflow_masks = [roboflow_masks_all[i] for i in indices]

# === Credit Card (negative sample, all-black masks) ===
card_images = sorted((CARD_DATA_DIR / 'images').glob('*.jpg'))
card_masks = sorted((CARD_DATA_DIR / 'masks').glob('*.png'))

# === 병합 & 셔플 ===
all_images = thumb_images_repeated + original_images + roboflow_images + list(card_images)
all_masks = thumb_masks_repeated + original_masks + roboflow_masks + list(card_masks)
combined = list(zip(all_images, all_masks))
random.shuffle(combined)
all_images, all_masks = zip(*combined)

print(f"Train: Thumb {len(thumb_images_repeated)} + Original {len(original_images)} + Roboflow {len(roboflow_images)} + Card {len(card_images)} = {len(all_images)}")

train_dataset = NailDataset(list(all_images), list(all_masks), get_train_transform(CONFIG['input_size']), CONFIG['input_size'])

# === Validation ===
val_images = sorted((VAL_DATA_DIR / 'images').glob('*'))
val_masks = sorted((VAL_DATA_DIR / 'masks').glob('*'))
val_dataset = NailDataset(val_images, val_masks, get_val_transform(CONFIG['input_size']), CONFIG['input_size'])

train_loader = DataLoader(train_dataset, batch_size=CONFIG['batch_size'], shuffle=True, num_workers=2, pin_memory=True, drop_last=True)
val_loader = DataLoader(val_dataset, batch_size=CONFIG['batch_size'], shuffle=False, num_workers=2, pin_memory=True)

print(f"Train: {len(train_loader)} batches | Val: {len(val_loader)} batches")
```

---

## Cell 7: Loss / Optimizer

```python
dice_loss_fn = smp.losses.DiceLoss(mode='binary', from_logits=True)
bce_loss_fn = nn.BCEWithLogitsLoss()

def criterion(pred, target):
    return CONFIG['dice_weight'] * dice_loss_fn(pred, target) + \
           CONFIG['bce_weight'] * bce_loss_fn(pred, target)

optimizer = torch.optim.AdamW(model.parameters(), lr=CONFIG['learning_rate'], weight_decay=CONFIG['weight_decay'])
scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=5, T_mult=2, eta_min=1e-7)

# ★ 체크포인트에서 optimizer/scheduler 복원
if checkpoint_data is not None and 'optimizer_state_dict' in checkpoint_data:
    optimizer.load_state_dict(checkpoint_data['optimizer_state_dict'])
    print("★ Optimizer state restored")
if checkpoint_data is not None and 'scheduler_state_dict' in checkpoint_data:
    scheduler.load_state_dict(checkpoint_data['scheduler_state_dict'])
    print("★ Scheduler state restored")

print(f"Loss: Dice({CONFIG['dice_weight']}) + BCE({CONFIG['bce_weight']}) from logits")
print(f"Optimizer: AdamW lr={CONFIG['learning_rate']}")
print(f"Scheduler: CosineAnnealingWarmRestarts T_0=5, T_mult=2")
print(f"Start epoch: {CONFIG['start_epoch']}")
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
            probs = torch.sigmoid(outputs)
            preds = (probs > 0.5).float()
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

        probs = torch.sigmoid(outputs)
        preds = (probs > 0.5).float()
        intersection = (preds * masks).sum()
        union = preds.sum() + masks.sum() - intersection
        iou = (intersection + 1e-6) / (union + 1e-6)

        total_loss += loss.item()
        total_iou += iou.item()

    return total_loss / len(loader), total_iou / len(loader)
```

---

## Cell 9: 학습

```python
best_iou = CONFIG['previous_best_iou']
start_epoch = CONFIG['start_epoch']
end_epoch = start_epoch + CONFIG['epochs']

print("=" * 60)
print(f"Full Training: CLAHE + Dice({CONFIG['dice_weight']})+BCE({CONFIG['bce_weight']})")
print(f"  {len(train_dataset)} images | batch {CONFIG['batch_size']} | max {CONFIG['epochs']} epochs | patience {CONFIG['patience']}")
print(f"  Epochs: {start_epoch} → {end_epoch} | Previous best IoU: {best_iou:.4f}")
print("=" * 60)

patience_counter = 0
history = {'train_loss': [], 'train_iou': [], 'val_loss': [], 'val_iou': [], 'lr': []}

for epoch in range(start_epoch, end_epoch):
    current_lr = optimizer.param_groups[0]['lr']
    print(f"\nEpoch {epoch + 1}/{end_epoch} (global) | LR: {current_lr:.8f}")

    train_loss, train_iou = train_one_epoch(model, train_loader, criterion, optimizer, device)
    val_loss, val_iou = validate(model, val_loader, criterion, device)
    scheduler.step()

    history['train_loss'].append(train_loss)
    history['train_iou'].append(train_iou)
    history['val_loss'].append(val_loss)
    history['val_iou'].append(val_iou)
    history['lr'].append(current_lr)

    print(f"  Train — Loss: {train_loss:.4f} | IoU: {train_iou:.4f}")
    print(f"  Val   — Loss: {val_loss:.4f} | IoU: {val_iou:.4f}")

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
        print(f"  ★ NEW BEST IoU: {best_iou:.4f} (+{improvement:.4f})")
    else:
        patience_counter += 1
        print(f"  No improvement ({patience_counter}/{CONFIG['patience']})")

    if patience_counter >= CONFIG['patience']:
        print(f"\n★ EARLY STOPPING at epoch {epoch + 1}")
        break

print(f"\n{'=' * 60}")
print(f"Training Complete!")
print(f"  Epochs: {start_epoch} → {epoch + 1}")
print(f"  Best Val IoU: {best_iou:.4f}")
print(f"{'=' * 60}")
```

---

## Cell 10: 학습 그래프

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].plot(history['train_loss'], label='Train', marker='o')
axes[0].plot(history['val_loss'], label='Val', marker='s')
axes[0].set_title('Loss'); axes[0].legend(); axes[0].grid(True)

axes[1].plot(history['train_iou'], label='Train', marker='o')
axes[1].plot(history['val_iou'], label='Val', marker='s')
axes[1].axhline(y=best_iou, color='r', linestyle='--', label=f'Best: {best_iou:.4f}')
axes[1].axhline(y=0.87, color='gray', linestyle='--', alpha=0.5, label='Prev best: 0.87')
axes[1].set_title('IoU'); axes[1].legend(); axes[1].grid(True)

axes[2].plot(history['lr'], marker='o')
axes[2].set_title('LR Schedule'); axes[2].grid(True)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'training_history.png', dpi=150)
plt.show()
```

---

## Cell 11: Threshold 최적화

```python
@torch.no_grad()
def optimize_threshold(model, loader, device):
    model.eval()
    thresholds = np.arange(0.10, 0.91, 0.05)
    results = []

    for thresh in thresholds:
        total_iou, count = 0, 0
        for images, masks in loader:
            images, masks = images.to(device), masks.to(device)
            probs = torch.sigmoid(model(images))
            preds = (probs > thresh).float()
            inter = (preds * masks).sum()
            union = preds.sum() + masks.sum() - inter
            total_iou += ((inter + 1e-6) / (union + 1e-6)).item()
            count += 1
        avg_iou = total_iou / count
        results.append({'threshold': round(float(thresh), 2), 'iou': round(avg_iou, 4)})
        print(f"  {thresh:.2f} → IoU: {avg_iou:.4f}")

    best = max(results, key=lambda x: x['iou'])
    print(f"\n★ Optimal: {best['threshold']} (IoU: {best['iou']})")

    with open(OUTPUT_DIR / 'threshold_optimization.json', 'w') as f:
        json.dump({'optimal_threshold': best['threshold'], 'optimal_iou': best['iou'], 'all_results': results}, f, indent=2)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot([r['threshold'] for r in results], [r['iou'] for r in results], 'b-o')
    ax.axvline(x=best['threshold'], color='r', linestyle='--', label=f"Best: {best['threshold']}")
    ax.set_xlabel('Threshold'); ax.set_ylabel('IoU'); ax.set_title('Threshold Optimization')
    ax.legend(); ax.grid(True)
    plt.savefig(OUTPUT_DIR / 'threshold_optimization.png', dpi=150)
    plt.show()
    return best

# best 모델 로드 후 최적화
model.load_state_dict(torch.load(OUTPUT_DIR / 'best_model.pth'))
optimal = optimize_threshold(model, val_loader, device)
print(f"\n→ config.yaml inference.threshold를 {optimal['threshold']}로 업데이트")
```

---

## Cell 12: 엄지 예측 시각화

```python
@torch.no_grad()
def visualize_predictions(model, device, images_list, masks_list, title, filename, num_samples=4):
    model.eval()
    n = min(num_samples, len(images_list))
    fig, axes = plt.subplots(n, 3, figsize=(12, 4 * n))

    for i in range(n):
        img = cv2.imread(str(images_list[i]))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img, (CONFIG['input_size'], CONFIG['input_size']))

        mask = cv2.imread(str(masks_list[i]), cv2.IMREAD_GRAYSCALE)
        mask_resized = cv2.resize(mask, (CONFIG['input_size'], CONFIG['input_size']))

        img_tensor = get_val_transform(CONFIG['input_size'])(image=img_resized)['image']
        pred = torch.sigmoid(model(img_tensor.unsqueeze(0).to(device))).squeeze().cpu().numpy()
        pred_binary = (pred > 0.5).astype(np.float32)

        gt = (mask_resized > 127).astype(np.float32)
        inter = (pred_binary * gt).sum()
        union = pred_binary.sum() + gt.sum() - inter
        iou = inter / (union + 1e-6)

        axes[i, 0].imshow(img_resized); axes[i, 0].set_title(f'{title} {i+1}'); axes[i, 0].axis('off')
        axes[i, 1].imshow(mask_resized, cmap='gray'); axes[i, 1].set_title('GT'); axes[i, 1].axis('off')
        axes[i, 2].imshow(pred_binary, cmap='gray'); axes[i, 2].set_title(f'Pred (IoU:{iou:.4f})'); axes[i, 2].axis('off')

    plt.suptitle(title, fontsize=14)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / filename, dpi=150)
    plt.show()

visualize_predictions(model, device, thumb_images, thumb_masks, 'Thumb', 'thumb_predictions.png')
```

---

## Cell 13: Roboflow 예측 시각화

```python
sample_idx = random.sample(range(len(roboflow_images)), min(4, len(roboflow_images)))
visualize_predictions(model, device,
    [roboflow_images[i] for i in sample_idx],
    [roboflow_masks[i] for i in sample_idx],
    'Roboflow', 'roboflow_predictions.png')
```

---

## Cell 14: 4손가락 예측 시각화 (망각 확인)

```python
sample_idx = random.sample(range(len(val_images)), min(4, len(val_images)))
visualize_predictions(model, device,
    [val_images[i] for i in sample_idx],
    [val_masks[i] for i in sample_idx],
    'Val (4-Finger)', 'finger_predictions.png')
```

---

## Cell 15: 출력 파일 확인

```python
print("=" * 60)
print("Output Files")
print("=" * 60)
for f in sorted(OUTPUT_DIR.glob('*')):
    print(f"  {f.name}: {f.stat().st_size / 1024 / 1024:.2f} MB")

print("\n★ 다운로드:")
print("  - best_model.pth (추론용)")
print("  - last_checkpoint.pth (이어서 학습용 — 마지막 에포크 상태)")
print("  - best_checkpoint.pth (best IoU 시점 백업)")
print("  - threshold_optimization.json (최적 threshold)")
```

---

## 학습 완료 후 로컬 배포

```bash
# 1. best_model.pth 배치
cp ~/Downloads/best_model.pth \
   packages/ml/models/nail_segmentation/v0.0.0/best_model.pth

# 2. threshold 확인 → config.yaml 업데이트
cat ~/Downloads/threshold_optimization.json | jq '.optimal_threshold'

# 3. 서버 재시작 & 테스트
pkill -f uvicorn && ./packages/ml/scripts/start_server.sh
curl http://localhost:8000/health | jq '.'
curl -X POST http://localhost:8000/api/segment-with-overlay \
  -F "image=@test.jpg" | jq '.mask_stats'
```

---

## 이어서 학습하기 (다음 세션)

Kaggle 12시간 세션 제한으로 학습이 중단된 경우, 체크포인트에서 이어서 학습할 수 있습니다.

> **중요**: `best_checkpoint.pth`가 아닌 **`last_checkpoint.pth`**를 사용하세요!
> - `last_checkpoint.pth`: 마지막 에포크 상태 → 이어서 학습에 적합
> - `best_checkpoint.pth`: best IoU 시점 → 이후 에포크의 학습이 날아감
>
> 예: epoch 7에서 best IoU, epoch 19까지 학습한 경우
> - `last_checkpoint.pth` → epoch 20부터 이어서 학습
> - `best_checkpoint.pth` → epoch 8부터 다시 학습 (epoch 8~19 손실)
>
> `last_checkpoint.pth`에도 `best_iou` 필드가 포함되어 있어 best 기준이 유지됩니다.

### 방법 A: 이전 노트북 Output 직접 참조 (권장)

다운로드/업로드 없이 이전 노트북의 output을 바로 input으로 연결합니다.

**1. 이전 노트북 "Save Version" 실행**
- 학습 완료(또는 세션 종료) 후 노트북 상단 **Save Version** 클릭
- "Save & Run All" 또는 "Quick Save" 선택 → output 파일이 확정됨

**2. 새 노트북에서 이전 노트북 Output 추가**
- 새 노트북 (또는 동일 노트북 새 세션) 열기
- 사이드바 **+ Add Input** 클릭
- 검색창에 이전 노트북 이름 입력 (예: "Advanced Nail Segmentation")
- 검색 결과에서 해당 노트북 선택 → **NOTEBOOKS** 섹션에 추가됨

**3. Cell 2의 CHECKPOINT_FILE 경로 수정**

```python
# 이전 노트북 output에서 직접 로드 (last_checkpoint 사용!)
CHECKPOINT_FILE = '/kaggle/input/notebooks/heojmin/advanced-nail-segmentation/models/last_checkpoint.pth'
```

> 경로 형식: `/kaggle/input/notebooks/{username}/{노트북-slug}/models/last_checkpoint.pth`

**4. 실행**
- 나머지 셀은 수정 없이 순서대로 실행
- Cell 5에서 체크포인트 로드 확인:
  ```
  ★ Resuming from epoch XX, best IoU: 0.XXXX
  ```

### 방법 B: Kaggle Models 업로드 (대안)

노트북을 삭제할 예정이거나 영구 보관이 필요한 경우 사용합니다.

1. 노트북 Output에서 `last_checkpoint.pth` 다운로드
2. [Kaggle Models](https://www.kaggle.com/models) > **New Model** > 이름: `nail-mixed-checkpoint-v1` > PyTorch > 업로드
3. 새 노트북 **+ Add Input** > **Models** 탭에서 추가
4. Cell 2 수정:
   ```python
   CHECKPOINT_FILE = '/kaggle/input/nail-mixed-checkpoint-v1/pytorch/default/1/last_checkpoint.pth'
   ```
