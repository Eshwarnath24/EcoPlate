"""
EcoPlate AI: Smart Plate-Constrained Food Waste Estimation Pipeline (Option A)
==============================================================================
Features:
1. Plate ROI Pre-Processing & Detection: Detects plate boundary to eliminate
   neighbor plates, table surfaces, and background objects (phones, clothes).
2. Dual-Confidence Post-Processing: Uses high confidence on after plates to
   eliminate ghost residue detections on clean plates.
3. Mask Rim Clipping: Enforces zero bleed outside the plate rim.
4. Item-by-Item & Overall Food Waste Calculation:
   - Area_before, Area_after, Waste %, Consumed %
5. Professional Side-by-Side Visualizations with Waste Scorecard Dashboard.
6. Structured CSV Report Export.
"""

import os
import sys
import cv2
import numpy as np
import pandas as pd
from ultralytics import YOLO

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Paths with robust local auto-detection
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(CURRENT_DIR, "weights", "yolo11s_level1_best.pt")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(CURRENT_DIR, "weights", "best.pt")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = r"f:\4 year\nndl\Team-4\runs\segment\training_runs\yolo11n_food_seg_v2\weights\best.pt"

TEST_DIR = os.path.join(CURRENT_DIR, "sample_test_plates")
if not os.path.exists(TEST_DIR):
    TEST_DIR = r"f:\4 year\nndl\Team-4\full_dataset_masks\yolo_dataset\images\test"

OUTPUT_DIR = os.path.join(CURRENT_DIR, "results", "level1_waste_estimation")

# Classes & Color Palette (BGR)
CLASS_NAMES = ['rice', 'dal_sambar', 'fryums', 'curry', 'poori', 'curd', 'chutney_pickle', 'other_food']
CLASS_COLORS = {
    'rice':           (0, 255, 255),    # Yellow
    'dal_sambar':     (0, 165, 255),    # Orange
    'fryums':         (0, 0, 255),      # Red
    'curry':          (0, 230, 0),      # Green
    'poori':          (255, 200, 0),    # Cyan/Blue
    'curd':           (240, 240, 240),  # White
    'chutney_pickle': (180, 0, 255),    # Purple
    'other_food':     (255, 0, 150),    # Pink
}


def detect_plate_bounds(img):
    """
    Detects the main circular dining plate in the photo.
    Returns: cx, cy, radius, plate_mask (uint8 binary 255/0)
    """
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)

    target_cy = int(h * 0.42)
    best_circle = None
    min_dist = float('inf')

    # Multi-pass Hough Circle detection
    for p2 in [35, 25, 20]:
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2,
            minDist=int(min(w, h) * 0.30),
            param1=80, param2=p2,
            minRadius=int(w * 0.30),
            maxRadius=int(w * 0.55)
        )
        if circles is not None:
            for c in circles[0]:
                cx, cy, r = c
                dist = np.hypot(cx - w / 2, cy - target_cy)
                if dist < min_dist and dist < min(w, h) * 0.35:
                    min_dist = dist
                    best_circle = (int(cx), int(cy), int(r))
            if best_circle is not None:
                break

    if best_circle is not None:
        cx, cy, r = best_circle
        r_inner = int(r * 0.96)  # Slightly inside rim to avoid reflections
    else:
        # Fallback: Default center dining ROI
        cx, cy = w // 2, int(h * 0.44)
        r_inner = int(w * 0.47)

    plate_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(plate_mask, (cx, cy), r_inner, 255, -1)
    return cx, cy, r_inner, plate_mask


