"""
EcoPlate AI Auto-Annotation Script using Gemini Vision API
-----------------------------------------------------------
Automatically detects food items (Rice, Dal, Boiled Egg, Chapati, Curry),
extracts 2D bounding boxes, and formats them into standard YOLO format (.txt files)
with an auto-generated dataset.yaml ready for fine-tuning.

Prerequisites:
  1. Set GEMINI_API_KEY environment variable, or pass it directly.
     Get a free key at: https://aistudio.google.com/
"""

import os
import sys
import glob
import json
import base64
import requests
from PIL import Image, ImageDraw, ImageFont

# Define classes to detect and their index in YOLO dataset
CLASS_MAP = {
    "rice": 0,
    "dal": 1,
    "boiled_egg": 2,
    "chapati": 3,
    "curry": 4
}

INPUT_DIR = "dataset_raw"
OUTPUT_DIR = "dataset_yolo"

PROMPT = """You are an expert computer vision model for food item detection on Indian dining plates.
Detect all visible food items on the plate.
Target labels (use strictly these lowercase labels):
- "rice" (any rice: plain rice, biryani, fried rice, pulao)
- "dal" (yellow dal, sambar, rasam, liquid lentil curry)
- "boiled_egg" (any whole or halved boiled egg)
- "chapati" (roti, flatbread, phulka, naan)
- "curry" (vegetable curry, paneer, non-liquid gravy)

For each detected food item, return its bounding box in normalized coordinates between 0 and 1000:
[ymin, xmin, ymax, xmax].

Return ONLY a JSON array with this exact structure:
[
  {"box_2d": [ymin, xmin, ymax, xmax], "label": "rice"},
  {"box_2d": [ymin, xmin, ymax, xmax], "label": "boiled_egg"}
]
Do not include any conversational markdown or explanation outside the JSON array.
"""

def call_gemini_vision(image_path, api_key):
    """Calls Gemini 2.0 Flash via REST API with image base64."""
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    b64_image = base64.b64encode(img_bytes).decode("utf-8")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": PROMPT},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": b64_image
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "response_mime_type": "application/json"
        }
    }
    
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text}")
        
    res_data = resp.json()
    text = res_data["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text)

def convert_box_to_yolo(box_2d):
    """
    Converts [ymin, xmin, ymax, xmax] (0-1000 scale)
    to YOLO format [x_center, y_center, width, height] (0.0 - 1.0 scale).
    """
    ymin, xmin, ymax, xmax = box_2d
    
    # Clamp to [0, 1000]
    ymin = max(0, min(1000, ymin))
    xmin = max(0, min(1000, xmin))
    ymax = max(0, min(1000, ymax))
    xmax = max(0, min(1000, xmax))
    
    w_box = (xmax - xmin) / 1000.0
    h_box = (ymax - ymin) / 1000.0
    x_c = ((xmin + xmax) / 2.0) / 1000.0
    y_c = ((ymin + ymax) / 2.0) / 1000.0
    
    return x_c, y_c, w_box, h_box

def draw_preview(image_path, detections, save_path):
    """Draws bounding boxes and labels on image for visual inspection."""
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    w, h = img.size
    
    for det in detections:
        label = det.get("label", "").lower()
        box = det.get("box_2d", [])
        if len(box) != 4:
            continue
        ymin, xmin, ymax, xmax = box
        y1, x1 = int(ymin * h / 1000.0), int(xmin * w / 1000.0)
        y2, x2 = int(ymax * h / 1000.0), int(xmax * w / 1000.0)
        
        draw.rectangle([x1, y1, x2, y2], outline="lime", width=3)
        draw.text((x1 + 4, y1 + 4), label, fill="yellow")
        
    img.save(save_path)

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\n[!] GEMINI_API_KEY environment variable not set.")
        api_key = input("Enter your Gemini API Key (from https://aistudio.google.com/): ").strip()
        if not api_key:
            print("Error: API key is required to run auto-annotation.")
            sys.exit(1)

    images = glob.glob(os.path.join(INPUT_DIR, "*.jpg")) + glob.glob(os.path.join(INPUT_DIR, "*.png"))
    if not images:
        # Fallback to sample_real_plates if dataset_raw is empty
        images = glob.glob(os.path.join("sample_real_plates", "*_before.jpg"))
        
    if not images:
        print(f"No images found in '{INPUT_DIR}' or 'sample_real_plates'. Run 'python download_samples.py' first!")
        sys.exit(1)

    train_img_dir = os.path.join(OUTPUT_DIR, "images", "train")
    train_lbl_dir = os.path.join(OUTPUT_DIR, "labels", "train")
    preview_dir = os.path.join(OUTPUT_DIR, "previews")
    
    os.makedirs(train_img_dir, exist_ok=True)
    os.makedirs(train_lbl_dir, exist_ok=True)
    os.makedirs(preview_dir, exist_ok=True)

    print(f"Found {len(images)} images to annotate using Gemini AI...")
    
    for i, img_path in enumerate(images, 1):
        filename = os.path.basename(img_path)
        base_name, _ = os.path.splitext(filename)
        print(f"[{i}/{len(images)}] Annotating {filename}...")
        
        try:
            detections = call_gemini_vision(img_path, api_key)
            
            # Save YOLO txt annotations
            txt_path = os.path.join(train_lbl_dir, f"{base_name}.txt")
            yolo_lines = []
            for det in detections:
                raw_label = det.get("label", "").lower().replace(" ", "_")
                # Normalize label
                matched_cls = None
                for key in CLASS_MAP:
                    if key in raw_label or raw_label in key:
                        matched_cls = CLASS_MAP[key]
                        break
                if matched_cls is None:
                    continue  # skip unknown classes
                    
                box = det.get("box_2d", [])
                if len(box) == 4:
                    xc, yc, bw, bh = convert_box_to_yolo(box)
                    yolo_lines.append(f"{matched_cls} {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}")
                    
            with open(txt_path, "w") as f:
                f.write("\n".join(yolo_lines) + "\n")
                
            # Copy image to training folder
            dest_img = os.path.join(train_img_dir, filename)
            with open(img_path, "rb") as src, open(dest_img, "wb") as dst:
                dst.write(src.read())
                
            # Draw preview for inspection
            preview_path = os.path.join(preview_dir, f"{base_name}_annotated.jpg")
            draw_preview(img_path, detections, preview_path)
            
            print(f"  -> Detected {len(yolo_lines)} items. Preview saved to {preview_path}")
            
        except Exception as e:
            print(f"  -> Error annotating {filename}: {e}")

    # Generate data.yaml
    yaml_content = f"""# EcoPlate Hostel Mess Food Dataset
path: {os.path.abspath(OUTPUT_DIR)}
train: images/train
val: images/train  # For small sample fine-tuning, val can mirror train

names:
  0: rice
  1: dal
  2: boiled_egg
  3: chapati
  4: curry
"""
    yaml_path = os.path.join(OUTPUT_DIR, "data.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    print(f"\n==========================================")
    print(f"Auto-Annotation Complete!")
    print(f"YOLO Dataset saved in: '{OUTPUT_DIR}/'")
    print(f"Check visual previews in: '{preview_dir}/'")
    print(f"Config generated: '{yaml_path}'")
    print(f"==========================================")

if __name__ == "__main__":
    main()
