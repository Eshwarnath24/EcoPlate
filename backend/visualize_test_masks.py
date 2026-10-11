"""
EcoPlate AI: Visualize Segmentation Masks on Test Before/After Pairs
====================================================================
Runs the trained YOLOv11n-seg v2 model on 3 before/after plate pairs
from the test set and saves mask visualization images.
"""

import os
import sys
import cv2
import numpy as np
from ultralytics import YOLO

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Paths
MODEL_PATH = r"f:\4 year\nndl\Team-4\runs\segment\training_runs\yolo11n_food_seg_v2\weights\best.pt"
TEST_DIR   = r"f:\4 year\nndl\Team-4\full_dataset_masks\yolo_dataset\images\test"
OUTPUT_DIR = r"f:\4 year\nndl\Team-4\mask_visualizations"

# Class names and distinct colors (BGR)
CLASS_NAMES = ['rice', 'dal_sambar', 'fryums', 'curry', 'poori', 'curd', 'chutney_pickle', 'other_food']
CLASS_COLORS = [
    (0, 255, 255),    # rice        - Yellow
    (0, 165, 255),    # dal_sambar  - Orange
    (0, 0, 255),      # fryums     - Red
    (0, 255, 0),      # curry      - Green
    (255, 200, 0),    # poori      - Cyan-blue
    (255, 255, 255),  # curd       - White
    (128, 0, 255),    # chutney    - Purple
    (255, 0, 128),    # other_food - Pink
]


