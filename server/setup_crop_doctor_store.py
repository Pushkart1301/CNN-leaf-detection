import os
import json

MODEL_BASE_DIR = r"D:\mini project learning\agriculture AI\agriculture model for AI crop doctor tab"

SUBFOLDERS = [
    "detection",
    "classifiers",
    "segmentation",
    "embeddings",
    "reranker",
    "ocr",
    "cache",
    "rag",
    "logs",
    "temp",
    "downloads"
]

def setup_crop_doctor_store():
    print(f"[CropDoctor Store] Initializing directories at: {MODEL_BASE_DIR}")
    os.makedirs(MODEL_BASE_DIR, exist_ok=True)
    
    status = {}
    for sub in SUBFOLDERS:
        folder = os.path.join(MODEL_BASE_DIR, sub)
        os.makedirs(folder, exist_ok=True)
        status[sub] = folder
        print(f"  [OK] Created folder: {folder}")
        
    print("[CropDoctor Store] All 11 Subdirectories Initialized Successfully.")
    return status

if __name__ == "__main__":
    setup_crop_doctor_store()
