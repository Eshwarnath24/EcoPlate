"""
EcoPlate AI: Master Dataset Batch Masking & YOLO-Seg Annotation
================================================================
Processes all 313 paired dining plates from ecoplate_images/ using:
1. Gemini Vision API (gemini-3.5-flash-lite) for semantic food detection.
2. Mobile SAM for pixel-perfect mask extraction.
3. Plate boundary clipping to remove extraneous table/clothing clutter.
4. Generates:
   - Visual Overlays (Before & After) in full_dataset_masks/before and /after
   - Side-by-Side Dark Themed Comparison Report Cards in full_dataset_masks/reports
   - YOLO-Segmentation Ready Dataset (train/val images & polygon labels) in full_dataset_masks/yolo_dataset
   - Dataset-wide Waste Analysis CSV in full_dataset_masks/waste_summary_all.csv
5. Checkpoint & Resume: If stopped, resumes seamlessly without re-running finished plates.
"""

import os
import sys
import time
import json
import shutil
from pathlib import Path
import cv2
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont
from google import genai
from ultralytics import SAM

load_dotenv(Path(__file__).resolve().with_name(".env"))

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Configuration ──
INPUT_DIR   = "ecoplate_images"
OUTPUT_DIR  = "full_dataset_masks"
SAM_WEIGHTS = "mobile_sam.pt"
MODEL_NAME  = "gemini-3.5-flash-lite"
VAL_SPLIT   = 0.20  # 20% validation split for YOLO training

class QuotaExhaustedException(Exception):
    """Raised when Gemini API quota or rate limit is reached."""
    pass

CLASS_MAP = {
    'rice': 0,
    'dal_sambar': 1,
    'fryums': 2,
    'curry': 3,
    'poori': 4,
    'curd': 5,
    'chutney_pickle': 6,
    'other_food': 7
}

LABEL_CONFIG = {
    'rice': {
        'display': 'Rice',
        'color': (255, 140, 0),        # Deep Sky Blue
        'rgb': (0, 140, 255)
    },
    'dal_sambar': {
        'display': 'Dal / Sambar',
        'color': (0, 215, 255),        # Amber Gold
        'rgb': (255, 215, 0)
    },
    'fryums': {
        'display': 'Fryums / Papad',
        'color': (255, 105, 180),      # Hot Pink / Violet
        'rgb': (180, 105, 255)
    },
    'curry': {
        'display': 'Curry / Sabzi',
        'color': (50, 205, 50),        # Lime Green
        'rgb': (50, 205, 50)
    },
    'poori': {
        'display': 'Poori / Roti',
        'color': (0, 69, 255),         # Crimson Red
        'rgb': (255, 69, 0)
    },
    'curd': {
        'display': 'Curd / Raita',
        'color': (238, 238, 175),      # Soft Cream Cyan
        'rgb': (175, 238, 238)
    },
    'chutney_pickle': {
        'display': 'Pickle / Chutney',
        'color': (0, 165, 255),        # Bright Orange
        'rgb': (255, 165, 0)
    },
    'other_food': {
        'display': 'Other Food',
        'color': (200, 130, 238),      # Lavender
        'rgb': (238, 130, 200)
    }
}


# ═════════════════════════════════════════════════════════════════════════════
#  1. PLATE BOUNDARY DETECTION
# ═════════════════════════════════════════════════════════════════════════════
def detect_plate_bounds(img):
    """Detects circular dining plate boundary to eliminate extraneous background."""
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)

    best_circle = None
    for p2 in [40, 30, 20]:
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=int(min(w, h) * 0.35),
            param1=80, param2=p2,
            minRadius=int(min(w, h) * 0.28),
            maxRadius=int(min(w, h) * 0.54)
        )
        if circles is not None:
            for c in circles[0]:
                dist_center = np.hypot(c[0] - w / 2, c[1] - h / 2)
                if dist_center < min(w, h) * 0.25:
                    best_circle = c
                    break
            if best_circle is not None:
                break

    mask = np.zeros((h, w), dtype=np.uint8)
    if best_circle is not None:
        cx, cy, r = int(best_circle[0]), int(best_circle[1]), int(best_circle[2])
        r_inner = int(r * 0.97)
        cv2.circle(mask, (cx, cy), r_inner, 255, -1)
    else:
        cx, cy = w // 2, int(h * 0.50)
        rx, ry = int(w * 0.44), int(h * 0.38)
        cv2.ellipse(mask, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)

    return mask


