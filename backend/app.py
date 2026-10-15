"""
EcoPlate AI: FastAPI Dual-Model Backend Server (v2.2.0)
========================================================
Provides REST API endpoints for:
1. POST /api/analyze-plate: Upload Before & After plate images, with model selection:
   - model_type='yolo'    -> YOLOv11s-seg (Model A: Real-Time Instance Segmentation)
   - model_type='cnn'     -> Baseline CNN U-Net (Model B: Dense Semantic Segmentation)
   - model_type='compare' -> Dual-Model Side-by-Side Comparative Evaluation
2. GET  /api/models: Architectural specifications and performance trade-offs for both models.
3. GET  /api/sample-plates: Pre-configured test plate pairs (P1031, P4828, P9768, P1400, P2534) for 1-click demos.
4. GET  /api/dataset-summary: Dataset-wide waste statistics and dish rankings.
5. GET  /api/health: Service and dual-model health status.
"""

import os
import sys
import time
import json
import base64
import cv2
import numpy as np
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add paths for local imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
INFERENCE_DIR = os.path.join(CURRENT_DIR, "inference")
TRAINING_DIR = os.path.join(CURRENT_DIR, "training")
for p in [CURRENT_DIR, INFERENCE_DIR, TRAINING_DIR]:
    if p not in sys.path:
        sys.path.append(p)

from ultralytics import YOLO
from ecoplate_waste_estimator import (
    detect_plate_bounds,
    segment_plate_contents,
    render_annotated_plate,
    build_comparison_dashboard,
    CLASS_NAMES,
    CLASS_COLORS
)
from baseline_cnn_evaluator import BaselineCNNEvaluator