def draw_masks_on_image(image, results, alpha=0.45):
    """Draw segmentation masks and bounding boxes with labels on the image."""
    overlay = image.copy()
    annotated = image.copy()

    if results[0].masks is None or len(results[0].masks) == 0:
        # No detections - add text
        cv2.putText(annotated, "No food detected", (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        return annotated

    masks = results[0].masks.data.cpu().numpy()
    boxes = results[0].boxes
    classes = boxes.cls.cpu().numpy().astype(int)
    confs = boxes.conf.cpu().numpy()

    h, w = image.shape[:2]

    for i, (mask, cls_id, conf) in enumerate(zip(masks, classes, confs)):
        color = CLASS_COLORS[cls_id]
        label = f"{CLASS_NAMES[cls_id]} {conf:.2f}"

        # Resize mask to image size
        mask_resized = cv2.resize(mask, (w, h), interpolation=cv2.INTER_LINEAR)
        mask_binary = (mask_resized > 0.5).astype(np.uint8)

        # Draw filled mask on overlay
        overlay[mask_binary == 1] = color

        # Draw contour outline
        contours, _ = cv2.findContours(mask_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(annotated, contours, -1, color, 2)

        # Draw bounding box
        x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        # Draw label background
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(annotated, (x1, y1 - th - 10), (x1 + tw + 6, y1), color, -1)
        cv2.putText(annotated, label, (x1 + 3, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    # Blend overlay with annotated
    result = cv2.addWeighted(overlay, alpha, annotated, 1 - alpha, 0)
    return result


def create_side_by_side(before_img, after_img, plate_id, before_count, after_count):
    """Create a side-by-side comparison image with header."""
    h1, w1 = before_img.shape[:2]
    h2, w2 = after_img.shape[:2]

    # Resize to same height
    target_h = max(h1, h2)
    if h1 != target_h:
        scale = target_h / h1
        before_img = cv2.resize(before_img, (int(w1 * scale), target_h))
    if h2 != target_h:
        scale = target_h / h2
        after_img = cv2.resize(after_img, (int(w2 * scale), target_h))

    w1 = before_img.shape[1]
    w2 = after_img.shape[1]

    # Create header
    header_h = 60
    total_w = w1 + w2 + 10  # 10px gap
    header = np.zeros((header_h, total_w, 3), dtype=np.uint8)
    header[:] = (40, 40, 40)

    # Title text
    title = f"Plate {plate_id}  |  BEFORE ({before_count} items) vs AFTER ({after_count} items)"
    cv2.putText(header, title, (15, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

    # Combine
    gap = np.zeros((target_h, 10, 3), dtype=np.uint8)
    gap[:] = (40, 40, 40)
    combined = np.hstack([before_img, gap, after_img])

    # Add "BEFORE" and "AFTER" labels
    cv2.putText(combined, "BEFORE", (10, 35), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
    cv2.putText(combined, "AFTER", (w1 + 20, 35), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

    final = np.vstack([header, combined])
    return final


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Find complete before/after pairs
    files = sorted(os.listdir(TEST_DIR))
    pairs = {}
    for f in files:
        name = os.path.splitext(f)[0]
        parts = name.rsplit('_', 1)
        if len(parts) == 2 and parts[1] in ['before', 'after']:
            plate_id = parts[0]
            if plate_id not in pairs:
                pairs[plate_id] = {}
            pairs[plate_id][parts[1]] = f

    complete = {k: v for k, v in pairs.items() if 'before' in v and 'after' in v}
    
    # Pick 3 diverse pairs (first, middle, last)
    pair_ids = sorted(complete.keys())
    selected_indices = [0, len(pair_ids) // 2, len(pair_ids) - 1]
    selected = [pair_ids[i] for i in selected_indices]

    print(f"Selected plates for visualization: {selected}")
    print(f"Loading model from: {MODEL_PATH}")

    # Load model
    model = YOLO(MODEL_PATH)

    for plate_id in selected:
        pair = complete[plate_id]
        before_path = os.path.join(TEST_DIR, pair['before'])
        after_path = os.path.join(TEST_DIR, pair['after'])

        print(f"\n{'='*60}")
        print(f"Processing Plate: {plate_id}")
        print(f"{'='*60}")

        # Read images
        before_img = cv2.imread(before_path)
        after_img = cv2.imread(after_path)

        if before_img is None or after_img is None:
            print(f"  [ERROR] Could not read images for {plate_id}")
            continue

        # Run inference
        print(f"  Running inference on BEFORE image...")
        results_before = model(before_img, imgsz=640, conf=0.25, verbose=False)
        print(f"  Running inference on AFTER image...")
        results_after = model(after_img, imgsz=640, conf=0.25, verbose=False)

        # Count detections
        before_count = len(results_before[0].boxes) if results_before[0].boxes is not None else 0
        after_count = len(results_after[0].boxes) if results_after[0].boxes is not None else 0

        # Print detected classes
        if before_count > 0:
            cls_ids = results_before[0].boxes.cls.cpu().numpy().astype(int)
            confs = results_before[0].boxes.conf.cpu().numpy()
            print(f"  BEFORE detections ({before_count}):")
            for c, cf in zip(cls_ids, confs):
                print(f"    - {CLASS_NAMES[c]}: {cf:.3f}")

        if after_count > 0:
            cls_ids = results_after[0].boxes.cls.cpu().numpy().astype(int)
            confs = results_after[0].boxes.conf.cpu().numpy()
            print(f"  AFTER detections ({after_count}):")
            for c, cf in zip(cls_ids, confs):
                print(f"    - {CLASS_NAMES[c]}: {cf:.3f}")
        else:
            print(f"  AFTER: No food detected (plate likely clean!)")

        # Draw masks
        before_vis = draw_masks_on_image(before_img, results_before)
        after_vis = draw_masks_on_image(after_img, results_after)

        # Save individual images
        cv2.imwrite(os.path.join(OUTPUT_DIR, f"{plate_id}_before_mask.jpg"), before_vis)
        cv2.imwrite(os.path.join(OUTPUT_DIR, f"{plate_id}_after_mask.jpg"), after_vis)

        # Save side-by-side comparison
        comparison = create_side_by_side(before_vis, after_vis, plate_id, before_count, after_count)
        cv2.imwrite(os.path.join(OUTPUT_DIR, f"{plate_id}_comparison.jpg"), comparison)

        print(f"  Saved: {plate_id}_before_mask.jpg, {plate_id}_after_mask.jpg, {plate_id}_comparison.jpg")

    # Create legend image
    legend_h = 50 + len(CLASS_NAMES) * 40 + 20
    legend = np.zeros((legend_h, 400, 3), dtype=np.uint8)
    legend[:] = (30, 30, 30)
    cv2.putText(legend, "Color Legend", (15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    for i, (name, color) in enumerate(zip(CLASS_NAMES, CLASS_COLORS)):
        y = 70 + i * 40
        cv2.rectangle(legend, (20, y - 15), (50, y + 10), color, -1)
        cv2.putText(legend, name, (65, y + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "color_legend.jpg"), legend)

    print(f"\n{'='*60}")
    print(f"All visualizations saved to: {OUTPUT_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
