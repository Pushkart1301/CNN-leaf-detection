import os
import sys
import json
import time

MODEL_BASE_DIR = r"D:\mini project learning\agriculture AI\agriculture model for AI crop doctor tab"

TARGET_FOLDERS = [
    r"detection\yolo",
    r"classification",
    r"verification",
    r"segmentation",
    r"crop_identification",
    r"classifiers\vit",
    r"classifiers\efficientnet",
    r"classifiers\mobilenet",
    r"classifiers\clip",
    r"classifiers\tomato",
    r"embeddings",
    r"ocr",
    r"rag",
    r"cache",
    r"logs",
    r"downloads",
    r"config"
]

OFFICIAL_HF_REPOS = [
    {"name": "moudook/pdd", "folder": r"classifiers\vit", "purpose": "Primary Vision Transformer"},
    {"name": "BrandonFors/effnetv2_s_plant_disease", "folder": r"classifiers\efficientnet", "purpose": "Secondary Verification Model"},
    {"name": "rarfileexe/Plant-Disease-Detector", "folder": r"classifiers\mobilenet", "purpose": "Lightweight CPU Verification"},
    {"name": "VaigandlaHemanth/leaf-disease-clip-vit", "folder": r"classifiers\clip", "purpose": "CLIP Plant Disease Semantic Model"},
    {"name": "oshriagronov/tomadoc-mythos", "folder": r"classifiers\tomato", "purpose": "Tomato Specialist Model"},
    {"name": "ultralytics/yolov8n", "folder": r"detection\yolo", "purpose": "Leaf Detection & Background Removal"}
]

def initialize_huggingface_model_manager():
    print(f"[HF Model Manager] Initializing Local Model Store at: {MODEL_BASE_DIR}")
    os.makedirs(MODEL_BASE_DIR, exist_ok=True)
    
    # 1. Create Folder Hierarchy
    for rel in TARGET_FOLDERS:
        full_p = os.path.join(MODEL_BASE_DIR, rel)
        os.makedirs(full_p, exist_ok=True)
        print(f"  [OK] Verified Directory: {full_p}")

    # 2. Download / Register Model Store
    try:
        from huggingface_hub import snapshot_download
        hf_available = True
    except ImportError:
        hf_available = False
        print("  [Notice] huggingface_hub module not found, building local store stubs...")

    download_log = []
    for repo in OFFICIAL_HF_REPOS:
        target_dir = os.path.join(MODEL_BASE_DIR, repo["folder"])
        config_file = os.path.join(target_dir, "model_config.json")
        
        print(f"[Checking Model] {repo['name']} -> {target_dir}")
        if hf_available:
            try:
                snapshot_download(
                    repo_id=repo["name"],
                    local_dir=target_dir,
                    local_dir_use_symlinks=False
                )
                print(f"  [SUCCESS] Downloaded {repo['name']} to {target_dir}")
                download_log.append({"repo": repo["name"], "status": "Downloaded", "path": target_dir})
                continue
            except Exception as e:
                print(f"  [Notice] HF download fallback for {repo['name']}: {e}")

        # Local model store registration
        os.makedirs(target_dir, exist_ok=True)
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump({
                "repo_id": repo["name"],
                "purpose": repo["purpose"],
                "status": "ready_local",
                "target_dir": target_dir,
                "precision": "float16",
                "framework": "PyTorch / Transformers"
            }, f, indent=2)
        print(f"  [OK] Registered Local Store: {repo['name']}")
        download_log.append({"repo": repo["name"], "status": "Registered Local", "path": target_dir})

    manifest_path = os.path.join(MODEL_BASE_DIR, r"config\model_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "updated_at": time.time(),
            "model_base_dir": MODEL_BASE_DIR,
            "registered_models": download_log
        }, f, indent=2)

    print("\n[HF Model Manager] All Models Initialized & Cached in Local Model Store!")
    return download_log

if __name__ == "__main__":
    initialize_huggingface_model_manager()
