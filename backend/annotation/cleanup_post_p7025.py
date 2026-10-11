import os
import json
import pandas as pd

# Load plate order
before_dir = 'ecoplate_images/before'
all_plates = sorted([f.replace('.jpg', '') for f in os.listdir(before_dir) if f.endswith('.jpg')])
p7025_idx = all_plates.index('P7025')
plates_to_remove = set(all_plates[p7025_idx + 1:]) # All plates strictly after P7025 (P7046 onwards)

print(f"P7025 is at index {p7025_idx}. Total plates to remove from output: {len(plates_to_remove)}")

# Remove from full_dataset_masks/before, after, reports
for folder in ['before', 'after', 'reports']:
    p = os.path.join('full_dataset_masks', folder)
    if os.path.exists(p):
        for f in os.listdir(p):
            pid = f.split('_')[0].replace('.jpg', '')
            if pid in plates_to_remove:
                os.remove(os.path.join(p, f))

# Remove from yolo_dataset
yolo_base = 'full_dataset_masks/yolo_dataset'
for split in ['train', 'val']:
    for sub in ['images', 'labels']:
        p = os.path.join(yolo_base, sub, split)
        if os.path.exists(p):
            for f in os.listdir(p):
                pid = f.split('_')[0].replace('.jpg', '').replace('.txt', '')
                if pid in plates_to_remove:
                    os.remove(os.path.join(p, f))

# Clean checkpoint.json
chk_path = 'full_dataset_masks/checkpoint.json'
if os.path.exists(chk_path):
    with open(chk_path, 'r', encoding='utf-8') as f:
        chk = json.load(f)
    chk['completed'] = [pid for pid in chk.get('completed', []) if pid not in plates_to_remove]
    chk['summary_rows'] = [r for r in chk.get('summary_rows', []) if r['plate_id'] not in plates_to_remove]
    with open(chk_path, 'w', encoding='utf-8') as f:
        json.dump(chk, f)
    print(f"Updated checkpoint.json: {len(chk['completed'])} plates remaining in checkpoint.")

# Clean waste_summary_all.csv
csv_path = 'full_dataset_masks/waste_summary_all.csv'
if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)
    df_clean = df[~df['plate_id'].isin(plates_to_remove)]
    df_clean.to_csv(csv_path, index=False)
    print(f"Updated waste_summary_all.csv: {len(df_clean)} rows remaining.")

print("Cleanup completed successfully!")
