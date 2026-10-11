"""
Fine-tunes the RASOI YOLO model on the AI-annotated hostel mess dataset.
"""
import os
from ultralytics import YOLO

def main():
    yaml_path = os.path.abspath("dataset_yolo/data.yaml")
    if not os.path.exists(yaml_path):
        # Check if Roboflow dataset was extracted instead
        roboflow_yaml = os.path.abspath("dataset_hostel/data.yaml")
        if os.path.exists(roboflow_yaml):
            yaml_path = roboflow_yaml
        else:
            print(f"Error: Dataset yaml not found at '{yaml_path}' or '{roboflow_yaml}'.")
            print("Please run 'auto_annotate_gemini.py' or extract your Roboflow zip first.")
            return

    base_model = "Rasoi_Yolo12S.pt"
    if not os.path.exists(base_model):
        print(f"Error: Base weights '{base_model}' not found in the current folder.")
        return

    print("==================================================")
    print("Starting EcoPlate RASOI Fine-Tuning")
    print(f"Base Model:    {base_model}")
    print(f"Dataset YAML:  {yaml_path}")
    print("==================================================")

    model = YOLO(base_model)
    
    # Train
    results = model.train(
        data=yaml_path,
        epochs=30,             # 30-40 epochs is ideal for fine-tuning
        imgsz=640,
        batch=4,               # Small batch size for CPU / low VRAM
        freeze=10,             # Freeze early backbone layers (transfer learning)
        project="ecoplate_runs",
        name="rasoi_hostel_finetuned",
        device="cpu",          # Will use GPU if available, else CPU
        plots=True
    )
    
    print("\nFine-tuning completed successfully!")
    print("New model saved at: ecoplate_runs/rasoi_hostel_finetuned/weights/best.pt")

if __name__ == "__main__":
    main()
