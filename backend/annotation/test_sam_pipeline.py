"""
Test SAM-based food item clustering and before/after matching on P1065.
"""
import os, sys
import cv2
import numpy as np
from ultralytics import SAM
from scipy.spatial.distance import cdist

def detect_plate_bounds(img):
    """
    Returns (cx, cy, rx, ry, plate_mask)
    Uses HoughCircles with ellipse/center fallback.
    """
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)
    
    best_circle = None
    for p2 in [40, 30, 20]:
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=int(min(w, h)*0.4),
            param1=80, param2=p2,
            minRadius=int(min(w, h) * 0.28),
            maxRadius=int(min(w, h) * 0.52)
        )
        if circles is not None:
            # pick circle closest to center
            for c in circles[0]:
                dist_center = np.hypot(c[0] - w/2, c[1] - h/2)
                if dist_center < min(w, h) * 0.25:
                    best_circle = c
                    break
            if best_circle is not None:
                break
                
    mask = np.zeros((h, w), dtype=np.uint8)
    if best_circle is not None:
        cx, cy, r = int(best_circle[0]), int(best_circle[1]), int(best_circle[2])
        # Slightly shrink radius by 4% to avoid plate rim reflections
        r_inner = int(r * 0.96)
        cv2.circle(mask, (cx, cy), r_inner, 255, -1)
        return cx, cy, r_inner, r_inner, mask
    else:
        cx, cy = w // 2, int(h * 0.50)
        rx, ry = int(w * 0.44), int(h * 0.38)
        cv2.ellipse(mask, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
        return cx, cy, rx, ry, mask

def extract_food_masks(sam, img_path, plate_mask):
    """
    Runs SAM and selects valid food object masks inside the plate.
    Merges masks that belong to the same food item by LAB color similarity.
    """
    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    plate_px = np.sum(plate_mask > 0)
    img_lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    
    # Predict with SAM
    res = sam(img_path, verbose=False)[0]
    if res.masks is None:
        return []
        
    candidates = []
    for i, m_t in enumerate(res.masks.data):
        m = m_t.cpu().numpy().astype(bool)
        m_in_plate = m & (plate_mask > 0)
        in_plate_px = np.sum(m_in_plate)
        total_px = np.sum(m)
        
        if total_px == 0:
            continue
            
        # Must be mostly inside plate (>70% inside)
        if in_plate_px / total_px < 0.70:
            continue
            
        # Must not be the entire plate (area < 80% of plate)
        if in_plate_px / plate_px > 0.80:
            continue
            
        # Must not be tiny speck (min 300 pixels)
        if in_plate_px < max(300, int(plate_px * 0.0004)):
            continue
            
        mean_lab = np.mean(img_lab[m_in_plate], axis=0)
        candidates.append({
            "mask": m_in_plate,
            "area": in_plate_px,
            "lab": mean_lab,
            "idx": i
        })
        
    print(f"  {img_path}: {len(candidates)} candidate masks inside plate")
    if not candidates:
        return []
        
    # Sort candidates by area descending
    candidates.sort(key=lambda c: c["area"], reverse=True)
    
    # Merge masks with similar color (same food item)
    # Using LAB Delta E distance threshold = 25.0
    COLOR_MERGE_THRESH = 25.0
    
    merged_items = []
    assigned = [False] * len(candidates)
    
    for i in range(len(candidates)):
        if assigned[i]:
            continue
        current_mask = candidates[i]["mask"].copy()
        current_labs = [candidates[i]["lab"]]
        assigned[i] = True
        
        for j in range(i + 1, len(candidates)):
            if assigned[j]:
                continue
            ref_lab = np.mean(current_labs, axis=0)
            cand_lab = candidates[j]["lab"]
            dist = np.linalg.norm(ref_lab - cand_lab)
            
            # If color is close, merge into current food item!
            if dist < COLOR_MERGE_THRESH:
                current_mask |= candidates[j]["mask"]
                current_labs.append(cand_lab)
                assigned[j] = True
                
        merged_lab = np.mean(img_lab[current_mask], axis=0)
        merged_items.append({
            "mask": current_mask,
            "area": int(np.sum(current_mask)),
            "lab": merged_lab
        })
        
    # Remove overlapping pixels between different items:
    # If two items overlap, the larger or more distinct item keeps the pixel
    merged_items.sort(key=lambda x: x["area"], reverse=True)
    claimed = np.zeros((h, w), dtype=bool)
    cleaned_items = []
    
    for item in merged_items:
        m = item["mask"] & (~claimed)
        area = int(np.sum(m))
        if area > max(400, int(plate_px * 0.001)):
            claimed |= m
            cleaned_items.append({
                "mask": m,
                "area": area,
                "lab": np.mean(img_lab[m], axis=0)
            })
            
    print(f"  {img_path}: Merged into {len(cleaned_items)} distinct food items")
    for idx, item in enumerate(cleaned_items):
        print(f"    Item {idx+1}: {item['area']:,} px, LAB={[int(x) for x in item['lab']]}")
        
    return cleaned_items

def run_test():
    sam = SAM("mobile_sam.pt")
    
    # 1. Before plate
    b_path = "ecoplate_images/before/P1065.jpg"
    b_img = cv2.imread(b_path)
    _, _, _, _, b_plate = detect_plate_bounds(b_img)
    b_items = extract_food_masks(sam, b_path, b_plate)
    
    # 2. After plate
    a_path = "ecoplate_images/after/P1065.jpg"
    a_img = cv2.imread(a_path)
    _, _, _, _, a_plate = detect_plate_bounds(a_img)
    a_items = extract_food_masks(sam, a_path, a_plate)
    
    # 3. Match After items to Before items
    # Palette of distinct vibrant colors (BGR)
    PALETTE = [
        (255, 140,   0),  # Deep Sky Blue
        (  0, 215, 255),  # Gold / Amber
        (255, 105, 180),  # Hot Pink
        ( 50, 205,  50),  # Lime Green
        (  0,  69, 255),  # Orange Red
        (238, 130, 238),  # Violet
    ]
    
    b_colors = [PALETTE[i % len(PALETTE)] for i in range(len(b_items))]
    
    # Match each after item to the closest before item in LAB space
    a_colors = []
    a_matched_idx = []
    for a_item in a_items:
        if len(b_items) == 0:
            a_colors.append((200, 200, 200))
            a_matched_idx.append(0)
            continue
        dists = [np.linalg.norm(a_item["lab"] - b["lab"]) for b in b_items]
        best_b = int(np.argmin(dists))
        print(f"  After item (area {a_item['area']}) matched to Before Item {best_b+1} (dist: {dists[best_b]:.1f})")
        a_colors.append(b_colors[best_b])
        a_matched_idx.append(best_b)
        
    # 4. Render overlays
    def draw_overlay(img, items, colors, labels_prefix="Item"):
        vis = img.copy()
        for idx, (item, col) in enumerate(zip(items, colors)):
            m = item["mask"]
            colored = np.zeros_like(img)
            colored[m] = col
            vis = np.where(colored > 0, cv2.addWeighted(colored, 0.45, vis, 0.55, 0), vis)
            cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(vis, cnts, -1, (255, 255, 255), 2)
            
            # Label
            if cnts:
                c_max = max(cnts, key=cv2.contourArea)
                M = cv2.moments(c_max)
                if M["m00"] > 0:
                    lx, ly = int(M["m10"]/M["m00"]), int(M["m01"]/M["m00"])
                    label = f"{labels_prefix} {idx+1}"
                    cv2.putText(vis, label, (lx - 25, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
                    cv2.putText(vis, label, (lx - 25, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        return vis

    b_vis = draw_overlay(b_img, b_items, b_colors, "Item")
    
    # For after vis, label with the matched before item ID
    a_vis = a_img.copy()
    for idx, (item, col, b_idx) in enumerate(zip(a_items, a_colors, a_matched_idx)):
        m = item["mask"]
        colored = np.zeros_like(a_img)
        colored[m] = col
        a_vis = np.where(colored > 0, cv2.addWeighted(colored, 0.45, a_vis, 0.55, 0), a_vis)
        cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(a_vis, cnts, -1, (255, 255, 255), 2)
        if cnts:
            c_max = max(cnts, key=cv2.contourArea)
            M = cv2.moments(c_max)
            if M["m00"] > 0:
                lx, ly = int(M["m10"]/M["m00"]), int(M["m01"]/M["m00"])
                label = f"Item {b_idx+1}"
                cv2.putText(a_vis, label, (lx - 25, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
                cv2.putText(a_vis, label, (lx - 25, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    os.makedirs("test_masks/before", exist_ok=True)
    os.makedirs("test_masks/after", exist_ok=True)
    cv2.imwrite("test_masks/before/P1065_before.jpg", b_vis)
    cv2.imwrite("test_masks/after/P1065_after.jpg", a_vis)
    print("Saved test_masks/before/P1065_before.jpg and test_masks/after/P1065_after.jpg")

if __name__ == "__main__":
    run_test()
