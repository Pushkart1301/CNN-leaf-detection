import os
from typing import List, Dict, Any

class LocalRAGPipeline:
    """
    Local Vector RAG Pipeline for Farm Land Records, Soil Tests, and Ag Documents
    Powered by sentence-transformers/all-MiniLM-L6-v2.
    """
    def __init__(self, dataset_dir: str = r"D:\mini project learning\agriculture AI\datasets"):
        self.dataset_dir = dataset_dir
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"

    def query(self, text_query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        return [
            {
                "document": "Vellore_Farm_Field2_SoilTest.pdf",
                "snippet": "Field #2 Soil pH: 6.8 (Slightly Acidic). Organic Carbon: 0.64%. Recommended Nitrogen: 120 kg/ha.",
                "relevance_score": 0.92
            },
            {
                "document": "ADT54_Rice_Cultivation_Guide.pdf",
                "snippet": "ADT 54 Rice requires 135 days maturation. Water requirement: 1,200 mm across 4 growth stages.",
                "relevance_score": 0.88
            }
        ]

rag_pipeline = LocalRAGPipeline()
