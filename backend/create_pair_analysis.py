"""
Creates a side-by-side before & after visualization for sample P5921.
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_comparison():
    before_annotated_path = "sample_check/P5921_before_annotated.jpg"
    after_path = "dataset_raw/P5921_after.jpg"

    b_img = Image.open(before_annotated_path).convert("RGB")
    a_img = Image.open(after_path).convert("RGB")

    # Resize both to same height for display (e.g. 800px tall)
    target_h = 800
    target_w = int(720 * (800 / 1280))

    b_resized = b_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    a_resized = a_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Canvas with header
    header_h = 80
    footer_h = 160
    total_w = target_w * 2 + 30
    total_h = target_h + header_h + footer_h

    canvas = Image.new("RGB", (total_w, total_h), "#121212")
    draw = ImageDraw.Draw(canvas)

    # Paste images
    canvas.paste(b_resized, (10, header_h))
    canvas.paste(a_resized, (target_w + 20, header_h))

    # Header Titles
    draw.text((20, 20), "PLATE P5921: BEFORE MEAL (Annotated)", fill="#00E5FF")
    draw.text((20, 48), "Classes: [Rice, Dal, 2x Boiled Egg]", fill="#B0BEC5")

    draw.text((target_w + 30, 20), "PLATE P5921: AFTER MEAL (Leftover)", fill="#FF5252")
    draw.text((target_w + 30, 48), "Residual smears + chili/scrap only", fill="#B0BEC5")

    # Footer Analysis Box
    fy = header_h + target_h + 15
    draw.rectangle([10, fy, total_w - 10, total_h - 15], outline="#333333", fill="#1E1E1E", width=2)
    
    analysis_text = [
        "FOOD WASTE ANALYSIS BREAKDOWN:",
        "  • Spiced Rice:    BEFORE = 1 large mound  |  AFTER = 0 items left   --> Waste: 0%  (Fully Consumed)",
        "  • Boiled Eggs:    BEFORE = 2 eggs         |  AFTER = 0 eggs left    --> Waste: 0%  (Fully Consumed)",
        "  • Dal / Sambar:   BEFORE = Full pool      |  AFTER = Minor streaks  --> Waste: ~3% (Trace Residue)",
        "OVERALL PLATE RESULT: Minimal Waste (< 5%) -> Category: 'CLEAN / NONE'"
    ]

    for i, line in enumerate(analysis_text):
        color = "#00E676" if "OVERALL" in line else "#FFFFFF"
        draw.text((25, fy + 12 + i * 26), line, fill=color)

    out_path = "sample_check/P5921_before_after_analysis.jpg"
    canvas.save(out_path)
    print(f"Generated comparison graphic at: {out_path}")

if __name__ == "__main__":
    create_comparison()
