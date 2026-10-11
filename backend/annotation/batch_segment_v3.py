"""
EcoPlate Batch Pixel-Level Segmentation v3
Applies K-means + SAM to BOTH before AND after images.
Saves segmented overlays in separate folders for inspection.
"""
import os
import glob
import cv2
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw
from ultralytics import SAM

INPUT_DIR = "dataset_raw"
OUTPUT_DIR = "segmented_plates_v3"
MAX_PLATES = 20
K_CLUSTERS = 5
MIN_REGION_FRAC = 0.006
SAM_MODEL = "mobile_sam.pt"

COLORS_BGR = [
    (255, 229,   0),  # Cyan
    (  0, 214, 255),  # Yellow
    (180, 105, 255),  # Orange-Pink
    (  0, 200, 100),  # Green
    ( 68,  23, 255),  # Red
    (200,  50, 255),  # Magenta
    (255, 180,   0),  # Blue
    (100, 255, 255),  # Light yellow
]


def detect_plate(img):
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


def cluster_food_regions(img, plate_mask, sat_thresh=25):
    """K-means clustering on food pixels inside plate."""
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    food_region = (hsv[:, :, 1] > sat_thresh) & (plate_mask > 0)
    food_coords = np.where(food_region)

    if len(food_coords[0]) < 300:
        return [], 0

    food_hsv = hsv[food_coords[0], food_coords[1]].astype(np.float32)
    total_food_px_rough = len(food_coords[0])

    # Adaptive K based on how much food is on the plate
    K = min(K_CLUSTERS, max(2, total_food_px_rough // 15000))

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
    _, labels, centers = cv2.kmeans(food_hsv, K, None, criteria, 5,
                                     cv2.KMEANS_PP_CENTERS)

    min_area = w * h * MIN_REGION_FRAC
    regions = []

    for k in range(K):
        cluster_mask = np.zeros((h, w), dtype=np.uint8)
        member_idx = np.where(labels.flatten() == k)[0]
        cluster_mask[food_coords[0][member_idx], food_coords[1][member_idx]] = 255

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
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

    return regions, total_food_px_rough


def merge_overlapping(regions, iou_thresh=0.4):
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


def segment_image(sam, img_path, sat_thresh=25):
    """Full pipeline: detect plate → K-means → SAM → masks + overlay."""
    img = cv2.imread(img_path)
    if img is None:
        return [], None, 0

    h, w = img.shape[:2]
    plate_mask = detect_plate(img)

    regions, rough_px = cluster_food_regions(img, plate_mask, sat_thresh)
    regions = merge_overlapping(regions)

    if not regions:
        # No food detected — return empty plate overlay
        overlay = img.copy()
        cv2.putText(overlay, "No food detected", (w // 4, h // 2),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
        return [], overlay, 0

    boxes = [r["box"] for r in regions]
    results = sam.predict(img_path, bboxes=boxes, verbose=False)[0]

    overlay = img.copy()
    masks_out = []
    total_px = 0

    for idx, mask_data in enumerate(results.masks.data):
        m = mask_data.cpu().numpy().astype(bool) & (plate_mask > 0)
        px = int(np.sum(m))
        if px < 200:
            continue
        total_px += px
        masks_out.append({"mask": m, "pixels": px})

        col = COLORS_BGR[idx % len(COLORS_BGR)]
        colored = np.zeros_like(img)
        colored[m] = col
        overlay = np.where(colored > 0,
                           cv2.addWeighted(colored, 0.50, overlay, 0.50, 0),
                           overlay)
        contours, _ = cv2.findContours(m.astype(np.uint8),
                                        cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, contours, -1, (255, 255, 255), 2)

        if contours:
            biggest = max(contours, key=cv2.contourArea)
            M = cv2.moments(biggest)
            if M["m00"] > 0:
                lx = int(M["m10"] / M["m00"])
                ly = int(M["m01"] / M["m00"])
                cv2.putText(overlay, f"Item {idx + 1}", (lx - 35, ly),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    return masks_out, overlay, total_px


def write_yolo_seg(masks, img_shape, save_path):
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


def create_report(pid, b_raw, b_mask_path, a_raw, a_mask_path,
                  b_masks, a_masks, b_px, a_px, waste_pct, save_path):
    imgs = []
    titles = []
    subtitles = []

    for path, title, sub in [
        (b_raw,       f"PLATE {pid}: RAW BEFORE",          "Original plate photo"),
        (b_mask_path, f"PLATE {pid}: BEFORE MASKS ({len(b_masks)} items)", "K-means → SAM segmented"),
        (a_raw,       f"PLATE {pid}: RAW AFTER",           "Post-consumption state"),
        (a_mask_path, f"PLATE {pid}: AFTER MASKS ({len(a_masks)} items)",  "Leftover food segmented"),
    ]:
        imgs.append(Image.open(path).convert("RGB"))
        titles.append(title)
        subtitles.append(sub)

    th = 500
    tw = int(imgs[0].width * (th / imgs[0].height))
    resized = [im.resize((tw, th), Image.Resampling.LANCZOS) for im in imgs]

    hdr = 52
    ftr = 130
    gap = 8
    cw = tw * 4 + gap * 5
    ch = th + hdr + ftr

    canvas = Image.new("RGB", (cw, ch), "#0E1117")
    draw = ImageDraw.Draw(canvas)

    title_colors = ["#FFFFFF", "#00E5FF", "#FF5252", "#FF9100"]

    for i, (rim, title, sub) in enumerate(zip(resized, titles, subtitles)):
        x = gap * (i + 1) + tw * i
        canvas.paste(rim, (x, hdr))
        draw.text((x + 6, 8), title, fill=title_colors[i])
        draw.text((x + 6, 28), sub, fill="#7A8A9A")
        draw.rectangle([x, hdr, x + tw, hdr + th], outline="#2A3040", width=2)

    fy = hdr + th + 8
    draw.rectangle([gap, fy, cw - gap, ch - 8], outline="#2A3040", fill="#161B26", width=2)

    draw.text((gap + 12, fy + 8),
              f"ECOPLATE SEGMENTATION ANALYSIS — PLATE {pid}", fill="#00E5FF")

    # Item breakdown
    col_x = gap + 12
    for i, m in enumerate(b_masks[:6]):
        pct = (m["pixels"] / b_px * 100) if b_px > 0 else 0
        draw.text((col_x, fy + 30 + i * 18),
                  f"Before Item {i+1}: {m['pixels']:>7,} px ({pct:4.1f}%)", fill="#E0E6ED")

    col_x2 = cw // 2
    for i, m in enumerate(a_masks[:6]):
        pct = (m["pixels"] / a_px * 100) if a_px > 0 else 0
        draw.text((col_x2, fy + 30 + i * 18),
                  f"After Item {i+1}:  {m['pixels']:>7,} px ({pct:4.1f}%)", fill="#FFB74D")

    if not a_masks:
        draw.text((col_x2, fy + 30), "No leftover food detected (clean plate!)", fill="#00E676")

    status_color = "#00E676" if waste_pct < 10 else ("#FFD600" if waste_pct < 35 else "#FF1744")
    category = "CLEAN" if waste_pct < 10 else ("MODERATE" if waste_pct < 35 else "HIGH WASTE")
    vy = ch - 30
    draw.rectangle([gap + 6, vy, cw - gap - 6, vy + 20],
                   fill="#1B3A2B" if waste_pct < 10 else "#3A1B1B",
                   outline=status_color, width=1)
    draw.text((gap + 16, vy + 3),
              f"WASTE: {waste_pct:.1f}% | {category} | Before Food: {b_px:,} px | After Leftover: {a_px:,} px",
              fill=status_color)
    canvas.save(save_path)


def main():
    dirs = {
        "before_masks":   os.path.join(OUTPUT_DIR, "before_masks"),
        "after_masks":    os.path.join(OUTPUT_DIR, "after_masks"),
        "reports":        os.path.join(OUTPUT_DIR, "reports"),
        "yolo_before":    os.path.join(OUTPUT_DIR, "yolo_seg_labels", "before"),
        "yolo_after":     os.path.join(OUTPUT_DIR, "yolo_seg_labels", "after"),
    }
    for d in dirs.values():
        os.makedirs(d, exist_ok=True)

    print("Loading MobileSAM...")
    sam = SAM(SAM_MODEL)

    before_map = {os.path.basename(f).replace("_before.jpg", ""): f
                  for f in glob.glob(os.path.join(INPUT_DIR, "*_before.jpg"))}
    after_map  = {os.path.basename(f).replace("_after.jpg", ""): f
                  for f in glob.glob(os.path.join(INPUT_DIR, "*_after.jpg"))}
    plate_ids = sorted(set(before_map) & set(after_map))[:MAX_PLATES]

    print(f"Processing {len(plate_ids)} plates (before + after)...\n")
    summary = []

    for i, pid in enumerate(plate_ids, 1):
        b_path = before_map[pid]
        a_path = after_map[pid]

        print(f"[{i:02d}/{len(plate_ids)}] Plate {pid}")

        # --- BEFORE ---
        print(f"       Segmenting BEFORE...")
        b_masks, b_overlay, b_px = segment_image(sam, b_path, sat_thresh=25)
        b_mask_out = os.path.join(dirs["before_masks"], f"{pid}_before.jpg")
        cv2.imwrite(b_mask_out, b_overlay)
        b_yolo = os.path.join(dirs["yolo_before"], f"{pid}.txt")
        img_b = cv2.imread(b_path)
        write_yolo_seg(b_masks, img_b.shape, b_yolo)
        print(f"       → {len(b_masks)} items, {b_px:,} px total")

        # --- AFTER ---
        print(f"       Segmenting AFTER...")
        a_masks, a_overlay, a_px = segment_image(sam, a_path, sat_thresh=30)
        a_mask_out = os.path.join(dirs["after_masks"], f"{pid}_after.jpg")
        cv2.imwrite(a_mask_out, a_overlay)
        a_yolo = os.path.join(dirs["yolo_after"], f"{pid}.txt")
        img_a = cv2.imread(a_path)
        write_yolo_seg(a_masks, img_a.shape, a_yolo)
        print(f"       → {len(a_masks)} items, {a_px:,} px total")

        # --- WASTE ---
        waste_pct = min(100.0, (a_px / b_px * 100.0)) if b_px > 0 else 0.0
        print(f"       Waste: {waste_pct:.1f}%")

        # --- REPORT ---
        report_out = os.path.join(dirs["reports"], f"{pid}_report.jpg")
        create_report(pid, b_path, b_mask_out, a_path, a_mask_out,
                      b_masks, a_masks, b_px, a_px, waste_pct, report_out)

        summary.append({
            "plate_id": pid,
            "before_items": len(b_masks),
            "before_food_px": b_px,
            "after_items": len(a_masks),
            "after_leftover_px": a_px,
            "waste_pct": round(waste_pct, 1),
            "category": "Clean (<10%)" if waste_pct < 10 else
                        ("Moderate (10-35%)" if waste_pct < 35 else "High (>35%)")
        })
        print()

    df = pd.DataFrame(summary)
    csv_out = os.path.join(OUTPUT_DIR, "waste_summary.csv")
    df.to_csv(csv_out, index=False)

    print("=" * 65)
    print("BATCH SEGMENTATION v3 COMPLETE!")
    print(f"  Before masks: {os.path.abspath(dirs['before_masks'])}")
    print(f"  After masks:  {os.path.abspath(dirs['after_masks'])}")
    print(f"  Reports:      {os.path.abspath(dirs['reports'])}")
    print(f"  YOLO labels:  {os.path.abspath(os.path.join(OUTPUT_DIR, 'yolo_seg_labels'))}")
    print(f"  Summary CSV:  {os.path.abspath(csv_out)}")
    print("=" * 65)


if __name__ == "__main__":
    main()
