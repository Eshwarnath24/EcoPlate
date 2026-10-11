import os
import io
import base64
import json
from pathlib import Path
import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv(Path(__file__).resolve().with_name(".env"))

key = os.environ.get("GEMINI_API_KEY")
if not key:
    raise RuntimeError("GEMINI_API_KEY environment variable is required")

# Open and resize image for fast transmission
img = Image.open('ecoplate_images/before/P1065.jpg')
img.thumbnail((768, 768))
buf = io.BytesIO()
img.save(buf, format='JPEG', quality=85)
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

prompt = """You are an expert food item detection model for Indian dining mess plates.
Detect all visible food items served on the plate.
Important requirements:
1. Group identical food items under the same semantic label (e.g., all fryum pieces, whether yellow or pink or purple, must have the label 'fryums').
2. Separate distinct food components: e.g., 'rice', 'sambar_dal', 'fryums', 'pickle', 'curry', 'poori', 'chapati', 'curd'.
3. For each food item, output its bounding box in [ymin, xmin, ymax, xmax] normalized to 0-1000. If an item has multiple pieces or parts (like scattered fryums), return a box for each piece with the same label.
Return ONLY a valid JSON array:
[
  {"box_2d": [ymin, xmin, ymax, xmax], "label": "rice"},
  {"box_2d": [ymin, xmin, ymax, xmax], "label": "fryums"}
]
"""

# Test models in order
models_to_try = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite'
]

for model_name in models_to_try:
    print(f"\n--- Trying {model_name} ---")
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}'
    payload = {
        'contents': [{
            'parts': [
                {'text': prompt},
                {'inline_data': {'mime_type': 'image/jpeg', 'data': img_b64}}
            ]
        }],
        'generationConfig': {
            'temperature': 0.1,
            'response_mime_type': 'application/json'
        }
    }
    try:
        r = requests.post(url, json=payload, timeout=45)
        print('Status:', r.status_code)
        if r.status_code == 200:
            res = r.json()
            text = res['candidates'][0]['content']['parts'][0]['text']
            print('Detected items:')
            items = json.loads(text)
            for it in items:
                print(' ', it['label'], it['box_2d'])
            break
        else:
            print('Error response:', r.text[:200])
    except Exception as e:
        print('Exception:', e)