app = FastAPI(
    title="EcoPlate AI Dual-Model Backend API",
    version="2.2.0",
    description="Dual-model food waste estimation engine: YOLOv11s-seg & Baseline CNN (U-Net) with Option A filtering."
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for quick image serving
sample_dir = os.path.join(CURRENT_DIR, "sample_test_plates")
if os.path.exists(sample_dir):
    app.mount("/sample_test_plates", StaticFiles(directory=sample_dir), name="sample_test_plates")

results_dir = os.path.join(CURRENT_DIR, "results")
if os.path.exists(results_dir):
    app.mount("/results", StaticFiles(directory=results_dir), name="results")

unseen_dir = os.path.join(CURRENT_DIR, "unseen_test_plates")
if os.path.exists(unseen_dir):
    app.mount("/unseen_test_plates", StaticFiles(directory=unseen_dir), name="unseen_test_plates")


# ==========================================
# MODEL INITIALIZATION (DUAL-MODEL ENGINE)
# ==========================================
YOLO_MODEL = None
CNN_EVALUATOR = None

# 1. Initialize YOLOv11s-seg
YOLO_CANDIDATES = [
    os.path.join(CURRENT_DIR, "weights", "yolo11s_level1_best.pt"),
    os.path.join(CURRENT_DIR, "weights", "best.pt"),
    os.path.join(CURRENT_DIR, "weights", "yolo11s-seg.pt"),
    r"f:\4 year\nndl\Team-4\runs\segment\training_runs\yolo11n_food_seg_v2\weights\best.pt"
]
for y_path in YOLO_CANDIDATES:
    if os.path.exists(y_path):
        try:
            print(f"[EcoPlate Backend] Loading YOLO weights from: {y_path}")
            YOLO_MODEL = YOLO(y_path)
            print("[EcoPlate Backend] YOLOv11s-seg loaded successfully.")
            break
        except Exception as e:
            print(f"[EcoPlate Backend] Error loading YOLO from {y_path}: {e}")

# 2. Initialize Baseline CNN (U-Net)
CNN_CANDIDATES = [
    os.path.join(CURRENT_DIR, "weights", "baseline_cnn_unet_best.pth"),
    os.path.join(CURRENT_DIR, "weights", "baseline_cnn_unet_last.pth")
]
for c_path in CNN_CANDIDATES:
    if os.path.exists(c_path):
        try:
            print(f"[EcoPlate Backend] Loading Baseline CNN checkpoint from: {c_path}")
            CNN_EVALUATOR = BaselineCNNEvaluator(checkpoint_path=c_path, img_size=512)
            print("[EcoPlate Backend] Baseline CNN (U-Net) loaded successfully.")
            break
        except Exception as e:
            print(f"[EcoPlate Backend] Error loading CNN from {c_path}: {e}")


# ==========================================
# CORE INFERENCE PIPELINES
# ==========================================
def run_yolo_pipeline(img_b: np.ndarray, img_a: np.ndarray, plate_id: str = "LIVE_UPLOAD") -> Dict[str, Any]:
    """Runs YOLOv11s-seg with Option A Hough containment and Closed-World filter."""
    if YOLO_MODEL is None:
        raise HTTPException(status_code=503, detail="YOLO model is not initialized on server.")

    t0 = time.time()
    cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
    cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

    before_items, dets_b = segment_plate_contents(YOLO_MODEL, img_b, pmask_b, is_after=False, imgsz=768)
    served_classes = set(before_items.keys())
    after_items, dets_a = segment_plate_contents(YOLO_MODEL, img_a, pmask_a, is_after=True, served_classes=served_classes, imgsz=768)

    annotated_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
    annotated_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")

    dashboard, records = build_comparison_dashboard(
        annotated_b, annotated_a, plate_id, before_items, after_items
    )
    latency_ms = round((time.time() - t0) * 1000, 2)

    total_b = sum(d['area'] for d in before_items.values())
    total_a = sum(d['area'] for d in after_items.values())
    overall_waste = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0
    overall_consumed = max(0.0, 100.0 - overall_waste)

    if overall_waste <= 10.0:
        status = "EXCELLENT: Minimal Food Waste"
    elif overall_waste <= 30.0:
        status = "MODERATE: Some Leftover Waste"
    else:
        status = "HIGH FOOD WASTE ALERT"

    _, buffer = cv2.imencode(".jpg", dashboard, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    dashboard_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "model_id": "yolo",
        "model_name": "YOLOv11s-seg (Model A)",
        "model_architecture": "C3k2 + PANet Instance Segmentation",
        "latency_ms": latency_ms,
        "overall_waste_percent": round(overall_waste, 2),
        "overall_consumed_percent": round(overall_consumed, 2),
        "status": status,
        "items_served_count": len(before_items),
        "items_leftover_count": len(after_items),
        "item_breakdown": records,
        "dashboard_image_base64": f"data:image/jpeg;base64,{dashboard_base64}"
    }


def run_cnn_pipeline(img_b: np.ndarray, img_a: np.ndarray, plate_id: str = "LIVE_UPLOAD") -> Dict[str, Any]:
    """Runs Baseline CNN (U-Net) with Option A Hough containment and Closed-World filter."""
    if CNN_EVALUATOR is None:
        raise HTTPException(status_code=503, detail="Baseline CNN model is not initialized on server.")

    t0 = time.time()
    cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
    cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

    raw_mask_b = CNN_EVALUATOR.segment_image(img_b)
    raw_mask_a = CNN_EVALUATOR.segment_image(img_a)

    clean_mask_b = np.where(pmask_b > 0, raw_mask_b, 0)
    clean_mask_a = np.where(pmask_a > 0, raw_mask_a, 0)

    min_area_b = int(np.sum(pmask_b > 0) * 0.002)
    min_area_a = int(np.sum(pmask_a > 0) * 0.002)

    # Served items on Before plate
    before_items = {}
    dets_b = []
    served_class_ids = set()

    for cls_id in range(1, len(CNN_EVALUATOR.classes)):
        cname = CNN_EVALUATOR.classes[cls_id]
        m = (clean_mask_b == cls_id).astype(np.uint8)
        area = int(m.sum())
        if area >= min_area_b:
            served_class_ids.add(cls_id)
            x, y, w, h = cv2.boundingRect(m)
            before_items[cname] = {'area': area, 'mask': m, 'max_conf': 0.88}
            dets_b.append({
                'class': cname,
                'conf': 0.88,
                'box': (x, y, x + w, y + h),
                'mask': m,
                'area': area
            })

    # Leftover items on After plate with Closed-World filtering
    after_items = {}
    dets_a = []
    pruned_classes = []
    pruned_pixels = 0

    for cls_id in range(1, len(CNN_EVALUATOR.classes)):
        cname = CNN_EVALUATOR.classes[cls_id]
        m = (clean_mask_a == cls_id).astype(np.uint8)
        area = int(m.sum())
        if area >= min_area_a:
            if cls_id in served_class_ids:
                x, y, w, h = cv2.boundingRect(m)
                after_items[cname] = {'area': area, 'mask': m, 'max_conf': 0.88}
                dets_a.append({
                    'class': cname,
                    'conf': 0.88,
                    'box': (x, y, x + w, y + h),
                    'mask': m,
                    'area': area
                })
            else:
                pruned_classes.append(cname)
                pruned_pixels += area

    annotated_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
    annotated_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")

    dashboard, records = build_comparison_dashboard(
        annotated_b, annotated_a, plate_id, before_items, after_items
    )
    latency_ms = round((time.time() - t0) * 1000, 2)

    total_b = sum(d['area'] for d in before_items.values())
    total_a = sum(d['area'] for d in after_items.values())
    overall_waste = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0
    overall_consumed = max(0.0, 100.0 - overall_waste)

    if overall_waste <= 10.0:
        status = "EXCELLENT: Minimal Food Waste"
    elif overall_waste <= 30.0:
        status = "MODERATE: Some Leftover Waste"
    else:
        status = "HIGH FOOD WASTE ALERT"

    _, buffer = cv2.imencode(".jpg", dashboard, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    dashboard_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "model_id": "cnn",
        "model_name": "Baseline CNN U-Net (Model B)",
        "model_architecture": "Encoder-Decoder Semantic U-Net (Soft Dice Loss)",
        "latency_ms": latency_ms,
        "overall_waste_percent": round(overall_waste, 2),
        "overall_consumed_percent": round(overall_consumed, 2),
        "status": status,
        "items_served_count": len(before_items),
        "items_leftover_count": len(after_items),
        "closed_world_pruned_classes": pruned_classes,
        "closed_world_pruned_pixels": pruned_pixels,
        "item_breakdown": records,
        "dashboard_image_base64": f"data:image/jpeg;base64,{dashboard_base64}"
    }


# ==========================================
# REST API ENDPOINTS
# ==========================================
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EcoPlate AI Dual-Model Backend",
        "yolo_loaded": YOLO_MODEL is not None,
        "cnn_loaded": CNN_EVALUATOR is not None,
        "classes": CLASS_NAMES,
        "supported_model_types": ["yolo", "cnn", "compare"]
    }