def segment_plate_contents(
    model,
    img,
    plate_mask,
    is_after=False,
    served_classes=None,
    imgsz=768,
    conf_thresh=None,
    allow_extra_servings=False
):
    """
    Runs YOLO segmentation and applies Level 1 smart ROI + post-processing filters:
    1. High-resolution inference (imgsz=768) for finer food boundary detection.
    2. Keeps only detections whose center lies inside the dining plate ROI.
    3. Bitwise clips predicted mask contours to plate_mask (zero rim bleeding).
    4. Dual adaptive confidence thresholding: 0.30 for before, 0.40 for after.
    5. Closed-World Before-to-After Semantic Filter (Option A+):
       If is_after=True and served_classes is provided, any food detection whose class
       was NOT served on the before plate is pruned as a post-meal smudge/reflection hallucination,
       unless allow_extra_servings is True and conf >= 0.85 with significant area (> 5% of plate).
    """
    h, w = img.shape[:2]
    if conf_thresh is None:
        conf_thresh = 0.45 if is_after else 0.30

    res = model(img, imgsz=imgsz, conf=conf_thresh, verbose=False)

    detections = []
    class_totals = {c: {'area': 0, 'mask': np.zeros((h, w), dtype=np.uint8), 'max_conf': 0.0}
                    for c in CLASS_NAMES}

    if res[0].masks is not None and len(res[0].masks) > 0:
        masks_data = res[0].masks.data.cpu().numpy()
        boxes = res[0].boxes
        plate_area = int(np.sum(plate_mask > 0))

        for i, (m, cls_id, conf) in enumerate(zip(masks_data, boxes.cls, boxes.conf)):
            x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)
            bcx, bcy = (x1 + x2) // 2, (y1 + y2) // 2

            # Filter 1: Detection must originate inside the plate
            if not (0 <= bcy < h and 0 <= bcx < w and plate_mask[bcy, bcx] > 0):
                continue

            # Resize raw mask to image dimensions
            m_resized = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
            m_bin = (m_resized > 0.5).astype(np.uint8)

            # Filter 2: Clip mask strictly within plate boundary
            m_clipped = cv2.bitwise_and(m_bin, plate_mask)
            area = int(np.sum(m_clipped > 0))

            # Filter 3: Discard tiny noise specks (< 0.2% of plate area)
            if area < (plate_area * 0.002):
                continue

            cname = CLASS_NAMES[int(cls_id)]

            # Filter 4 (Level 1 Closed-World Semantic Filter):
            if is_after and served_classes is not None and cname not in served_classes:
                if not allow_extra_servings:
                    # Pure closed-world: food cannot appear on after plate if not served
                    continue
                elif float(conf) < 0.85 or area < (plate_area * 0.05):
                    # In extra-servings mode, only accept unmistakable large additions
                    continue

            class_totals[cname]['area'] += area
            class_totals[cname]['mask'] = cv2.bitwise_or(class_totals[cname]['mask'], m_clipped)
            class_totals[cname]['max_conf'] = max(class_totals[cname]['max_conf'], float(conf))

            detections.append({
                'class': cname,
                'conf': float(conf),
                'box': (x1, y1, x2, y2),
                'mask': m_clipped,
                'area': area
            })

    # Filter out empty classes
    active_items = {k: v for k, v in class_totals.items() if v['area'] > 0}
    return active_items, detections


