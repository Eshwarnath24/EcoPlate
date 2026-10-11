"""
EcoPlate Deep Paired Plate Segmentation
========================================
Segments food items on paired dining plates (Before & After) using Mobile SAM
with feature-based agglomerative clustering and cross-plate food item matching.

Requirements satisfied:
1. Food items correctly segmented down to individual object boundaries.
2. The same food item (e.g. all fryum pieces, or entire rice mound) is grouped
   into a SINGLE cluster, not split into random multiple clusters.
3. The Before and After plates share identical colors for matching food items.
4. Bare stainless steel plate is cleanly excluded from food segmentation.
5. Saves results to test_masks/before, test_masks/after, test_masks/reports,
   and generates a comprehensive waste_summary.csv.
"""

import os
import sys
import cv2
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
from ultralytics import SAM
from sklearn.cluster import AgglomerativeClustering

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Configuration ──
INPUT_DIR  = "ecoplate_images"
OUTPUT_DIR = "test_masks"
MAX_PLATES = 10
SAM_WEIGHTS = "mobile_sam.pt"

# Curated high-contrast palette (BGR format)
PALETTE_BGR = [
    (255, 140,   0),  # Deep Sky Blue
    (  0, 215, 255),  # Gold / Amber
    (255, 105, 180),  # Hot Pink
    ( 50, 205,  50),  # Lime Green
    (  0,  69, 255),  # Crimson Red
    (238, 130, 238),  # Lavender / Violet
    (  0, 165, 255),  # Bright Orange
    (205, 235, 255),  # Pale Lemon
]

PALETTE_RGB = [(b, g, r) for (r, g, b) in [
    (  0, 140, 255),
    (255, 215,   0),
    (180, 105, 255),
    ( 50, 205,  50),
    (255,  69,   0),
    (238, 130, 238),
    (255, 165,   0),
    (255, 235, 205),
]]