# ═════════════════════════════════════════════════════════════════════════════
#  2. GEMINI SEMANTIC DETECTION + MOBILE SAM EXTRACTION
# ═════════════════════════════════════════════════════════════════════════════
def detect_food_boxes_gemini(client, img_path, state='before', max_retries=3):
    """Calls Gemini Vision API to detect semantic food items and bounding boxes."""
    pil_img = Image.open(img_path)
    pil_resized = pil_img.copy()
    pil_resized.thumbnail((768, 768))

    prompt = f"""You are an expert computer vision model for food item detection on Indian dining plates.
Detect all visible food items on this {state.upper()} meal dining plate.
Target food types to identify (use strictly these lowercase keys):
- rice (plain rice, curd rice, fried rice, scattered leftover rice grains)
- dal_sambar (sambar, dal, rasam, yellow potato gravy, liquid gravies)
- fryums (fryums, papad, chips - group ALL pieces under label 'fryums')
- curry (dry curry, sabzi, vegetable curry)
- poori (poori, chapati, roti, naan)
- curd (plain yogurt, curd)
- chutney_pickle (pickle, green chutney, coconut chutney)
- other_food (any visible food not matching the above)

For each detected food item or leftover patch, return its bounding box [ymin, xmin, ymax, xmax] normalized from 0 to 1000.
Return ONLY a valid JSON array:
[
  {{"box_2d": [ymin, xmin, ymax, xmax], "label": "rice"}}
]
"""
    for attempt in range(max_retries):
        try:
            resp = client.models.generate_content(
                model=MODEL_NAME,
                contents=[pil_resized, prompt],
                config={'response_mime_type': 'application/json', 'temperature': 0.1}
            )
            data = json.loads(resp.text)
            if isinstance(data, list):
                return data
        except Exception as e:
            err_msg = str(e).lower()
            if '429' in err_msg or 'resource_exhausted' in err_msg or 'quota' in err_msg or 'limit' in err_msg:
                print(f"\n[CRITICAL ERROR] API Quota Exhausted on {img_path}: {e}", flush=True)
                print("[ACTION] Stopping execution immediately as instructed.", flush=True)
                raise QuotaExhaustedException(f"API Quota Exhausted: {e}")
            wait_time = (attempt + 1) * 3
            time.sleep(wait_time)

    return []


def segment_plate_items(sam, client, img_path, plate_mask, state='before'):
    """Extracts semantic masks using Gemini box prompts passed into Mobile SAM."""
    img_bgr = cv2.imread(img_path)
    h, w = img_bgr.shape[:2]

    boxes_data = detect_food_boxes_gemini(client, img_path, state=state)
    if not boxes_data:
        return {}

    item_masks = {}

    for it in boxes_data:
        label = it.get('label', 'other_food').lower()
        if label not in CLASS_MAP:
            if 'rice' in label: label = 'rice'
            elif 'dal' in label or 'sambar' in label or 'rasam' in label: label = 'dal_sambar'
            elif 'fryum' in label or 'papad' in label: label = 'fryums'
            elif 'curry' in label or 'sabzi' in label: label = 'curry'
            elif 'poori' in label or 'roti' in label or 'chapati' in label: label = 'poori'
            elif 'curd' in label: label = 'curd'
            elif 'pickle' in label or 'chutney' in label: label = 'chutney_pickle'
            else: label = 'other_food'

        box = it.get('box_2d', [])
        if len(box) != 4:
            continue

        ymin, xmin, ymax, xmax = box
        x1 = max(0, min(w - 1, int(xmin * w / 1000)))
        y1 = max(0, min(h - 1, int(ymin * h / 1000)))
        x2 = max(0, min(w - 1, int(xmax * w / 1000)))
        y2 = max(0, min(h - 1, int(ymax * h / 1000)))

        if x2 - x1 < 5 or y2 - y1 < 5:
            continue

        res = sam(img_path, bboxes=[[x1, y1, x2, y2]], verbose=False)[0]
        if res.masks is not None and len(res.masks.data) > 0:
            m = res.masks.data[0].cpu().numpy().astype(bool)
            m = m & (plate_mask > 0)
            if np.sum(m) > 100:
                if label not in item_masks:
                    item_masks[label] = np.zeros((h, w), dtype=bool)
                item_masks[label] |= m

    return item_masks


# ═════════════════════════════════════════════════════════════════════════════
#  3. YOLO-SEGMENTATION EXPORT
# ═════════════════════════════════════════════════════════════════════════════
def export_yolo_labels(item_masks, out_txt_path, h, w):
    """Converts binary masks to normalized YOLO-segmentation polygon format."""
    lines = []
    for label, mask in item_masks.items():
        cls_id = CLASS_MAP.get(label, CLASS_MAP['other_food'])
        contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            if cv2.contourArea(cnt) < 150:
                continue
            epsilon = 0.004 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            pts = approx.reshape(-1, 2)
            if len(pts) >= 3:
                coords = []
                for px, py in pts:
                    coords.append(f"{px / w:.5f} {py / h:.5f}")
                lines.append(f"{cls_id} " + " ".join(coords))

    with open(out_txt_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines) + ("\n" if lines else ""))


