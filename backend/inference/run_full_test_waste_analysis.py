"""
EcoPlate AI: Batch Food Waste Analysis on All Held-Out Test Pairs (Option A + Fine-Tuned Model)
=============================================================================================
Runs Option A + fine-tuned YOLOv11n-seg across all 48 before/after plate pairs in the test set.
Outputs:
  1. Full CSV report (waste_report_test_full.csv)
  2. Comprehensive summary metrics (aggregate waste %, per-item waste %, plate categories)
  3. Summary JSON for frontend visualization or reporting
"""

import os
import sys
import time
import json
import cv2
import numpy as np
import pandas as pd
import torch
from ultralytics import YOLO

# Import functions from ecoplate_waste_estimator
from ecoplate_waste_estimator import (
    detect_plate_bounds,
    segment_plate_contents,
    render_annotated_plate,
    build_comparison_dashboard,
    MODEL_PATH,
    TEST_DIR,
    OUTPUT_DIR,
    CLASS_NAMES,
    CLASS_COLORS
)

sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def run_full_test_analysis():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    print("=" * 80)
    print(" EcoPlate AI: Full Test Dataset Waste Estimation (Option A + Fine-Tuned Model)")
    print("=" * 80)
    print(f"Model Path:  {MODEL_PATH}")
    print(f"Device:      {device}")
    print(f"Test Dir:    {TEST_DIR}")
    print(f"Output Dir:  {OUTPUT_DIR}\n")

    model = YOLO(MODEL_PATH)

    # 1. Gather all complete test pairs
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

    complete_pairs = {k: v for k, v in pairs.items() if 'before' in v and 'after' in v}
    total_pairs = len(complete_pairs)
    print(f"Found {total_pairs} complete Before-After plate pairs in held-out test split.\n")

    all_item_records = []
    plate_summaries = []

    start_time = time.time()

    for idx, (pid, pair_files) in enumerate(sorted(complete_pairs.items()), 1):
        before_path = os.path.join(TEST_DIR, pair_files['before'])
        after_path  = os.path.join(TEST_DIR, pair_files['after'])

        img_b = cv2.imread(before_path)
        img_a = cv2.imread(after_path)
        if img_b is None or img_a is None:
            continue

        # Plate ROI Detection
        cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
        cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

        # Smart Segmentation with Option A
        before_items, dets_b = segment_plate_contents(model, img_b, pmask_b, is_after=False)
        after_items, dets_a  = segment_plate_contents(model, img_a, pmask_a, is_after=True)

        # Render Annotated Visuals
        annotated_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
        annotated_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")

        # Build Scorecard Dashboard
        dashboard, records = build_comparison_dashboard(annotated_b, annotated_a, pid, before_items, after_items)
        all_item_records.extend(records)

        # Save image for first 10 plates, plus any high-interest plates
        save_img_path = os.path.join(OUTPUT_DIR, f"{pid}_waste_analysis.jpg")
        cv2.imwrite(save_img_path, dashboard)

        # Plate-level summary
        total_b = sum(d['area'] for d in before_items.values())
        total_a = sum(d['area'] for d in after_items.values())
        ov_waste = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0
        ov_consumed = max(0.0, 100.0 - ov_waste)

        if ov_waste <= 10.0:
            category = "Clean Plate (<10%)"
        elif ov_waste <= 30.0:
            category = "Moderate Waste (10-30%)"
        else:
            category = "High Waste (>30%)"

        plate_summaries.append({
            'Plate_ID': pid,
            'Total_Before_Area_px': total_b,
            'Total_After_Area_px': total_a,
            'Overall_Waste_Percent': round(ov_waste, 2),
            'Overall_Consumed_Percent': round(ov_consumed, 2),
            'Waste_Category': category,
            'Num_Items_Served': len(before_items),
            'Items_Served': list(before_items.keys()),
            'Items_Leftover': list(after_items.keys())
        })

        if idx % 10 == 0 or idx == total_pairs:
            print(f"  Processed {idx}/{total_pairs} plates ({idx/total_pairs*100:.1f}%)...")

    elapsed = time.time() - start_time
    print(f"\nCompleted analysis of all {total_pairs} plate pairs in {elapsed:.2f} seconds ({total_pairs/elapsed:.1f} pairs/sec)!")

    # 2. Save Item-level CSV
    df_items = pd.DataFrame(all_item_records)
    items_csv = os.path.join(OUTPUT_DIR, "waste_report_test_full.csv")
    df_items.to_csv(items_csv, index=False)
    print(f"Saved Full Item Waste Report: {items_csv}")

    # 3. Save Plate-level CSV
    df_plates = pd.DataFrame(plate_summaries)
    plates_csv = os.path.join(OUTPUT_DIR, "plate_summary_test_full.csv")
    df_plates.to_csv(plates_csv, index=False)
    print(f"Saved Plate Summary Report: {plates_csv}")

    # 4. Compute Aggregate Statistics
    avg_waste = df_plates['Overall_Waste_Percent'].mean()
    avg_consumed = df_plates['Overall_Consumed_Percent'].mean()
    cat_counts = df_plates['Waste_Category'].value_counts()

    print("\n" + "=" * 80)
    print(" 📈 DATASET-WIDE AGGREGATE FOOD WASTE STATISTICS (48 TEST PLATES)")
    print("=" * 80)
    print(f"Total Plate Pairs Evaluated:       {total_pairs}")
    print(f"Average Food Consumed per Plate:   {avg_consumed:.1f}%")
    print(f"Average Food Wasted per Plate:     {avg_waste:.1f}%\n")

    print("--- Plate Category Distribution ---")
    for cat, count in cat_counts.items():
        pct = count / total_pairs * 100.0
        print(f"  • {cat:<26}: {count:2d} plates ({pct:5.1f}%)")

    # 5. Food Item Breakdown
    print("\n--- Food Item Waste Breakdown Across Entire Cohort ---")
    item_stats = []
    for cname in CLASS_NAMES:
        sub = df_items[df_items['Food_Item'] == cname]
        if len(sub) > 0:
            times_served = len(sub)
            avg_item_waste = sub['Waste_Percent'].mean()
            avg_item_consumed = sub['Consumed_Percent'].mean()
            fully_finished = len(sub[sub['Waste_Percent'] <= 5.0])
            finish_rate = (fully_finished / times_served) * 100.0
            total_served_area = sub['Before_Area_px'].sum()
            total_wasted_area = sub['After_Area_px'].sum()

            item_stats.append({
                'Food_Item': cname,
                'Times_Served': times_served,
                'Finish_Rate_pct': round(finish_rate, 1),
                'Avg_Waste_pct': round(avg_item_waste, 1),
                'Avg_Consumed_pct': round(avg_item_consumed, 1),
                'Total_Served_Area_px': int(total_served_area),
                'Total_Wasted_Area_px': int(total_wasted_area)
            })

    df_item_stats = pd.DataFrame(item_stats).sort_values(by='Avg_Waste_pct', ascending=False)
    item_stats_csv = os.path.join(OUTPUT_DIR, "food_item_waste_rankings.csv")
    df_item_stats.to_csv(item_stats_csv, index=False)

    print(f"{'Food Item':<16} | {'Times Served':<12} | {'Finish Rate':<12} | {'Avg Waste %':<12} | {'Avg Consumed %'}")
    print("-" * 75)
    for _, row in df_item_stats.iterrows():
        print(f"{row['Food_Item']:<16} | {row['Times_Served']:>10d}   | {row['Finish_Rate_pct']:>9.1f}%  | {row['Avg_Waste_pct']:>9.1f}%  | {row['Avg_Consumed_pct']:>11.1f}%")

    print("=" * 80)

    # 6. Save JSON Summary for Frontend
    json_summary = {
        'total_plates': total_pairs,
        'average_waste_percent': round(float(avg_waste), 2),
        'average_consumed_percent': round(float(avg_consumed), 2),
        'category_distribution': {k: int(v) for k, v in cat_counts.items()},
        'food_item_rankings': df_item_stats.to_dict(orient='records'),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    json_path = os.path.join(OUTPUT_DIR, "dataset_waste_summary.json")
    with open(json_path, 'w') as f:
        json.dump(json_summary, f, indent=2)
    print(f"Saved Frontend/Analytics JSON: {json_path}")


if __name__ == "__main__":
    run_full_test_analysis()
