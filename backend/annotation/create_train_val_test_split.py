"""
EcoPlate AI: Train / Validation / Test 3-Way Split Generator
=============================================================
Splits the 313 annotated plate pairs (624 images) into:
- Train: 70% (~219 plate pairs / ~438 images)
- Validation: 15% (~47 plate pairs / ~94 images)
- Test: 15% (~47 plate pairs / ~92 images)

Guarantees:
1. Both Before & After images for a plate ID stay in the same split (no data leakage).
2. Reproducible with fixed random seed (42).
3. Updates full_dataset_masks/yolo_dataset/dataset.yaml with train, val, and test paths.
"""

import os
import shutil
import random
import yaml

SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO   = 0.15
TEST_RATIO  = 0.15

YOLO_BASE = "full_dataset_masks/yolo_dataset"
IMAGES_DIR = os.path.join(YOLO_BASE, "images")
LABELS_DIR = os.path.join(YOLO_BASE, "labels")

# Collect all current image and label files
all_files = {}

for split in ['train', 'val', 'test']:
    s_img_dir = os.path.join(IMAGES_DIR, split)
    s_lbl_dir = os.path.join(LABELS_DIR, split)
    if os.path.exists(s_img_dir):
        for f in os.listdir(s_img_dir):
            if f.endswith('.jpg'):
                pid = f.split('_')[0]
                if pid not in all_files:
                    all_files[pid] = {'images': [], 'labels': []}
                all_files[pid]['images'].append(os.path.join(s_img_dir, f))

                lbl_name = f.replace('.jpg', '.txt')
                lbl_path = os.path.join(s_lbl_dir, lbl_name)
                if os.path.exists(lbl_path):
                    all_files[pid]['labels'].append(lbl_path)

plate_ids = sorted(list(all_files.keys()))
print(f"Total unique plate IDs found: {len(plate_ids)}")

# Shuffle with fixed seed
random.seed(SEED)
random.shuffle(plate_ids)

n_total = len(plate_ids)
n_train = int(n_total * TRAIN_RATIO)
n_val   = int(n_total * VAL_RATIO)
n_test  = n_total - n_train - n_val

train_pids = set(plate_ids[:n_train])
val_pids   = set(plate_ids[n_train:n_train + n_val])
test_pids  = set(plate_ids[n_train + n_val:])

print(f"Split breakdown by plate pairs:")
print(f"  Train plates: {len(train_pids)} ({len(train_pids)/n_total*100:.1f}%)")
print(f"  Val plates:   {len(val_pids)} ({len(val_pids)/n_total*100:.1f}%)")
print(f"  Test plates:  {len(test_pids)} ({len(test_pids)/n_total*100:.1f}%)")

# Temporary staging directory to prevent overwrite conflicts
temp_stage = os.path.join(YOLO_BASE, "_staging")
if os.path.exists(temp_stage):
    shutil.rmtree(temp_stage)

os.makedirs(os.path.join(temp_stage, "images"), exist_ok=True)
os.makedirs(os.path.join(temp_stage, "labels"), exist_ok=True)

# Move all existing files to staging
for pid, data in all_files.items():
    for img_p in data['images']:
        shutil.move(img_p, os.path.join(temp_stage, "images", os.path.basename(img_p)))
    for lbl_p in data['labels']:
        shutil.move(lbl_p, os.path.join(temp_stage, "labels", os.path.basename(lbl_p)))

# Clean and recreate images and labels directories with train, val, test
for sub in ['images', 'labels']:
    p = os.path.join(YOLO_BASE, sub)
    if os.path.exists(p):
        shutil.rmtree(p)
    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(p, split), exist_ok=True)

# Move files from staging into their respective split directories
split_counts = {'train': 0, 'val': 0, 'test': 0}

for pid in plate_ids:
    if pid in train_pids:
        target_split = 'train'
    elif pid in val_pids:
        target_split = 'val'
    else:
        target_split = 'test'

    for f in os.listdir(os.path.join(temp_stage, "images")):
        if f.startswith(pid + "_"):
            shutil.move(os.path.join(temp_stage, "images", f), os.path.join(IMAGES_DIR, target_split, f))
            lbl_f = f.replace('.jpg', '.txt')
            stg_lbl = os.path.join(temp_stage, "labels", lbl_f)
            if os.path.exists(stg_lbl):
                shutil.move(stg_lbl, os.path.join(LABELS_DIR, target_split, lbl_f))
            split_counts[target_split] += 1

# Remove staging
shutil.rmtree(temp_stage)

# Update dataset.yaml
yaml_path = os.path.join(YOLO_BASE, "dataset.yaml")
yaml_data = {
    'path': os.path.abspath(YOLO_BASE).replace('\\', '/'),
    'train': 'images/train',
    'val': 'images/val',
    'test': 'images/test',
    'names': {
        0: 'rice',
        1: 'dal_sambar',
        2: 'fryums',
        3: 'curry',
        4: 'poori',
        5: 'curd',
        6: 'chutney_pickle',
        7: 'other_food'
    }
}

with open(yaml_path, 'w', encoding='utf-8') as f:
    yaml.dump(yaml_data, f, sort_keys=False)

print("\n" + "=" * 60)
print("Dataset Successfully Split (Train / Validation / Test)")
print("=" * 60)
for s in ['train', 'val', 'test']:
    n_img = len(os.listdir(os.path.join(IMAGES_DIR, s)))
    n_lbl = len(os.listdir(os.path.join(LABELS_DIR, s)))
    print(f"  {s.upper():<6} -> {n_img} images, {n_lbl} label files")

print(f"\nUpdated dataset.yaml at: {yaml_path}")