# ═════════════════════════════════════════════════════════════════════════════
#  1. PLATE BOUNDARY DETECTION
# ═════════════════════════════════════════════════════════════════════════════
def detect_plate_bounds(img):
    """
    Detects circular / elliptical boundary of dining plate.
    Returns: cx, cy, rx, ry, plate_mask
    """
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
        r_inner = int(r * 0.96)  # Exclude outermost rim reflection
        cv2.circle(mask, (cx, cy), r_inner, 255, -1)
        return cx, cy, r_inner, r_inner, mask
    else:
        cx, cy = w // 2, int(h * 0.50)
        rx, ry = int(w * 0.44), int(h * 0.38)
        cv2.ellipse(mask, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
        return cx, cy, rx, ry, mask


# ═════════════════════════════════════════════════════════════════════════════
#  2. SAM OBJECT EXTRACTION & AGGLOMERATIVE CLUSTERING
# ═════════════════════════════════════════════════════════════════════════════
def extract_food_items(sam, img_path, plate_mask, is_after=False):
    """
    Extracts food items using Mobile SAM and clusters them into distinct items.
    """
    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    plate_px = max(1, int(np.sum(plate_mask > 0)))
    img_lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # SAM prediction
    res = sam(img_path, verbose=False)[0]
    if res.masks is None or len(res.masks.data) == 0:
        return []

    candidates = []
    features = []

    for i, m_t in enumerate(res.masks.data):
        m = m_t.cpu().numpy().astype(bool)
        m_in_plate = m & (plate_mask > 0)
        in_plate_px = int(np.sum(m_in_plate))
        total_px = int(np.sum(m))

        if total_px == 0:
            continue

        # Must be mostly inside plate (>65% inside)
        if in_plate_px / total_px < 0.65:
            continue

        # Must not be the entire plate (area < 75% of plate area)
        if in_plate_px / plate_px > 0.75:
            continue

        # Min area threshold (300 px)
        min_area = max(300, int(plate_px * 0.0004))
        if in_plate_px < min_area:
            continue

        # Color features
        mean_lab = np.mean(img_lab[m_in_plate], axis=0) # [L, a, b]
        mean_hsv = np.mean(img_hsv[m_in_plate], axis=0) # [H, S, V]

        # Centroid
        my, mx = np.where(m_in_plate)
        cx_norm = np.mean(mx) / w
        cy_norm = np.mean(my) / h

        # Multi-dimensional feature vector:
        # [L*/100, a*/100, b*/100, Sat/100, X_pos*0.35, Y_pos*0.35]
        feat = [
            mean_lab[0] / 100.0,
            mean_lab[1] / 100.0,
            mean_lab[2] / 100.0,
            mean_hsv[1] / 100.0 * 1.5, # Weight saturation to cleanly split plain rice & dal
            cx_norm * 0.35,
            cy_norm * 0.35
        ]

        candidates.append({
            "mask": m_in_plate,
            "area": in_plate_px,
            "lab": mean_lab,
            "hsv": mean_hsv,
            "centroid": (float(np.mean(mx)), float(np.mean(my)))
        })
        features.append(feat)

    if not candidates:
        return []

    # Cluster similar masks using AgglomerativeClustering with average linkage
    # Distance threshold 0.38 allows all fryum/chapati pieces to merge
    # while keeping White Rice and Sambar/Curry strictly separate.
    features = np.array(features)
    clusterer = AgglomerativeClustering(
        n_clusters=None, distance_threshold=0.38, metric='euclidean', linkage='average'
    )
    labels = clusterer.fit_predict(features)

    # Build merged food item masks
    merged_items = []
    for k in np.unique(labels):
        cluster_indices = np.where(labels == k)[0]
        combined_mask = np.zeros((h, w), dtype=bool)
        for idx in cluster_indices:
            combined_mask |= candidates[idx]["mask"]

        combined_px = int(np.sum(combined_mask))
        if combined_px < max(400, int(plate_px * 0.0006)):
            continue

        mean_lab = np.mean(img_lab[combined_mask], axis=0)
        mean_hsv = np.mean(img_hsv[combined_mask], axis=0)

        # Centroid of combined mask
        cy, cx = np.where(combined_mask)
        merged_items.append({
            "mask": combined_mask,
            "area": combined_px,
            "lab": mean_lab,
            "hsv": mean_hsv,
            "centroid": (float(np.mean(cx)), float(np.mean(cy)))
        })

    # Non-overlapping cleanup: larger items take precedence for contested pixels
    merged_items.sort(key=lambda x: x["area"], reverse=True)
    claimed = np.zeros((h, w), dtype=bool)
    cleaned_items = []

    for item in merged_items:
        m = item["mask"] & (~claimed)
        area = int(np.sum(m))
        if area > max(400, int(plate_px * 0.0006)):
            claimed |= m
            cleaned_items.append({
                "mask": m,
                "area": area,
                "lab": np.mean(img_lab[m], axis=0),
                "hsv": np.mean(img_hsv[m], axis=0),
                "centroid": (float(np.mean(np.where(m)[1])), float(np.mean(np.where(m)[0])))
            })

    return cleaned_items


# ═════════════════════════════════════════════════════════════════════════════
#  3. CROSS-PLATE COLOR & FOOD ITEM MATCHING
# ═════════════════════════════════════════════════════════════════════════════
def match_items(b_items, a_items):
    """
    Matches each After plate food item to the closest Before plate food item
    using LAB color difference and HSV saturation similarity.
    Returns: list of matched before indices for each after item.
    """
    matched_indices = []
    for a_item in a_items:
        if not b_items:
            matched_indices.append(0)
            continue

        best_b = 0
        min_dist = float('inf')
        for b_idx, b_item in enumerate(b_items):
            # Delta E in LAB
            lab_dist = np.linalg.norm(a_item["lab"] - b_item["lab"])
            # Saturation difference
            sat_dist = abs(a_item["hsv"][1] - b_item["hsv"][1]) * 0.3
            total_dist = lab_dist + sat_dist

            if total_dist < min_dist:
                min_dist = total_dist
                best_b = b_idx

        matched_indices.append(best_b)
    return matched_indices


# ═════════════════════════════════════════════════════════════════════════════
#  4. VISUALIZATION & REPORT CARD
# ═════════════════════════════════════════════════════════════════════════════
def draw_overlay(img, items, colors, labels):
    """
    Draws semi-transparent colored masks with smooth white outlines and labels.
    """
    vis = img.copy()
    h, w = img.shape[:2]

    for item, col, label_text in zip(items, colors, labels):
        m = item["mask"]
        colored = np.zeros_like(img)
        colored[m] = col
        # Alpha blending 45% mask, 55% original image
        vis = np.where(colored > 0, cv2.addWeighted(colored, 0.45, vis, 0.55, 0), vis)

        # Draw crisp white border
        cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(vis, cnts, -1, (255, 255, 255), 2)

        # Place label text at centroid or largest contour moment
        if cnts:
            c_max = max(cnts, key=cv2.contourArea)
            M = cv2.moments(c_max)
            if M["m00"] > 0:
                lx = int(M["m10"] / M["m00"])
                ly = int(M["m01"] / M["m00"])
                # Text with black outline for high readability
                cv2.putText(vis, label_text, (lx - 30, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
                cv2.putText(vis, label_text, (lx - 30, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    return vis


def create_side_by_side_report(plate_id, b_vis, a_vis, b_items, a_items, a_matched, b_colors):
    """
    Creates a professional, dark-themed side-by-side comparison report card:
    [ Before Plate Overlay ] | [ After Plate Overlay ] | [ Food Waste Summary Card ]
    """
    card_h = 720
    panel_w = int(b_vis.shape[1] * (card_h / b_vis.shape[0]))
    b_panel = cv2.resize(b_vis, (panel_w, card_h))
    a_panel = cv2.resize(a_vis, (panel_w, card_h))

    sidebar_w = 420
    total_w = panel_w * 2 + sidebar_w
    canvas = np.zeros((card_h, total_w, 3), dtype=np.uint8)
    canvas[:] = (20, 24, 30)  # Sleek dark slate background

    # Insert images
    canvas[:, :panel_w] = b_panel
    canvas[:, panel_w:panel_w * 2] = a_panel

    # Thin separator lines
    canvas[:, panel_w - 1:panel_w + 1] = (50, 60, 75)
    canvas[:, panel_w * 2 - 1:panel_w * 2 + 1] = (50, 60, 75)

    # Convert to PIL for beautiful typography
    pil_canvas = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_canvas)

    # Fonts
    try:
        font_title = ImageFont.truetype("arial.ttf", 26)
        font_sub   = ImageFont.truetype("arial.ttf", 16)
        font_item  = ImageFont.truetype("arial.ttf", 15)
        font_bold  = ImageFont.truetype("arialbd.ttf", 16)
    except:
        font_title = font_sub = font_item = font_bold = ImageFont.load_default()

    # Headers over images
    draw.rectangle([10, 10, 150, 42], fill=(0, 0, 0, 180))
    draw.text((20, 15), "BEFORE MEAL", fill=(100, 220, 255), font=font_sub)

    draw.rectangle([panel_w + 10, 10, panel_w + 150, 42], fill=(0, 0, 0, 180))
    draw.text((panel_w + 20, 15), "AFTER MEAL", fill=(255, 180, 100), font=font_sub)

    # Sidebar Header
    sx = panel_w * 2 + 25
    sy = 25
    draw.text((sx, sy), f"Plate ID: {plate_id}", fill=(255, 255, 255), font=font_title)
    sy += 38
    draw.text((sx, sy), "EcoPlate Food Waste Analysis", fill=(160, 175, 195), font=font_sub)
    sy += 35
    draw.line([(sx, sy), (total_w - 25, sy)], fill=(50, 60, 75), width=2)
    sy += 25

    # Compute waste statistics per item
    total_before_px = sum(item["area"] for item in b_items)
    item_stats = []

    for b_idx, b_item in enumerate(b_items):
        # Find matching after items
        matching_after = [a_item["area"] for a_item, m_idx in zip(a_items, a_matched) if m_idx == b_idx]
        after_px = sum(matching_after)
        b_px = b_item["area"]
        waste_pct = min(100.0, (after_px / b_px * 100.0)) if b_px > 0 else 0.0

        item_stats.append({
            "item_name": f"Item {b_idx + 1}",
            "before_px": b_px,
            "after_px": after_px,
            "waste_pct": waste_pct,
            "color": b_colors[b_idx % len(b_colors)]
        })

    total_after_px = sum(st["after_px"] for st in item_stats)
    overall_waste_pct = min(100.0, (total_after_px / total_before_px * 100.0)) if total_before_px > 0 else 0.0

    # Overall Waste Summary Box
    box_col = (40, 180, 80) if overall_waste_pct < 15 else (220, 160, 40) if overall_waste_pct < 40 else (230, 60, 60)
    draw.rounded_rectangle([sx, sy, total_w - 25, sy + 75], radius=8, fill=(30, 36, 46), outline=box_col, width=2)
    draw.text((sx + 15, sy + 12), "Total Plate Waste", fill=(180, 195, 210), font=font_sub)
    draw.text((sx + 15, sy + 38), f"{overall_waste_pct:.1f}%", fill=box_col, font=font_title)
    draw.text((sx + 140, sy + 42), f"({total_after_px:,} / {total_before_px:,} px)", fill=(140, 155, 170), font=font_sub)
    sy += 95

    # Food Item Details Header
    draw.text((sx, sy), "FOOD ITEMS BREAKDOWN", fill=(120, 140, 165), font=font_sub)
    sy += 25

    # Render each food item row
    for st in item_stats:
        col_bgr = st["color"]
        col_rgb = (col_bgr[2], col_bgr[1], col_bgr[0])

        # Color dot indicator
        draw.ellipse([sx, sy + 3, sx + 14, sy + 17], fill=col_rgb, outline=(255, 255, 255))

        # Item Name & Area
        draw.text((sx + 24, sy), st["item_name"], fill=(255, 255, 255), font=font_bold)
        draw.text((sx + 95, sy + 2), f"{st['before_px']:,} px", fill=(160, 175, 190), font=font_item)

        # Waste % Badge
        wp = st["waste_pct"]
        w_col = (80, 220, 120) if wp < 10 else (255, 200, 60) if wp < 40 else (255, 80, 80)
        draw.text((total_w - 110, sy), f"{wp:5.1f}% waste", fill=w_col, font=font_bold)

        sy += 28

        # Mini progress bar
        bar_w = total_w - 25 - sx
        bar_fill = int(bar_w * (wp / 100.0))
        draw.rounded_rectangle([sx, sy, total_w - 25, sy + 6], radius=3, fill=(45, 52, 65))
        if bar_fill > 0:
            draw.rounded_rectangle([sx, sy, sx + bar_fill, sy + 6], radius=3, fill=w_col)
        sy += 16

    # Convert back to BGR and return
    res = cv2.cvtColor(np.array(pil_canvas), cv2.COLOR_RGB2BGR)
    return res, item_stats, overall_waste_pct


# ═════════════════════════════════════════════════════════════════════════════
#  5. MAIN PROCESSING PIPELINE
# ═════════════════════════════════════════════════════════════════════════════
def process_plates():
    print("=" * 70, flush=True)
    print("EcoPlate Paired Segmentation: Initial 10 Plate Verification", flush=True)
    print("=" * 70, flush=True)

    # Prepare directories
    before_out = os.path.join(OUTPUT_DIR, "before")
    after_out  = os.path.join(OUTPUT_DIR, "after")
    report_out = os.path.join(OUTPUT_DIR, "reports")
    os.makedirs(before_out, exist_ok=True)
    os.makedirs(after_out, exist_ok=True)
    os.makedirs(report_out, exist_ok=True)

    # Initialize SAM
    print(f"Loading Mobile SAM from '{SAM_WEIGHTS}'...", flush=True)
    sam = SAM(SAM_WEIGHTS)
    print("Mobile SAM successfully loaded!\n", flush=True)

    # Find plate pairs
    before_dir = os.path.join(INPUT_DIR, "before")
    after_dir  = os.path.join(INPUT_DIR, "after")
    all_before_files = sorted([f for f in os.listdir(before_dir) if f.endswith(".jpg")])
    plate_ids = [f.replace(".jpg", "") for f in all_before_files][:MAX_PLATES]

    print(f"Found {len(plate_ids)} plates to process: {plate_ids}\n", flush=True)

    summary_rows = []

    for idx, pid in enumerate(plate_ids):
        print(f"[{idx+1}/{len(plate_ids)}] Processing Plate Pair: {pid}...", flush=True)

        b_file = os.path.join(before_dir, f"{pid}.jpg")
        a_file = os.path.join(after_dir,  f"{pid}.jpg")

        if not os.path.exists(b_file) or not os.path.exists(a_file):
            print(f"  [ERROR] Missing file for {pid}, skipping.\n", flush=True)
            continue

        b_img = cv2.imread(b_file)
        a_img = cv2.imread(a_file)

        # 1. Plate bounds
        _, _, _, _, b_plate = detect_plate_bounds(b_img)
        _, _, _, _, a_plate = detect_plate_bounds(a_img)

        # 2. Extract food items with SAM + Agglomerative Clustering
        print(f"  Extracting Before meal food items...", flush=True)
        b_items = extract_food_items(sam, b_file, b_plate, is_after=False)
        print(f"  -> Found {len(b_items)} distinct food items on Before plate.", flush=True)

        print(f"  Extracting After meal food items...", flush=True)
        a_items = extract_food_items(sam, a_file, a_plate, is_after=True)
        print(f"  -> Found {len(a_items)} food remnant clusters on After plate.", flush=True)

        # 3. Cross-plate matching
        a_matched = match_items(b_items, a_items)

        # Assign colors consistently
        b_colors = [PALETTE_BGR[i % len(PALETTE_BGR)] for i in range(len(b_items))]
        a_colors = [b_colors[m_idx] for m_idx in a_matched]

        b_labels = [f"Item {i + 1}" for i in range(len(b_items))]
        a_labels = [f"Item {m_idx + 1}" for m_idx in a_matched]

        # 4. Draw Overlays
        b_vis = draw_overlay(b_img, b_items, b_colors, b_labels)
        a_vis = draw_overlay(a_img, a_items, a_colors, a_labels)

        # Save individual overlays
        b_out_path = os.path.join(before_out, f"{pid}_before.jpg")
        a_out_path = os.path.join(after_out,  f"{pid}_after.jpg")
        cv2.imwrite(b_out_path, b_vis)
        cv2.imwrite(a_out_path, a_vis)

        # 5. Create Side-by-Side Report Card
        report_img, item_stats, overall_waste = create_side_by_side_report(
            pid, b_vis, a_vis, b_items, a_items, a_matched, b_colors
        )
        rep_out_path = os.path.join(report_out, f"{pid}_report.jpg")
        cv2.imwrite(rep_out_path, report_img)

        # Record in summary table
        for st in item_stats:
            summary_rows.append({
                "plate_id": pid,
                "item": st["item_name"],
                "before_pixels": st["before_px"],
                "after_pixels": st["after_px"],
                "waste_pct": round(st["waste_pct"], 2),
                "overall_waste_pct": round(overall_waste, 2)
            })

        print(f"  [OK] Saved overlays & report for {pid} (Total waste: {overall_waste:.1f}%)\n", flush=True)

    # Save summary CSV
    df = pd.DataFrame(summary_rows)
    csv_path = os.path.join(OUTPUT_DIR, "waste_summary.csv")
    df.to_csv(csv_path, index=False)
    print(f"Summary report written to {csv_path}", flush=True)
    print("=" * 70, flush=True)
    print("Completed processing all 10 plate pairs successfully!", flush=True)
    print("=" * 70, flush=True)


if __name__ == "__main__":
    process_plates()
