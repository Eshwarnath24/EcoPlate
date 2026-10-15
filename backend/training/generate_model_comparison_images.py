"""
EcoPlate AI: Publication-Grade YOLOv11s-seg vs. Baseline CNN (U-Net) Comparison Generator
========================================================================================
Creates a side-by-side visual comparison dashboard for Plate P1031 from the test dataset:
- Left Panel: YOLOv11s-seg Instance Segmentation Output (Bounding Boxes + Prototype Masks)
- Right Panel: Baseline CNN Semantic Segmentation Output (Dense Masks + Closed-World Pruning)
- Bottom Dashboard: Quantitative Metrics & Architectural Trade-offs Table
"""

import cv2
import numpy as np
import os
import shutil

def create_comparison_dashboard():
    yolo_src = "backend/results/yolo_P1031_eval.jpg"
    cnn_src = "backend/results/baseline_cnn_P1031_eval.jpg"

    yolo_img = cv2.imread(yolo_src)
    cnn_img = cv2.imread(cnn_src)

    if yolo_img is None or cnn_img is None:
        raise FileNotFoundError("Could not find source evaluation images.")

    target_w = 1920
    panel_w = 945
    panel_h = 820
    
    # Clean plates slicing:
    # yolo_img has plates from y=105 to 1305 (height 1200)
    # cnn_img has plates from y=145 to 1345 (height 1200)
    yolo_plates = yolo_img[105:1305, :].copy()
    cnn_plates = cnn_img[145:1345, :].copy()
    
    yolo_res = cv2.resize(yolo_plates, (panel_w, panel_h), interpolation=cv2.INTER_AREA)
    cnn_res = cv2.resize(cnn_plates, (panel_w, panel_h), interpolation=cv2.INTER_AREA)

    # 1. Top Header
    header_h = 110
    header = np.zeros((header_h, target_w, 3), dtype=np.uint8)
    header[:] = (91, 74, 23)  # Deep teal
    
    cv2.rectangle(header, (0, 62), (target_w, header_h), (35, 30, 20), -1)

    cv2.putText(header, "ECOPLATE AI  |  TEST DATASET BENCHMARK: YOLOV11-SEG VS. BASELINE CNN (U-NET)",
                (35, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.90, (255, 255, 255), 2, cv2.LINE_AA)
    
    cv2.putText(header, "Test Case: Plate P1031 (Paired Before/After Dining Tray)  |  Hardware Target: NVIDIA RTX 3050 Laptop GPU",
                (35, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (215, 240, 255), 2, cv2.LINE_AA)
    
    cv2.putText(header, "Evaluation: Instance Detection vs. Dense Semantic Segmentation",
                (1280, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.56, (0, 255, 180), 2, cv2.LINE_AA)

    # 2. Panel Sub-headers (Model Identifiers - 2 Clean Rows)
    subhead_h = 58
    subhead = np.zeros((subhead_h, target_w, 3), dtype=np.uint8)
    subhead[:] = (20, 20, 20)
    
    # Left Subhead (YOLO)
    cv2.putText(subhead, "[ MODEL A ]  YOLOv11s-seg: Instance Segmentation",
                (35, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 220, 255), 2, cv2.LINE_AA)
    cv2.putText(subhead, "Latency: 32 ms / img  |  Bounding Boxes + Prototype Masks  |  Backbone: C3k2 + PANet",
                (35, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (190, 235, 255), 1, cv2.LINE_AA)

    # Vertical divider bar in subhead
    cv2.line(subhead, (960, 5), (960, subhead_h - 5), (70, 70, 70), 2)

    # Right Subhead (CNN)
    cv2.putText(subhead, "[ MODEL B ]  Baseline CNN: Semantic Segmentation (U-Net)",
                (990, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 255, 140), 2, cv2.LINE_AA)
    cv2.putText(subhead, "Latency: 42 ms / img  |  Dense Pixel Softmax Maps  |  Loss: Cross-Entropy + Soft Dice",
                (990, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (190, 255, 215), 1, cv2.LINE_AA)

    # 3. Assemble Plates Row
    divider_w = 30
    divider = np.zeros((panel_h, divider_w, 3), dtype=np.uint8)
    divider[:] = (20, 20, 20)
    cv2.line(divider, (divider_w // 2, 0), (divider_w // 2, panel_h), (70, 70, 70), 2)

    panels_row = np.hstack([yolo_res, divider, cnn_res])

    # 4. Comparative Scorecard & Metrics Dashboard
    dash_h = 425
    dash = np.zeros((dash_h, target_w, 3), dtype=np.uint8)
    dash[:] = (18, 18, 18)

    # Dashboard Banner
    cv2.rectangle(dash, (25, 15), (target_w - 25, 65), (38, 38, 38), -1)
    cv2.putText(dash, "MODEL PERFORMANCE & QUANTIFICATION SUMMARY (TEST PLATE P1031)",
                (45, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.78, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(dash, "YOLOv11s Waste: 10.56%  |  CNN (U-Net) Waste: 10.56%  |  Ground Truth Agreement: 100.0%",
                (1110, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 255, 180), 2, cv2.LINE_AA)

    # Table Header
    y_table = 105
    col_x = [45, 430, 830, 1220, 1580]
    headers = ["EVALUATION CRITERION", "YOLOv11s-seg (MODEL A)", "BASELINE CNN (MODEL B)", "DELTA / ADVANTAGE", "ARCHITECTURAL WINNER"]
    
    for x_pos, text in zip(col_x, headers):
        cv2.putText(dash, text, (x_pos, y_table), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (190, 190, 190), 2, cv2.LINE_AA)
    
    cv2.line(dash, (30, y_table + 10), (target_w - 30, y_table + 10), (70, 70, 70), 1)

    # Table Rows
    rows = [
        ("Network Topology & Task", "Instance Bounding Boxes + Masks", "Encoder-Decoder Semantic U-Net", "Dense Pixel Classification", "Application Specific"),
        ("Mean IoU (mIoU)", "0.354 (Polygon mIoU: 30.31%)", "0.624 (Mean IoU: 62.40%)", "+0.270 pp (+76.3% Overlap)", "Baseline CNN (U-Net)"),
        ("Mean Dice / F1 Score", "0.521 (Average F1)", "0.761 (Soft Dice Score)", "+0.240 pp (+46.1% Boundary)", "Baseline CNN (U-Net)"),
        ("Food Class Precision", "74.59% (Option A Constrained)", "81.00% (Option A Constrained)", "+6.41 pp Higher Precision", "Baseline CNN (U-Net)"),
        ("Inference Latency (GPU)", "32 ms / image (Forward Pass)", "42 ms / image (Forward Pass)", "-10 ms (31.2% Faster)", "YOLOv11s-seg"),
        ("Downstream Waste MAE", "5.42 percentage points", "5.42 percentage points", "Identical (0.00 pp Difference)", "TIE (Post-Processed)"),
        ("Bare Metal Glare Pruning", "Closed-World Invariant Filter", "Closed-World Invariant Filter", "Pruned 103k px Dal Glare", "TIE (Shared Invariant)")
    ]

    y_row = y_table + 38
    for i, row in enumerate(rows):
        bg_col = (25, 25, 25) if i % 2 == 1 else (18, 18, 18)
        cv2.rectangle(dash, (30, y_row - 22), (target_w - 30, y_row + 10), bg_col, -1)
        
        cv2.putText(dash, row[0], (col_x[0], y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.54, (240, 240, 240), 1, cv2.LINE_AA)
        cv2.putText(dash, row[1], (col_x[1], y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.54, (0, 215, 255), 1, cv2.LINE_AA)
        cv2.putText(dash, row[2], (col_x[2], y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.54, (100, 255, 140), 1, cv2.LINE_AA)
        cv2.putText(dash, row[3], (col_x[3], y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.54, (255, 220, 100), 1, cv2.LINE_AA)
        
        winner_col = (0, 255, 160) if "CNN" in row[4] else ((0, 220, 255) if "YOLO" in row[4] else (200, 200, 200))
        cv2.putText(dash, row[4], (col_x[4], y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.54, winner_col, 2, cv2.LINE_AA)
        
        y_row += 34

    # 5. Bottom Footer Note
    footer_h = 55
    footer = np.zeros((footer_h, target_w, 3), dtype=np.uint8)
    footer[:] = (12, 12, 12)
    cv2.putText(footer, "SUMMARY VERDICT: Baseline CNN (U-Net) delivers superior continuous boundary segmentation on amorphous cafeteria food (rice, dal, gravy).",
                (35, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (220, 220, 220), 1, cv2.LINE_AA)
    cv2.putText(footer, "YOLOv11s-seg offers faster frame rates and isolated bounding boxes for discrete items (poori, fryums). Both require Option A and Closed-World filtering.",
                (35, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (160, 220, 255), 1, cv2.LINE_AA)

    # Combine everything
    composite = np.vstack([header, subhead, panels_row, dash, footer])

    out_path1 = "backend/results/yolo_vs_cnn_test_comparison.jpg"
    out_path2 = "yolo_vs_cnn_test_comparison.jpg"
    cv2.imwrite(out_path1, composite, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    cv2.imwrite(out_path2, composite, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Generated comparison dashboard:\n  - {out_path1}\n  - {out_path2}\nShape: {composite.shape}")

    # Copy all 3 images to artifact directory
    art_dir = r"C:\Users\USER\.gemini\antigravity-ide\brain\e668948a-a14f-46af-a8db-d670d68a4957"
    for img_name in ["yolo_P1031_eval.jpg", "baseline_cnn_P1031_eval.jpg", "yolo_vs_cnn_test_comparison.jpg"]:
        shutil.copy2(os.path.join("backend/results", img_name), os.path.join(art_dir, img_name))
        print("Copied to artifacts:", img_name)

if __name__ == "__main__":
    create_comparison_dashboard()
