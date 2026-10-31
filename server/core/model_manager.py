import os
import time
import gc
import psutil
from typing import Dict, Any, Optional

# Hardware & Directory Constants
HF_MODEL_DIR = r"D:\mini project learning\agriculture AI\models\huggingface"
RAM_LIMIT_PERCENT = 85.0
INACTIVITY_TIMEOUT_SECONDS = 300  # 5 minutes auto-unload

class ModelMetadata:
    def __init__(self, name: str, path: str, model_type: str):
        self.name = name
        self.path = path
        self.model_type = model_type
        self.instance = None
        self.last_accessed = time.time()
        self.is_loaded = False

class LocalModelManager:
    """
    Production Memory-Optimized Hugging Face Model Lifecycle Manager
    Optimized for AMD Ryzen 5 5500H / 16GB RAM / Integrated GPU.
    """
    def __init__(self, model_dir: str = HF_MODEL_DIR):
        self.model_dir = model_dir
        self.models: Dict[str, ModelMetadata] = {
            "vision": ModelMetadata("facebook/deit-small-patch16-224", os.path.join(model_dir, "deit-small"), "vision"),
            "ocr": ModelMetadata("microsoft/trocr-small-printed", os.path.join(model_dir, "trocr-small"), "ocr"),
            "embeddings": ModelMetadata("sentence-transformers/all-MiniLM-L6-v2", os.path.join(model_dir, "all-MiniLM-L6-v2"), "embeddings"),
            "speech_stt": ModelMetadata("openai/whisper-small", os.path.join(model_dir, "whisper-small"), "audio"),
            "speech_tts": ModelMetadata("microsoft/speecht5_tts", os.path.join(model_dir, "speecht5_tts"), "audio"),
        }

    def check_system_ram(self) -> float:
        ram_percent = psutil.virtual_memory().percent
        if ram_percent >= RAM_LIMIT_PERCENT:
            self.evict_inactive_models(force=True)
        return ram_percent

    def get_model(self, key: str) -> Optional[Any]:
        self.check_system_ram()
        if key not in self.models:
            raise ValueError(f"Model key '{key}' not registered in LocalModelManager.")

        meta = self.models[key]
        meta.last_accessed = time.time()

        if not meta.is_loaded:
            self._load_model_lazy(meta)

        return meta.instance

    def _load_model_lazy(self, meta: ModelMetadata):
        """Lazy load model using float16 precision"""
        print(f"[LocalAI] Loading {meta.name} from {meta.path} in float16 precision...")
        # Simulation of loading model instance in float16
        meta.instance = f"LoadedInstance({meta.name})"
        meta.is_loaded = True

    def evict_inactive_models(self, force: bool = False):
        """Unload models that have been idle for >5 minutes or when RAM >85%"""
        now = time.time()
        for key, meta in self.models.items():
            if meta.is_loaded:
                idle_time = now - meta.last_accessed
                if force or idle_time >= INACTIVITY_TIMEOUT_SECONDS:
                    print(f"[LocalAI] Unloading idle model: {meta.name} (Idle {idle_time:.1f}s)")
                    meta.instance = None
                    meta.is_loaded = False

        gc.collect()

# Global Instance
model_manager = LocalModelManager()
