"""
EcoPlate Batch Pixel-Level Food Segmentation (v2 - Corrected)
Uses K-means HSV color clustering to find distinct food regions,
then MobileSAM to produce pixel-perfect masks per food item.

Output folder: segmented_plates_v2/
"""
import os
import glob
import cv2
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw
from ultralytics import SAM, YOLO


# ============================================================
# Config
# ============================================================
INPUT_DIR = "dataset_raw"
OUTPUT_DIR = "segmented_plates_v2"
MAX_PLATES = 20
K_CLUSTERS = 5          # K-means clusters per image
MIN_REGION_FRAC = 0.006 # region must be > 0.6% of image area
SAM_MODEL = "mobile_sam.pt"

COLORS_BGR = [
    (255, 229,   0),  # Cyan
    (  0, 214, 255),  # Yellow
    (180, 105, 255),  # Orange-Pink
    (  0, 200, 100),  # Green
    ( 68,  23, 255),  # Red
    (200,  50, 255),  # Magenta
    (255, 180,   0),  # Blue
]


# ============================================================
# Plate Detection
# ============================================================
def detect_plate(img):
    """Detects the circular steel plate using HoughCircles with fallback."""
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)

    circles = cv2.HoughCircles(
        blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=300,
        param1=80, param2=50,
        minRadius=int(min(w, h) * 0.20),
        maxRadius=int(min(w, h) * 0.55),
    )
    mask = np.zeros((h, w), dtype=np.uint8)
    if circles is not None:
        c = circles[0][0]
        cv2.circle(mask, (int(c[0]), int(c[1])), int(c[2]) - 8, 255, -1)
    else:
        cv2.ellipse(mask, (w // 2, int(h * 0.46)),
                    (int(w * 0.44), int(h * 0.33)), 0, 0, 360, 255, -1)
    return mask


# ============================================================
# K-Means Food Clustering
# ============================================================
def cluster_food_regions(img, plate_mask):
    """Clusters food pixels inside the plate by HSV color, returns bounding boxes."""
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Food pixels: inside plate AND has noticeable color saturation
    # (steel plate surface has very low saturation)
    food_region = (hsv[:, :, 1] > 25) & (plate_mask > 0)
    food_coords = np.where(food_region)

    if len(food_coords[0]) < 500:
        return []

    food_hsv = hsv[food_coords[0], food_coords[1]].astype(np.float32)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
    _, labels, centers = cv2.kmeans(food_hsv, K_CLUSTERS, None, criteria, 5,
                                     cv2.KMEANS_PP_CENTERS)

    min_area = w * h * MIN_REGION_FRAC
    regions = []

    for k in range(K_CLUSTERS):
        cluster_mask = np.zeros((h, w), dtype=np.uint8)
        member_idx = np.where(labels.flatten() == k)[0]
        cluster_mask[food_coords[0][member_idx], food_coords[1][member_idx]] = 255

        # Morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        cluster_mask = cv2.morphologyEx(cluster_mask, cv2.MORPH_CLOSE, kernel)
        cluster_mask = cv2.morphologyEx(cluster_mask, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(cluster_mask, cv2.RETR_EXTERNAL,
                                        cv2.CHAIN_APPROX_SIMPLE)
        for c in contours:
            area = cv2.contourArea(c)
            if area > min_area:
                x, y, bw, bh = cv2.boundingRect(c)
                pad = 12
                box = [max(0, x - pad), max(0, y - pad),
                       min(w, x + bw + pad), min(h, y + bh + pad)]
                regions.append({"box": box, "cluster": k, "area": area})

    return regions


def merge_overlapping(regions, iou_thresh=0.4):
    """Merges boxes that overlap significantly."""
    def box_iou(b1, b2):
        xi = max(b1[0], b2[0]); yi = max(b1[1], b2[1])
        xa = min(b1[2], b2[2]); ya = min(b1[3], b2[3])
        inter = max(0, xa - xi) * max(0, ya - yi)
        a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
        a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
        return inter / (a1 + a2 - inter) if (a1 + a2 - inter) > 0 else 0

    regions.sort(key=lambda r: r["area"], reverse=True)
    kept = []
    used = set()
    for i, r in enumerate(regions):
        if i in used:
            continue
        kept.append(r)
        for j in range(i + 1, len(regions)):
            if j not in used and box_iou(r["box"], regions[j]["box"]) > iou_thresh:
                used.add(j)
    return kept


# ============================================================
# SAM Segmentation
# ============================================================
def segment_with_sam(sam, img_path, boxes, plate_mask):
    """Runs MobileSAM on each bounding box prompt and returns clean masks."""
    if not boxes:
        return []

    results = sam.predict(img_path, bboxes=boxes, verbose=False)[0]
    masks = []
    for mask_data in results.masks.data:
        m = mask_data.cpu().numpy().astype(bool) & (plate_mask > 0)
        px = int(np.sum(m))
        if px > 200:
            masks.append({"mask": m, "pixels": px})
    return masks


# ============================================================
# After-Plate Waste Analysis
# ============================================================
def compute_after_waste(img_path, before_total_px):
    """Computes leftover food area in the after-meal image."""
    img = cv2.imread(img_path)
    if img is None:
        return 0, 0.0

    plate_mask = detect_plate(img)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Leftover food has color saturation; bare metal does not
    leftover = (hsv[:, :, 1] > 42) & (plate_mask > 0)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(leftover.astype(np.uint8), cv2.MORPH_OPEN, kernel)
    after_px = int(np.sum(cleaned > 0))

    waste_pct = min(100.0, (after_px / before_total_px * 100.0)) if before_total_px > 0 else 0.0
    return after_px, waste_pct


# ============================================================
# Visualization
# ============================================================
def draw_mask_overlay(img, masks, plate_mask):
    """Draws colored masks with contour outlines and item labels."""
    overlay = img.copy()
    for idx, m_info in enumerate(masks):
        m = m_info["mask"]
        col = COLORS_BGR[idx % len(COLORS_BGR)]
        colored = np.zeros_like(img)
        colored[m] = col
        overlay = np.where(colored > 0,
                           cv2.addWeighted(colored, 0.50, overlay, 0.50, 0),
                           overlay)
        contours, _ = cv2.findContours(m.astype(np.uint8),
                                        cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, contours, -1, (255, 255, 255), 2)

        # Label at centroid
        if contours:
            biggest = max(contours, key=cv2.contourArea)
            M = cv2.moments(biggest)
            if M["m00"] > 0:
                lx = int(M["m10"] / M["m00"])
                ly = int(M["m01"] / M["m00"])
                cv2.putText(overlay, f"Item {idx + 1}", (lx - 35, ly),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    return overlay


def create_report(pid, raw_path, mask_path, after_path, masks, after_px, waste_pct, save_path):
    """Creates 3-panel dashboard card."""
    b_raw = Image.open(raw_path).convert("RGB")
    b_mask = Image.open(mask_path).convert("RGB")
    a_raw = Image.open(after_path).convert("RGB")

    th = 620
    tw = int(b_raw.width * (th / b_raw.height))

    br = b_raw.resize((tw, th), Image.Resampling.LANCZOS)
    bm = b_mask.resize((tw, th), Image.Resampling.LANCZOS)
    ar = a_raw.resize((tw, th), Image.Resampling.LANCZOS)

    hdr = 55
    ftr = 160
    gap = 10
    cw = tw * 3 + gap * 4
    ch = th + hdr + ftr

    canvas = Image.new("RGB", (cw, ch), "#0E1117")
    draw = ImageDraw.Draw(canvas)

    x1, x2, x3 = gap, gap * 2 + tw, gap * 3 + tw * 2
    canvas.paste(br, (x1, hdr))
    canvas.paste(bm, (x2, hdr))
    canvas.paste(ar, (x3, hdr))

    draw.text((x1 + 8, 12), f"PLATE {pid}: RAW BEFORE", fill="#FFFFFF")
    draw.text((x2 + 8, 12), f"PLATE {pid}: SAM MASKS ({len(masks)} items)", fill="#00E5FF")
    draw.text((x3 + 8, 12), f"PLATE {pid}: AFTER MEAL", fill="#FF5252")
    draw.text((x1 + 8, 32), "Original plate photo", fill="#7A8A9A")
    draw.text((x2 + 8, 32), "K-means clusters → SAM pixel masks", fill="#7A8A9A")
    draw.text((x3 + 8, 32), "Post-consumption state", fill="#7A8A9A")

    for xp in [x1, x2, x3]:
        draw.rectangle([xp, hdr, xp + tw, hdr + th], outline="#2A3040", width=2)

    # Footer
    fy = hdr + th + 10
    draw.rectangle([gap, fy, cw - gap, ch - 10], outline="#2A3040", fill="#161B26", width=2)

    total_before = sum(m["pixels"] for m in masks)
    draw.text((gap + 15, fy + 10), f"ECOPLATE SEGMENTATION ANALYSIS — PLATE {pid}", fill="#00E5FF")

    for i, m in enumerate(masks):
        pct = (m["pixels"] / total_before * 100) if total_before > 0 else 0
        draw.text((gap + 15, fy + 38 + i * 22),
                  f"• Item {i + 1}: {m['pixels']:>7,} px ({pct:4.1f}% of plate food)",
                  fill="#E0E6ED")

    status_color = "#00E676" if waste_pct < 10 else ("#FFD600" if waste_pct < 35 else "#FF1744")
    category = "CLEAN" if waste_pct < 10 else ("MODERATE" if waste_pct < 35 else "HIGH WASTE")
    verdict_y = ch - 42
    draw.rectangle([gap + 10, verdict_y, cw - gap - 10, verdict_y + 26],
                   fill="#1B3A2B" if waste_pct < 10 else "#3A1B1B", outline=status_color, width=1)
    draw.text((gap + 20, verdict_y + 5),
              f"WASTE: {waste_pct:.1f}% | VERDICT: {category} | Before: {total_before:,} px | After: {after_px:,} px",
              fill=status_color)

    canvas.save(save_path)


# ============================================================
# YOLO-Seg Polygon Writer
# ============================================================
def write_yolo_seg(masks, img_shape, save_path):
    """Writes YOLO segmentation format polygon file."""
    h, w = img_shape[:2]
    lines = []
    for idx, m_info in enumerate(masks):
        m = m_info["mask"].astype(np.uint8)
        contours, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        c = max(contours, key=cv2.contourArea)
        eps = 0.003 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, eps, True)
        if len(approx) < 3:
            continue
        coords = " ".join(f"{pt[0][0] / w:.6f} {pt[0][1] / h:.6f}" for pt in approx)
        lines.append(f"{idx} {coords}")
    with open(save_path, "w") as f:
        f.write("\n".join(lines) + "\n")


# ============================================================
# Main Batch Pipeline
# ============================================================
def main():
    for d in [OUTPUT_DIR,
              os.path.join(OUTPUT_DIR, "reports"),
              os.path.join(OUTPUT_DIR, "before_masks"),
              os.path.join(OUTPUT_DIR, "yolo_seg_labels")]:
        os.makedirs(d, exist_ok=True)

    print("Loading MobileSAM...")
    sam = SAM(SAM_MODEL)

    # Gather complete before/after pairs
    before_map = {os.path.basename(f).replace("_before.jpg", ""): f
                  for f in glob.glob(os.path.join(INPUT_DIR, "*_before.jpg"))}
    after_map  = {os.path.basename(f).replace("_after.jpg", ""): f
                  for f in glob.glob(os.path.join(INPUT_DIR, "*_after.jpg"))}
    plate_ids = sorted(set(before_map) & set(after_map))[:MAX_PLATES]

    print(f"Processing {len(plate_ids)} plate pairs...\n")
    summary = []

    for i, pid in enumerate(plate_ids, 1):
        b_path = before_map[pid]
        a_path = after_map[pid]
        img = cv2.imread(b_path)
        h, w = img.shape[:2]

        print(f"[{i:02d}/{len(plate_ids)}] Plate {pid} ({w}x{h})")

        # 1. Detect plate
        plate_mask = detect_plate(img)

        # 2. K-means clustering to find food regions
        regions = cluster_food_regions(img, plate_mask)
        regions = merge_overlapping(regions)
        print(f"       K-means → {len(regions)} food regions")

        # 3. SAM segmentation on each region
        boxes = [r["box"] for r in regions]
        masks = segment_with_sam(sam, b_path, boxes, plate_mask)
        print(f"       SAM → {len(masks)} pixel masks")

        # 4. Draw overlay and save
        overlay = draw_mask_overlay(img, masks, plate_mask)
        mask_out = os.path.join(OUTPUT_DIR, "before_masks", f"{pid}_masks.jpg")
        cv2.imwrite(mask_out, overlay)

        # 5. Write YOLO-seg labels
        yolo_out = os.path.join(OUTPUT_DIR, "yolo_seg_labels", f"{pid}.txt")
        write_yolo_seg(masks, img.shape, yolo_out)

        # 6. Analyze after plate
        total_before = sum(m["pixels"] for m in masks)
        after_px, waste_pct = compute_after_waste(a_path, total_before)

        # 7. Create report card
        report_out = os.path.join(OUTPUT_DIR, "reports", f"{pid}_report.jpg")
        create_report(pid, b_path, mask_out, a_path, masks, after_px, waste_pct, report_out)

        summary.append({
            "plate_id": pid,
            "items_detected": len(masks),
            "before_food_px": total_before,
            "after_leftover_px": after_px,
            "waste_pct": round(waste_pct, 1),
            "category": "Clean (<10%)" if waste_pct < 10 else
                        ("Moderate (10-35%)" if waste_pct < 35 else "High (>35%)")
        })

        item_str = ", ".join(f"{m['pixels']:,}px" for m in masks)
        print(f"       Items: [{item_str}]")
        print(f"       Waste: {waste_pct:.1f}%\n")

    # Save summary CSV
    df = pd.DataFrame(summary)
    csv_out = os.path.join(OUTPUT_DIR, "waste_summary.csv")
    df.to_csv(csv_out, index=False)

    print("=" * 60)
    print("BATCH SEGMENTATION v2 COMPLETE!")
    print(f"  Reports:     {os.path.abspath(os.path.join(OUTPUT_DIR, 'reports'))}")
    print(f"  Mask Images: {os.path.abspath(os.path.join(OUTPUT_DIR, 'before_masks'))}")
    print(f"  YOLO Labels: {os.path.abspath(os.path.join(OUTPUT_DIR, 'yolo_seg_labels'))}")
    print(f"  Summary CSV: {os.path.abspath(csv_out)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
