"""
EcoPlate AI: FastAPI Backend Server
===================================
Provides REST API endpoints for:
1. POST /api/analyze-plate: Upload Before & After plate images, returns waste breakdown and visualization.
2. GET  /api/dataset-summary: Dataset-wide waste statistics and dish rankings.
3. GET  /api/health: Service health status.
"""

import os
import sys
import json
import base64
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# Add current dir to path to import ecoplate_waste_estimator
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

from ecoplate_waste_estimator import (
    detect_plate_bounds,
    segment_plate_contents,
    render_annotated_plate,
    build_comparison_dashboard,
    CLASS_NAMES,
    CLASS_COLORS
)

app = FastAPI(title="EcoPlate AI API", version="2.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model loading with robust paths
WEIGHTS_CANDIDATES = [
    os.path.join(CURRENT_DIR, "weights", "yolo11s_level1_best.pt"),
    os.path.join(CURRENT_DIR, "weights", "best.pt"),
    r"f:\4 year\nndl\Team-4\runs\segment\training_runs\yolo11n_food_seg_v2\weights\best.pt",
    r"f:\4 year\nndl\Team-4\yolo11n-seg.pt"
]

MODEL = None
for path in WEIGHTS_CANDIDATES:
    if os.path.exists(path):
        print(f"Loading YOLO model from: {path}")
        MODEL = YOLO(path)
        break

if MODEL is None:
    print("[WARN] No model weights found in standard locations.")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EcoPlate AI Backend",
        "model_loaded": MODEL is not None,
        "classes": CLASS_NAMES
    }


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
    after_image: UploadFile = File(...)
):
    if MODEL is None:
        raise HTTPException(status_code=500, detail="Model is not loaded on server.")

    # Read uploaded bytes
    try:
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()

        nparr_b = np.frombuffer(before_bytes, np.uint8)
        nparr_a = np.frombuffer(after_bytes, np.uint8)

        img_b = cv2.imdecode(nparr_b, cv2.IMREAD_COLOR)
        img_a = cv2.imdecode(nparr_a, cv2.IMREAD_COLOR)

        if img_b is None or img_a is None:
            raise HTTPException(status_code=400, detail="Invalid image file format.")

        # Step 1: Detect Plate Boundaries (ROI)
        cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
        cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

        # Step 2: Segment with Level 1 (768px + Closed-World Semantic Filter)
        before_items, dets_b = segment_plate_contents(MODEL, img_b, pmask_b, is_after=False, imgsz=768)
        served_classes = set(before_items.keys())
        after_items, dets_a = segment_plate_contents(MODEL, img_a, pmask_a, is_after=True, served_classes=served_classes, imgsz=768)

        # Step 3: Render annotated visuals
        annotated_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
        annotated_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")

        # Step 4: Build Dashboard image and records
        dashboard, records = build_comparison_dashboard(
            annotated_b, annotated_a, "LIVE_UPLOAD", before_items, after_items
        )

        # Step 5: Encode dashboard image to base64
        _, buffer = cv2.imencode(".jpg", dashboard)
        dashboard_base64 = base64.b64encode(buffer).decode("utf-8")

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

        return {
            "overall_waste_percent": round(overall_waste, 2),
            "overall_consumed_percent": round(overall_consumed, 2),
            "status": status,
            "items_served_count": len(before_items),
            "items_leftover_count": len(after_items),
            "item_breakdown": records,
            "dashboard_image_base64": f"data:image/jpeg;base64,{dashboard_base64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("Starting EcoPlate Backend Server on http://localhost:8000 ...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
