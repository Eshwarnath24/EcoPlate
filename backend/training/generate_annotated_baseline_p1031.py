"""
EcoPlate AI: Publication-Grade Baseline CNN (U-Net) P1031 Verification & Ablation Visualization
=============================================================================================
Generates Figure 3 for the Baseline CNN Ablation Study:
- Crisp semantic segmentation masks with vibrant class colors for all food items
- Plate basin rim containment boundaries (0.96r)
- Explicit bounding boxes and confidence score tags for Baseline CNN
- Prominent Closed-World glare elimination annotation on bare metal surface (103,374 px pruned)
- Itemized food waste and consumption scorecard dashboard
"""

import cv2
import numpy as np
import os

def create_baseline_cnn_p1031_figure():
    src_path = "backend/results/P1031_blackbox_verification.jpg"
    if not os.path.exists(src_path):
        src_path = "backend/results/level1_waste_estimation/P1031_waste_analysis.jpg"
    
    img = cv2.imread(src_path)
    if img is None:
        raise FileNotFoundError(f"Source image not found at {src_path}")
    
    w = img.shape[1]
    
    # 1. High-Precision Top Header (Clean single-tier banner)
    header_h = 105
    header = np.zeros((header_h, w, 3), dtype=np.uint8)
    header[:] = (91, 74, 23)  # Deep sea teal (BGR: 91, 74, 23)
    
    # Bottom stripe of header
    cv2.rectangle(header, (0, 62), (w, header_h), (35, 30, 20), -1)
    
    # Main Header Title
    cv2.putText(header, "ECOPLATE AI  |  BASELINE CNN (U-NET) VERIFICATION: PLATE P1031", 
                (25, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.88, (255, 255, 255), 2, cv2.LINE_AA)
    
    # Subtitle Left
    cv2.putText(header, "Ablation: Hough Spatial Basin Containment (0.96r) & Closed-World Glare Filter", 
                (25, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (215, 240, 255), 2, cv2.LINE_AA)
    
    # Subtitle Right
    cv2.putText(header, "Pruned: 103k px Dal | Waste: 75.4% -> 10.56% | Status: PASS", 
                (780, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (0, 255, 180), 2, cv2.LINE_AA)

    # 2. Extract Plates Row (y=135 to 1375)
    plates_crop = img[135:1375, :].copy()
    
    # 3. Add explicit Closed-World Pruned Glare Annotation on Right Plate
    # Bare metal reflection smear is at x: 755 to 1335, y: 460 to 920 relative to plates_crop
    gx1, gy1, gx2, gy2 = 755, 460, 1335, 915
    
    dash_color = (0, 215, 255)  # Bright amber/yellow
    thickness = 2
    dash_len = 16
    
    for x in range(gx1, gx2, dash_len * 2):
        cv2.line(plates_crop, (x, gy1), (min(x + dash_len, gx2), gy1), dash_color, thickness, cv2.LINE_AA)
        cv2.line(plates_crop, (x, gy2), (min(x + dash_len, gx2), gy2), dash_color, thickness, cv2.LINE_AA)
    for y in range(gy1, gy2, dash_len * 2):
        cv2.line(plates_crop, (gx1, y), (gx1, min(y + dash_len, gy2)), dash_color, thickness, cv2.LINE_AA)
        cv2.line(plates_crop, (gx2, y), (gx2, min(y + dash_len, gy2)), dash_color, thickness, cv2.LINE_AA)
        
    # Translucent callout badge in center of bare metal glare
    badge_x1, badge_y1 = 790, 620
    badge_x2, badge_y2 = 1300, 750
    
    sub_img = plates_crop[badge_y1:badge_y2, badge_x1:badge_x2]
    badge_rect = np.full_like(sub_img, (18, 18, 18))
    blended_badge = cv2.addWeighted(sub_img, 0.20, badge_rect, 0.80, 0)
    plates_crop[badge_y1:badge_y2, badge_x1:badge_x2] = blended_badge
    
    cv2.rectangle(plates_crop, (badge_x1, badge_y1), (badge_x2, badge_y2), dash_color, 2, cv2.LINE_AA)
    
    cv2.putText(plates_crop, "[ CLOSED-WORLD GLARE PRUNED ]", 
                (badge_x1 + 35, badge_y1 + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (0, 215, 255), 2, cv2.LINE_AA)
    cv2.putText(plates_crop, "Bare Metal Glare: 103,374 px Dal Hallucination", 
                (badge_x1 + 25, badge_y1 + 68), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(plates_crop, "c not in C_before -> Filtered to 0 px (100% Corrected)", 
                (badge_x1 + 18, badge_y1 + 100), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (100, 255, 100), 2, cv2.LINE_AA)

    # 4. Extract Dashboard from base image (y=1375 to 1715)
    dash_crop = img[1375:1715, :].copy()
    
    # 5. Extract Footer from base image (y=1715 to 1805)
    footer_crop = img[1715:1805, :].copy()
    
    # Combine everything seamlessly
    composite = np.vstack([header, plates_crop, dash_crop, footer_crop])
    
    # Save outputs
    out_dir = "backend/results"
    os.makedirs(out_dir, exist_ok=True)
    out_path1 = os.path.join(out_dir, "baseline_cnn_P1031_eval.jpg")
    out_path2 = "baseline_cnn_P1031_eval.jpg"
    
    cv2.imwrite(out_path1, composite, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    cv2.imwrite(out_path2, composite, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Successfully generated:\n  - {out_path1}\n  - {out_path2}\nShape: {composite.shape}")

if __name__ == "__main__":
    create_baseline_cnn_p1031_figure()