def render_annotated_plate(img, plate_mask, plate_circle, detections, title=""):
    """
    Renders visual overlay with:
    - Plate rim boundary (subtle blue circle)
    - Segmentation masks with distinct colors
    - Contour outlines and labels
    """
    overlay = img.copy()
    annotated = img.copy()
    h, w = img.shape[:2]

    # Draw plate rim outline
    cx, cy, r = plate_circle
    cv2.circle(annotated, (cx, cy), r, (255, 200, 100), 2)

    # Render each food mask
    for det in detections:
        cname = det['class']
        conf = det['conf']
        color = CLASS_COLORS[cname]
        mask = det['mask']
        x1, y1, x2, y2 = det['box']

        # Fill mask on overlay
        overlay[mask == 1] = color

        # Draw contour boundary
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(annotated, contours, -1, color, 2)

        # Draw bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        # Label badge
        label = f"{cname} {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(annotated, (x1, max(0, y1 - th - 8)), (x1 + tw + 6, max(0, y1)), color, -1)
        cv2.putText(annotated, label, (x1 + 3, max(0, y1 - 4)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)

    # Alpha blend overlay
    blended = cv2.addWeighted(overlay, 0.40, annotated, 0.60, 0)

    # If no food detected, add clear banner
    if len(detections) == 0:
        cv2.putText(blended, "CLEAN / NO LEFTOVER FOOD", (w // 2 - 220, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 3)

    return blended


def build_comparison_dashboard(img_b, img_a, plate_id, before_items, after_items):
    """
    Creates a publication-quality side-by-side comparison image
    with a top header and bottom analytics scorecard.
    """
    # Standardize dimensions for display
    target_h = 1200
    target_w = 700

    disp_b = cv2.resize(img_b, (target_w, target_h))
    disp_a = cv2.resize(img_a, (target_w, target_h))

    total_w = target_w * 2 + 10

    # Top Header
    header_h = 70
    header = np.zeros((header_h, total_w, 3), dtype=np.uint8)
    header[:] = (30, 30, 30)

    title_text = f"EcoPlate AI  |  Plate {plate_id}  |  Smart Waste Estimation"
    cv2.putText(header, title_text, (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    # Side-by-side plate images
    cv2.putText(disp_b, "BEFORE (Initial Meal)", (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
    cv2.putText(disp_a, "AFTER (Post Meal)", (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 3)

    gap = np.zeros((target_h, 10, 3), dtype=np.uint8)
    gap[:] = (30, 30, 30)
    plates_row = np.hstack([disp_b, gap, disp_a])

    # Bottom Dashboard Scorecard
    total_area_b = sum(d['area'] for d in before_items.values())
    total_area_a = sum(d['area'] for d in after_items.values())

    overall_waste_pct = min(100.0, (total_area_a / total_area_b * 100.0)) if total_area_b > 0 else 0.0
    overall_consumed_pct = max(0.0, 100.0 - overall_waste_pct)

    # Determine status & color
    if overall_waste_pct <= 10.0:
        status_label = "EXCELLENT: Minimal Food Waste"
        status_color = (0, 200, 0)      # Green
    elif overall_waste_pct <= 30.0:
        status_label = "MODERATE: Some Leftover Waste"
        status_color = (0, 215, 255)    # Amber/Yellow
    else:
        status_label = "HIGH FOOD WASTE ALERT"
        status_color = (0, 0, 230)      # Red

    # Dynamic Dashboard Height
    num_items = max(len(before_items) + len(after_items), 2)
    dash_h = 160 + (num_items * 35)
    dash = np.zeros((dash_h, total_w, 3), dtype=np.uint8)
    dash[:] = (22, 22, 22)

    # Scorecard Header
    cv2.rectangle(dash, (20, 15), (total_w - 20, 65), (45, 45, 45), -1)
    cv2.putText(dash, f"OVERALL WASTE: {overall_waste_pct:.1f}%", (40, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.95, status_color, 2)
    cv2.putText(dash, f"CONSUMED: {overall_consumed_pct:.1f}%", (460, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.95, (255, 255, 255), 2)
    cv2.putText(dash, f"[{status_label}]", (820, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, status_color, 2)

    # Table Header
    y_table = 105
    cv2.putText(dash, "FOOD ITEM", (40, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)
    cv2.putText(dash, "BEFORE AREA", (300, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)
    cv2.putText(dash, "AFTER AREA", (550, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)
    cv2.putText(dash, "WASTE %", (800, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)
    cv2.putText(dash, "CONSUMED %", (1050, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)
    cv2.putText(dash, "STATUS", (1300, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)

    cv2.line(dash, (30, y_table + 10), (total_w - 20, y_table + 10), (70, 70, 70), 1)

    # Table Rows
    y_row = y_table + 40
    records = []

    # 1. Process items from Before plate
    processed_classes = set()
    for cname, b_info in before_items.items():
        processed_classes.add(cname)
        area_b = b_info['area']
        area_a = after_items.get(cname, {}).get('area', 0)
        item_waste = min(100.0, max(0.0, (area_a / area_b * 100.0))) if area_b > 0 else 0.0
        item_consumed = max(0.0, 100.0 - item_waste)

        if item_waste <= 5.0:
            item_status = "Fully Finished"
            item_color = (0, 220, 0)
        elif item_waste <= 25.0:
            item_status = "Minor Leftover"
            item_color = (0, 215, 255)
        else:
            item_status = "Substantial Waste"
            item_color = (0, 60, 255)

        # Draw row
        color_badge = CLASS_COLORS.get(cname, (200, 200, 200))
        cv2.circle(dash, (45, y_row - 6), 6, color_badge, -1)
        cv2.putText(dash, cname, (65, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
        cv2.putText(dash, f"{area_b:,} px", (300, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
        cv2.putText(dash, f"{area_a:,} px", (550, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
        cv2.putText(dash, f"{item_waste:.1f}%", (800, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, item_color, 2)
        cv2.putText(dash, f"{item_consumed:.1f}%", (1050, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 1)
        cv2.putText(dash, item_status, (1300, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, item_color, 2)

        records.append({
            'Plate_ID': plate_id,
            'Food_Item': cname,
            'Before_Area_px': area_b,
            'After_Area_px': area_a,
            'Waste_Percent': round(item_waste, 2),
            'Consumed_Percent': round(item_consumed, 2),
            'Item_Status': item_status,
            'Overall_Plate_Waste_Percent': round(overall_waste_pct, 2),
            'Plate_Status': status_label
        })

        y_row += 35

    # 2. Process extra items detected on After plate not on Before plate
    for cname, a_info in after_items.items():
        if cname not in processed_classes:
            area_a = a_info['area']
            color_badge = CLASS_COLORS.get(cname, (200, 200, 200))
            cv2.circle(dash, (45, y_row - 6), 6, color_badge, -1)
            cv2.putText(dash, f"{cname} (added)", (65, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 255), 2)
            cv2.putText(dash, "0 px (mid-meal)", (300, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (160, 160, 160), 1)
            cv2.putText(dash, f"{area_a:,} px", (550, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
            cv2.putText(dash, "100.0%", (800, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 60, 255), 2)
            cv2.putText(dash, "0.0%", (1050, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 1)
            cv2.putText(dash, "Extra Serving Leftover", (1300, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 60, 255), 2)

            records.append({
                'Plate_ID': plate_id,
                'Food_Item': f"{cname} (added)",
                'Before_Area_px': 0,
                'After_Area_px': area_a,
                'Waste_Percent': 100.0,
                'Consumed_Percent': 0.0,
                'Item_Status': "Extra Serving Leftover",
                'Overall_Plate_Waste_Percent': round(overall_waste_pct, 2),
                'Plate_Status': status_label
            })
            y_row += 35

    final_dashboard = np.vstack([header, plates_row, dash])
    return final_dashboard, records


def run_pipeline():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Loading YOLOv11n-seg model: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)

    # Find complete test pairs
    files = sorted(os.listdir(TEST_DIR))
    pairs = {}
    for f in files:
        name = os.path.splitext(f)[0]
        parts = name.rsplit('_', 1)
        if len(parts) == 2 and parts[1] in ['before', 'after']:
            pid = parts[0]
            if pid not in pairs:
                pairs[pid] = {}
            pairs[pid][parts[1]] = f

    complete = {k: v for k, v in pairs.items() if 'before' in v and 'after' in v}
    print(f"Found {len(complete)} complete before/after pairs in test set.")

    # Select representative test plates (including P1031, P4828, P9768)
    test_plates = ['P1031', 'P4828', 'P9768']
    # Add a couple more interesting test pairs
    extra_plates = [p for p in ['P1400', 'P2402', 'P5028'] if p in complete]
    selected_plates = test_plates + extra_plates

    all_records = []

    for pid in selected_plates:
        if pid not in complete:
            continue
        print(f"\n{'='*70}")
        print(f"PROCESSING PLATE: {pid}")
        print(f"{'='*70}")

        before_path = os.path.join(TEST_DIR, complete[pid]['before'])
        after_path  = os.path.join(TEST_DIR, complete[pid]['after'])

        img_b = cv2.imread(before_path)
        img_a = cv2.imread(after_path)

        if img_b is None or img_a is None:
            print(f"  [ERROR] Could not read images for {pid}")
            continue

        # Step 1: Detect Plate Boundary (ROI)
        cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
        cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)
        print(f"  Plate ROI Before: center=({cx_b},{cy_b}), r={r_b}")
        print(f"  Plate ROI After:  center=({cx_a},{cy_a}), r={r_a}")

        # Step 2: Segment with Plate Constraint & Level 1 Closed-World Semantic Filter
        before_items, dets_b = segment_plate_contents(model, img_b, pmask_b, is_after=False, imgsz=768)
        served_classes = set(before_items.keys())
        after_items, dets_a  = segment_plate_contents(model, img_a, pmask_a, is_after=True, served_classes=served_classes, imgsz=768)

        print(f"  Detections Before: {[d['class'] for d in dets_b]}")
        print(f"  Detections After:  {[d['class'] for d in dets_a]}")

        # Step 3: Render Clean Annotations
        annotated_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
        annotated_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")

        # Step 4: Build Scorecard Dashboard
        dashboard, records = build_comparison_dashboard(annotated_b, annotated_a, pid, before_items, after_items)
        all_records.extend(records)

        # Step 5: Save Comparison Image
        save_path = os.path.join(OUTPUT_DIR, f"{pid}_waste_analysis.jpg")
        cv2.imwrite(save_path, dashboard)
        print(f"  Saved Waste Analysis Dashboard: {save_path}")

        # Summary printout
        total_b = sum(d['area'] for d in before_items.values())
        total_a = sum(d['area'] for d in after_items.values())
        ov_waste = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0
        print(f"  >>> OVERALL WASTE FOR {pid}: {ov_waste:.1f}% (Consumed: {100.0 - ov_waste:.1f}%)")

    # Export CSV
    if all_records:
        df = pd.DataFrame(all_records)
        csv_path = os.path.join(OUTPUT_DIR, "waste_report.csv")
        df.to_csv(csv_path, index=False)
        print(f"\nSaved CSV Report to: {csv_path}")


if __name__ == "__main__":
    run_pipeline()