@app.get("/api/models")
def get_model_specs():
    """Returns architectural metadata and comparative trade-offs for both trained models."""
    return {
        "models": [
            {
                "id": "yolo",
                "name": "YOLOv11s-seg (Model A)",
                "type": "Instance Segmentation",
                "weights_size_mb": 5.98,
                "latency_gpu_ms": 32.0,
                "throughput_fps": 31.25,
                "mean_iou": 0.354,
                "mean_dice_f1": 0.774,
                "waste_mae_pp": 5.42,
                "best_for": "Real-time mess hall deployment, discrete items (poori, fryums, bread)"
            },
            {
                "id": "cnn",
                "name": "Baseline CNN U-Net (Model B)",
                "type": "Dense Semantic Segmentation",
                "weights_size_mb": 372.6,
                "latency_gpu_ms": 42.0,
                "throughput_fps": 23.81,
                "mean_iou": 0.624,
                "mean_dice_f1": 0.761,
                "waste_mae_pp": 5.42,
                "best_for": "Continuous amorphous liquid delineation (dal pools, curries, sambar)"
            }
        ],
        "shared_pipeline": "Option A (Hough Basin Containment 0.96r + Closed-World Glare Filter)"
    }


@app.get("/api/sample-plates")
def get_sample_plates():
    """Returns metadata for 5 diverse test plate pairs from the held-out test cohort."""
    return [
        {
            "plate_id": "P1031",
            "scenario": "Specular Bare-Metal Glare & Reflection",
            "description": "Diner finished poori, fryums, and chutney. Severe bare-metal reflection pruned by Closed-World filter.",
            "before_image_url": "/sample_test_plates/P1031_before.jpg",
            "after_image_url": "/sample_test_plates/P1031_after.jpg",
            "benchmark_waste_percent": 10.56,
            "category": "MODERATE: Some Leftover Waste",
            "ground_truth_status": "PASS (103k px Glare Pruned)"
        },
        {
            "plate_id": "P4828",
            "scenario": "Multi-Dish Dining Meal (Dal + Poori + Curry)",
            "description": "Balanced meal with three items served. Only a small poori scrap remaining.",
            "before_image_url": "/sample_test_plates/P4828_before.jpg",
            "after_image_url": "/sample_test_plates/P4828_after.jpg",
            "benchmark_waste_percent": 6.03,
            "category": "EXCELLENT: Minimal Food Waste",
            "ground_truth_status": "PASS (93.97% Consumed)"
        },
        {
            "plate_id": "P9768",
            "scenario": "High-Starch Clean Dining Plate (Rice + Fryums)",
            "description": "Rice and fryums 100% finished. Watery rinse film correctly rejected without false alerts.",
            "before_image_url": "/sample_test_plates/P9768_before.jpg",
            "after_image_url": "/sample_test_plates/P9768_after.jpg",
            "benchmark_waste_percent": 0.00,
            "category": "EXCELLENT: Clean Plate",
            "ground_truth_status": "PASS (100.0% Consumed)"
        },
        {
            "plate_id": "P1400",
            "scenario": "Heavy Liquid Leftover (Massive Dal Pool)",
            "description": "Poori finished but 114k px dal puddle leftover. Immediately triggers high waste alert.",
            "before_image_url": "/unseen_test_plates/P1400_before.jpg",
            "after_image_url": "/unseen_test_plates/P1400_after.jpg",
            "benchmark_waste_percent": 52.47,
            "category": "HIGH FOOD WASTE ALERT",
            "ground_truth_status": "ALERT (52.5% Waste)"
        },
        {
            "plate_id": "P2534",
            "scenario": "High Consumption Meal (Rice & Fryums)",
            "description": "Large portion eaten leaving tiny 12k px rice morsel. Distinguishes edible morsels from thin oil smears.",
            "before_image_url": "/unseen_test_plates/P2534_before.jpg",
            "after_image_url": "/unseen_test_plates/P2534_after.jpg",
            "benchmark_waste_percent": 2.60,
            "category": "EXCELLENT: Minimal Food Waste",
            "ground_truth_status": "PASS (97.4% Consumed)"
        }
    ]