# ═════════════════════════════════════════════════════════════════════════════
#  4. VISUALIZATION & COMPARISON REPORT CARD
# ═════════════════════════════════════════════════════════════════════════════
def draw_overlay(img_bgr, item_masks):
    """Renders semi-transparent color overlays with crisp white borders and labels."""
    vis = img_bgr.copy()
    h, w = img_bgr.shape[:2]

    for label, mask in item_masks.items():
        cfg = LABEL_CONFIG.get(label, LABEL_CONFIG['other_food'])
        col = cfg['color']
        disp = cfg['display']

        colored = np.zeros_like(img_bgr)
        colored[mask] = col
        vis = np.where(colored > 0, cv2.addWeighted(colored, 0.45, vis, 0.55, 0), vis)

        cnts, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(vis, cnts, -1, (255, 255, 255), 2)

        if cnts:
            c_max = max(cnts, key=cv2.contourArea)
            M = cv2.moments(c_max)
            if M['m00'] > 0:
                lx = int(M['m10'] / M['m00'])
                ly = int(M['m01'] / M['m00'])
                cv2.putText(vis, disp, (lx - 30, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
                cv2.putText(vis, disp, (lx - 30, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    return vis


def create_report_card(plate_id, b_vis, a_vis, b_masks, a_masks):
    """Creates a dark-themed side-by-side comparison report card with waste analytics."""
    card_h = 720
    panel_w = int(b_vis.shape[1] * (card_h / b_vis.shape[0]))
    b_panel = cv2.resize(b_vis, (panel_w, card_h))
    a_panel = cv2.resize(a_vis, (panel_w, card_h))

    sidebar_w = 440
    total_w = panel_w * 2 + sidebar_w
    canvas = np.zeros((card_h, total_w, 3), dtype=np.uint8)
    canvas[:] = (20, 24, 30)

    canvas[:, :panel_w] = b_panel
    canvas[:, panel_w:panel_w * 2] = a_panel
    canvas[:, panel_w - 1:panel_w + 1] = (50, 60, 75)
    canvas[:, panel_w * 2 - 1:panel_w * 2 + 1] = (50, 60, 75)

    pil_canvas = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_canvas)

    try:
        font_title = ImageFont.truetype("arial.ttf", 26)
        font_sub   = ImageFont.truetype("arial.ttf", 16)
        font_item  = ImageFont.truetype("arial.ttf", 15)
        font_bold  = ImageFont.truetype("arialbd.ttf", 16)
    except:
        font_title = font_sub = font_item = font_bold = ImageFont.load_default()

    draw.rectangle([10, 10, 160, 42], fill=(0, 0, 0, 180))
    draw.text((20, 15), "BEFORE MEAL", fill=(100, 220, 255), font=font_sub)

    draw.rectangle([panel_w + 10, 10, panel_w + 160, 42], fill=(0, 0, 0, 180))
    draw.text((panel_w + 20, 15), "AFTER MEAL", fill=(255, 180, 100), font=font_sub)

    sx = panel_w * 2 + 25
    sy = 25
    draw.text((sx, sy), f"Plate ID: {plate_id}", fill=(255, 255, 255), font=font_title)
    sy += 38
    draw.text((sx, sy), "EcoPlate Food Waste Analysis", fill=(160, 175, 195), font=font_sub)
    sy += 35
    draw.line([(sx, sy), (total_w - 25, sy)], fill=(50, 60, 75), width=2)
    sy += 25

    all_keys = list(b_masks.keys())
    for k in a_masks:
        if k not in all_keys:
            all_keys.append(k)

    item_stats = []
    total_before_px = 0
    total_after_px = 0

    for label in all_keys:
        b_px = int(np.sum(b_masks.get(label, 0)))
        a_px = int(np.sum(a_masks.get(label, 0)))
        waste_pct = min(100.0, round((a_px / b_px * 100.0), 2)) if b_px > 0 else (100.0 if a_px > 0 else 0.0)
        total_before_px += b_px
        total_after_px += a_px

        cfg = LABEL_CONFIG.get(label, LABEL_CONFIG['other_food'])
        item_stats.append({
            'label': label,
            'display': cfg['display'],
            'before_px': b_px,
            'after_px': a_px,
            'waste_pct': waste_pct,
            'rgb': cfg['rgb']
        })

    overall_waste_pct = min(100.0, round((total_after_px / total_before_px * 100.0), 2)) if total_before_px > 0 else 0.0

    box_col = (40, 180, 80) if overall_waste_pct < 15 else (220, 160, 40) if overall_waste_pct < 40 else (230, 60, 60)
    draw.rounded_rectangle([sx, sy, total_w - 25, sy + 75], radius=8, fill=(30, 36, 46), outline=box_col, width=2)
    draw.text((sx + 15, sy + 12), "Total Plate Waste", fill=(180, 195, 210), font=font_sub)
    draw.text((sx + 15, sy + 38), f"{overall_waste_pct:.1f}%", fill=box_col, font=font_title)
    draw.text((sx + 140, sy + 42), f"({total_after_px:,} / {total_before_px:,} px)", fill=(140, 155, 170), font=font_sub)
    sy += 95

    draw.text((sx, sy), "FOOD ITEMS BREAKDOWN", fill=(120, 140, 165), font=font_sub)
    sy += 25

    for st in item_stats:
        draw.ellipse([sx, sy + 3, sx + 14, sy + 17], fill=st['rgb'], outline=(255, 255, 255))
        draw.text((sx + 24, sy), st['display'], fill=(255, 255, 255), font=font_bold)
        draw.text((sx + 150, sy + 2), f"{st['before_px']:,} px", fill=(160, 175, 190), font=font_item)

        wp = st['waste_pct']
        w_col = (80, 220, 120) if wp < 10 else (255, 200, 60) if wp < 40 else (255, 80, 80)
        draw.text((total_w - 110, sy), f"{wp:5.1f}% waste", fill=w_col, font=font_bold)
        sy += 28

        bar_w = total_w - 25 - sx
        bar_fill = int(bar_w * (wp / 100.0))
        draw.rounded_rectangle([sx, sy, total_w - 25, sy + 6], radius=3, fill=(45, 52, 65))
        if bar_fill > 0:
            draw.rounded_rectangle([sx, sy, sx + bar_fill, sy + 6], radius=3, fill=w_col)
        sy += 16

    res = cv2.cvtColor(np.array(pil_canvas), cv2.COLOR_RGB2BGR)
    return res, item_stats, overall_waste_pct


# ═════════════════════════════════════════════════════════════════════════════
#  5. MASTER BATCH EXECUTION PIPELINE
# ═════════════════════════════════════════════════════════════════════════════
def run_dataset_masking():
    print("=" * 75, flush=True)
    print("EcoPlate AI: Master Dataset Batch Masking & YOLO-Seg Annotation", flush=True)
    print("=" * 75, flush=True)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is required")
    client = genai.Client(api_key=api_key, http_options={'timeout': 25000})
    print(f"Loading Mobile SAM from '{SAM_WEIGHTS}'...", flush=True)
    sam = SAM(SAM_WEIGHTS)
    print("Mobile SAM successfully loaded!\n", flush=True)

    before_out = os.path.join(OUTPUT_DIR, "before")
    after_out  = os.path.join(OUTPUT_DIR, "after")
    report_out = os.path.join(OUTPUT_DIR, "reports")
    yolo_base  = os.path.join(OUTPUT_DIR, "yolo_dataset")
    os.makedirs(before_out, exist_ok=True)
    os.makedirs(after_out, exist_ok=True)
    os.makedirs(report_out, exist_ok=True)

    for split in ['train', 'val']:
        os.makedirs(os.path.join(yolo_base, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(yolo_base, 'labels', split), exist_ok=True)

    yaml_content = f"""path: {os.path.abspath(yolo_base).replace('\\', '/')}
train: images/train
val: images/val
names:
  0: rice
  1: dal_sambar
  2: fryums
  3: curry
  4: poori
  5: curd
  6: chutney_pickle
  7: other_food
"""
    with open(os.path.join(yolo_base, "dataset.yaml"), 'w', encoding='utf-8') as f:
        f.write(yaml_content)

    before_dir = os.path.join(INPUT_DIR, "before")
    after_dir  = os.path.join(INPUT_DIR, "after")
    b_files = set(f.replace(".jpg", "") for f in os.listdir(before_dir) if f.endswith(".jpg"))
    a_files = set(f.replace(".jpg", "") for f in os.listdir(after_dir) if f.endswith(".jpg"))
    plate_ids = sorted(list(b_files & a_files))

    print(f"Total verified plate pairs in dataset: {len(plate_ids)}\n", flush=True)

    checkpoint_file = os.path.join(OUTPUT_DIR, "checkpoint.json")
    completed_ids = set()
    all_summary_rows = []

    if os.path.exists(checkpoint_file):
        try:
            with open(checkpoint_file, 'r', encoding='utf-8') as f:
                chk_data = json.load(f)
                completed_ids = set(chk_data.get('completed', []))
                all_summary_rows = chk_data.get('summary_rows', [])
            print(f"[CHECKPOINT] Resuming from checkpoint: {len(completed_ids)} plates already completed.\n", flush=True)
        except Exception as e:
            print(f"[CHECKPOINT] Error loading checkpoint: {e}. Starting fresh.\n", flush=True)

    def get_split(pid):
        return 'val' if (hash(pid) % 100) < (VAL_SPLIT * 100) else 'train'

    start_time = time.time()

    for idx, pid in enumerate(plate_ids):
        if pid in completed_ids:
            continue

        b_path = os.path.join(before_dir, f"{pid}.jpg")
        a_path = os.path.join(after_dir,  f"{pid}.jpg")

        b_img = cv2.imread(b_path)
        a_img = cv2.imread(a_path)
        h_b, w_b = b_img.shape[:2]
        h_a, w_a = a_img.shape[:2]

        print(f"[{len(completed_ids) + 1}/{len(plate_ids)}] Processing {pid}...", flush=True)

        try:
            # 1. Plate boundaries
            b_plate = detect_plate_bounds(b_img)
            a_plate = detect_plate_bounds(a_img)

            # 2. Extract food item masks
            b_masks = segment_plate_items(sam, client, b_path, b_plate, state='before')
            a_masks = segment_plate_items(sam, client, a_path, a_plate, state='after')
        except QuotaExhaustedException as qe:
            print(f"\n[HALT] Stopped immediately due to API quota exhaustion on {pid}.", flush=True)
            # Save checkpoint and CSV with existing completed plates
            with open(checkpoint_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'completed': list(completed_ids),
                    'summary_rows': all_summary_rows
                }, f)
            pd.DataFrame(all_summary_rows).to_csv(os.path.join(OUTPUT_DIR, "waste_summary_all.csv"), index=False)
            sys.exit(0)

        # 3. Overlays
        b_vis = draw_overlay(b_img, b_masks)
        a_vis = draw_overlay(a_img, a_masks)
        cv2.imwrite(os.path.join(before_out, f"{pid}.jpg"), b_vis)
        cv2.imwrite(os.path.join(after_out,  f"{pid}.jpg"), a_vis)

        # 4. Report card
        report_img, item_stats, overall_waste = create_report_card(pid, b_vis, a_vis, b_masks, a_masks)
        cv2.imwrite(os.path.join(report_out, f"{pid}_report.jpg"), report_img)

        # 5. Export to YOLO-Seg
        split = get_split(pid)
        shutil.copy2(b_path, os.path.join(yolo_base, 'images', split, f"{pid}_before.jpg"))
        shutil.copy2(a_path, os.path.join(yolo_base, 'images', split, f"{pid}_after.jpg"))
        export_yolo_labels(b_masks, os.path.join(yolo_base, 'labels', split, f"{pid}_before.txt"), h_b, w_b)
        export_yolo_labels(a_masks, os.path.join(yolo_base, 'labels', split, f"{pid}_after.txt"), h_a, w_a)

        # 6. Waste statistics
        for st in item_stats:
            all_summary_rows.append({
                'plate_id': pid,
                'food_item': st['display'],
                'before_pixels': st['before_px'],
                'after_pixels': st['after_px'],
                'waste_pct': st['waste_pct'],
                'overall_waste_pct': overall_waste
            })

        completed_ids.add(pid)

        # Save checkpoint periodically (every 5 plates)
        if len(completed_ids) % 5 == 0 or len(completed_ids) == len(plate_ids):
            with open(checkpoint_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'completed': list(completed_ids),
                    'summary_rows': all_summary_rows
                }, f)
            pd.DataFrame(all_summary_rows).to_csv(os.path.join(OUTPUT_DIR, "waste_summary_all.csv"), index=False)

        print(f"  -> {pid} done: {len(b_masks)} before, {len(a_masks)} after | Total waste: {overall_waste:.1f}%\n", flush=True)

    final_csv_path = os.path.join(OUTPUT_DIR, "waste_summary_all.csv")
    pd.DataFrame(all_summary_rows).to_csv(final_csv_path, index=False)
    print(f"\n=======================================================================", flush=True)
    print(f"Batch Processing Complete! {len(completed_ids)}/{len(plate_ids)} plates processed.", flush=True)
    print(f"=======================================================================", flush=True)

if __name__ == "__main__":
    run_dataset_masking()