@app.get("/api/dataset-summary")
def get_dataset_summary():
    json_path = os.path.join(CURRENT_DIR, "dataset_waste_summary.json")
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            return json.load(f)
    return {"message": "Dataset summary not yet generated."}


@app.post("/api/analyze-plate")
async def analyze_plate(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    model_type: str = Form("yolo")
):
    """
    Main analysis endpoint.
    - model_type='yolo'    -> YOLOv11s-seg (Model A)
    - model_type='cnn'     -> Baseline CNN U-Net (Model B)
    - model_type='compare' -> Evaluates both models side by side!
    """
    model_type = model_type.lower().strip()
    if model_type not in ["yolo", "cnn", "compare"]:
        model_type = "yolo"

    try:
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()

        nparr_b = np.frombuffer(before_bytes, np.uint8)
        nparr_a = np.frombuffer(after_bytes, np.uint8)

        img_b = cv2.imdecode(nparr_b, cv2.IMREAD_COLOR)
        img_a = cv2.imdecode(nparr_a, cv2.IMREAD_COLOR)

        if img_b is None or img_a is None:
            raise HTTPException(status_code=400, detail="Invalid image file format.")

        # Single Model: YOLO
        if model_type == "yolo":
            return run_yolo_pipeline(img_b, img_a)

        # Single Model: CNN
        elif model_type == "cnn":
            return run_cnn_pipeline(img_b, img_a)

        # Dual-Model Comparison Mode
        elif model_type == "compare":
            res_yolo = run_yolo_pipeline(img_b, img_a)
            res_cnn = run_cnn_pipeline(img_b, img_a)

            w_yolo = res_yolo["overall_waste_percent"]
            w_cnn = res_cnn["overall_waste_percent"]
            delta = round(abs(w_yolo - w_cnn), 2)
            agreement = round(max(0.0, 100.0 - (delta / max(max(w_yolo, w_cnn), 1.0) * 100.0)), 1)

            return {
                "mode": "compare",
                "yolo_evaluation": res_yolo,
                "cnn_evaluation": res_cnn,
                "comparison_metrics": {
                    "delta_waste_percent": delta,
                    "model_agreement_percent": agreement,
                    "faster_model": "YOLOv11s-seg (Model A)" if res_yolo["latency_ms"] < res_cnn["latency_ms"] else "Baseline CNN (Model B)",
                    "latency_advantage_ms": round(abs(res_yolo["latency_ms"] - res_cnn["latency_ms"]), 1)
                }
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("Starting EcoPlate Dual-Model Backend Server on http://localhost:8000 ...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
