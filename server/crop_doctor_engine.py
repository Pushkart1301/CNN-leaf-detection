import os
import time
import json
import io
import math
import logging
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageStat
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

MODEL_BASE_DIR = r"D:\mini project learning\agriculture AI\agriculture model for AI crop doctor tab"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
logger = logging.getLogger(__name__)

MODEL_PATHS = {
    "vit": os.path.join(MODEL_BASE_DIR, r"classifiers\vit"),
    "efficientnet": os.path.join(MODEL_BASE_DIR, r"classifiers\efficientnet"),
    "mobilenet": os.path.join(MODEL_BASE_DIR, r"classifiers\mobilenet"),
    "clip": os.path.join(MODEL_BASE_DIR, r"classifiers\clip"),
    "tomato": os.path.join(MODEL_BASE_DIR, r"classifiers\tomato"),
    "yolo": os.path.join(MODEL_BASE_DIR, r"detection\yolo")
}

# Universal Comprehensive Crop & Disease RAG Store (15 Crop Categories)
CROP_SPECIFIC_RAG_STORE = {
    "Rice (Paddy)": {
        "Rice Brown Spot (Bipolaris oryzae)": {
            "symptoms": "Oval dark brown lesions with yellow halo on leaf blades.",
            "causes": "Bipolaris oryzae fungal spores, nitrogen deficiency, un-flooded soil.",
            "sources": ["IRRI Rice Doctor Advisory #2024-BS", "TNAU Rice Agronomy Manual"],
            "chemical": ["Propiconazole 25% EC @ 1.0 ml/L water", "Mancozeb 75% WP @ 2.0 g/L"],
            "organic": ["Neem Oil 10,000 PPM @ 5 ml/L", "Pseudomonas fluorescens @ 2.5 kg/acre"],
            "preventive": ["Maintain 3-5cm standing water", "Apply split Nitrogen dosages"]
        },
        "Rice Leaf Blast (Pyricularia oryzae)": {
            "symptoms": "Spindle-shaped lesions with gray centers and reddish margins.",
            "causes": "Pyricularia oryzae, high humidity (>90%), excess nitrogen.",
            "sources": ["ICAR NRRI Rice Pathology Manual"],
            "chemical": ["Tricyclazole 75% WP @ 0.6 g/L", "Isoprothiolane 40% EC @ 1.5 ml/L"],
            "organic": ["Panchagavya 3% foliar spray @ 30 ml/L"],
            "preventive": ["Avoid excessive urea application", "Destroy infected crop stubble"]
        },
        "Bacterial Leaf Blight (Xanthomonas oryzae)": {
            "symptoms": "Water-soaked streaks on leaf margins turning yellow and drying to straw-color.",
            "causes": "Xanthomonas oryzae pv. oryzae bacteria spread through wind and irrigation water.",
            "sources": ["ICAR Directorate of Rice Research Bulletin"],
            "chemical": ["Copper Oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L"],
            "organic": ["Fresh cow dung slurry spray 2%"],
            "preventive": ["Grow resistant varieties (PR 126, ADT 54)", "Avoid clipping leaf tips during transplanting"]
        }
    },
    "Wheat": {
        "Wheat Yellow Rust (Puccinia striiformis)": {
            "symptoms": "Bright yellow pustules arranged in linear stripes on leaf surface.",
            "causes": "Puccinia striiformis spores carried by wind in cool moist conditions (10-15°C).",
            "sources": ["ICAR Indian Institute of Wheat & Barley Research"],
            "chemical": ["Tebuconazole 25.9% EC @ 1.5 ml/L", "Propiconazole 25% EC @ 1.0 ml/L"],
            "organic": ["Bio-fungicide Trichoderma viride @ 5 g/L"],
            "preventive": ["Sow early in November", "Use rust-resistant wheat varieties (HD 3086, DBW 187)"]
        },
        "Wheat Leaf Rust (Puccinia triticina)": {
            "symptoms": "Small orange-brown circular pustules scattered randomly on upper leaf surface.",
            "causes": "Puccinia triticina fungus favored by moderate temperature (15-22°C).",
            "sources": ["PAU Wheat Protection Guidelines"],
            "chemical": ["Mancozeb 75% WP @ 2.0 g/L"],
            "organic": ["Neem leaf extract 5% spray"],
            "preventive": ["Destroy volunteer wheat plants", "Avoid late sowing"]
        }
    },
    "Tomato": {
        "Tomato Early Blight (Alternaria solani)": {
            "symptoms": "Concentric ring spots (target-board pattern) on lower leaves.",
            "causes": "Alternaria solani fungus, warm temperatures (24-29°C), high humidity.",
            "sources": ["IIHR Tomato Protection Guide", "TNAU Horticulture Manual"],
            "chemical": ["Chlorothalonil 75% WP @ 2.0 g/L", "Azoxystrobin 23% SC @ 1.0 ml/L"],
            "organic": ["Trichoderma harzianum foliar spray @ 5g/L", "Copper Hydroxide @ 2g/L"],
            "preventive": ["Mulch soil to prevent rain splash", "Maintain crop rotation with non-solanaceous crops"]
        },
        "Tomato Late Blight (Phytophthora infestans)": {
            "symptoms": "Large water-soaked dark lesions on leaf margins with white mildew under moist conditions.",
            "causes": "Phytophthora infestans oomycete, cool wet weather (<20°C).",
            "sources": ["ICAR Central Horticultural Experiment Station Advisory"],
            "chemical": ["Metalaxyl 8% + Mancozeb 64% WP @ 2.5 g/L", "Cymoxanil 8% + Mancozeb 64% @ 2.0 g/L"],
            "organic": ["Bordeaux Mixture 1% foliar spray"],
            "preventive": ["Ensure wide row spacing for canopy aeration", "Avoid overhead sprinkler irrigation"]
        },
        "Tomato Yellow Leaf Curl Virus (TYLCV)": {
            "symptoms": "Upward cupping and yellowing of leaves, stunted plant growth with bushy appearance.",
            "causes": "Begomovirus transmitted by Bemisia tabaci whiteflies.",
            "sources": ["AVRDC World Vegetable Center Technical Bulletin"],
            "chemical": ["Imidacloprid 17.8% SL @ 0.5 ml/L for whitefly control"],
            "organic": ["Yellow sticky traps 15/acre", "Neem seed kernel extract 5%"],
            "preventive": ["Use insect-proof nursery nets (40 mesh)", "Plant resistant hybrids (Arka Rakshak)"]
        }
    },
    "Potato": {
        "Potato Late Blight (Phytophthora infestans)": {
            "symptoms": "Necrotic black lesions on leaf tips wilting stems quickly.",
            "causes": "Phytophthora infestans, low temperatures and high humidity.",
            "sources": ["CPRI Shimla Potato Advisory Bulletin"],
            "chemical": ["Mancozeb 75% WP @ 2.0 g/L", "Dimethomorph 50% WP @ 1.0 g/L"],
            "organic": ["Pseudomonas fluorescens @ 10g/L spray"],
            "preventive": ["Use certified disease-free seed tubers", "Hill up soil around plants"]
        },
        "Potato Early Blight (Alternaria solani)": {
            "symptoms": "Dark brown circular spots with target-ring concentric pattern.",
            "causes": "Alternaria solani fungus surviving in crop residues.",
            "sources": ["ICAR CPRI Pathology Division"],
            "chemical": ["Mancozeb 75% WP @ 2.0 g/L", "Propineb 70% WP @ 2.0 g/L"],
            "organic": ["Copper Oxychloride @ 2.5 g/L"],
            "preventive": ["Maintain adequate potassium fertilization", "Destroy infected crop debris"]
        }
    },
    "Maize (Corn)": {
        "Northern Corn Leaf Blight (Exserohilum turcicum)": {
            "symptoms": "Long elliptical grayish-green or tan lesions on lower leaves progressing upwards.",
            "causes": "Exserohilum turcicum fungus favored by high humidity and moderate temps (18-27°C).",
            "sources": ["ICAR Indian Institute of Maize Research"],
            "chemical": ["Mancozeb 75% WP @ 2.0 g/L", "Azoxystrobin 23% SC @ 1.0 ml/L"],
            "organic": ["Foliar spray of Trichoderma viride @ 5g/L"],
            "preventive": ["Use resistant maize hybrids (CO 6)", "Perform deep summer plowing"]
        },
        "Common Corn Rust (Puccinia sorghi)": {
            "symptoms": "Small golden-brown powdery pustules scattered on both leaf surfaces.",
            "causes": "Puccinia sorghi fungal spores carried by air currents.",
            "sources": ["TNAU Maize Agronomy Guide"],
            "chemical": ["Mancozeb 75% WP @ 2.0 g/L"],
            "organic": ["Neem Oil spray @ 3ml/L"],
            "preventive": ["Avoid overhead irrigation late in the evening"]
        }
    },
    "Cotton": {
        "Cotton Bacterial Blight (Xanthomonas citri pv. malvacearum)": {
            "symptoms": "Angular dark water-soaked spots bounded by leaf veins ('Angular Leaf Spot').",
            "causes": "Xanthomonas bacteria seed-borne or water-splash spread.",
            "sources": ["ICAR Central Institute for Cotton Research"],
            "chemical": ["Copper Oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L"],
            "organic": ["Bio-control agent Pseudomonas fluorescens seed treatment @ 10g/kg"],
            "preventive": ["Delint cotton seed with acid prior to sowing"]
        }
    },
    "Sugarcane": {
        "Sugarcane Red Rot (Colletotrichum falcatum)": {
            "symptoms": "Reddening of internal stalk tissue with white transverse bands, yellowing top leaves.",
            "causes": "Colletotrichum falcatum fungal infection through infected setts.",
            "sources": ["Sugarcane Breeding Institute (SBI) Coimbatore"],
            "chemical": ["Sett treatment with Carbendazim 50% WP @ 2.0 g/L"],
            "organic": ["Trichoderma viride soil application @ 2.5 kg/acre"],
            "preventive": ["Use healthy seed setts from disease-free nurseries"]
        }
    },
    "Chilli (Pepper)": {
        "Chilli Anthracnose (Colletotrichum capsici)": {
            "symptoms": "Sunken circular dark spots with concentric rings of black acervuli on leaves and fruits.",
            "causes": "Colletotrichum capsici fungus spread by rain splashes.",
            "sources": ["IIHR Chilli Crop Protection Bulletin"],
            "chemical": ["Azoxystrobin 23% SC @ 1.0 ml/L", "Copper Oxychloride @ 2.5 g/L"],
            "organic": ["Pseudomonas fluorescens 10g/L foliar spray"],
            "preventive": ["Treat seeds with Thiram @ 3g/kg before sowing"]
        }
    },
    "Banana": {
        "Banana Sigatoka Disease (Mycosphaerella fijiensis)": {
            "symptoms": "Dark brown reddish streaks on leaf veins coalescing into large necrotic spots.",
            "causes": "Mycosphaerella fungal spores favored by warm wet tropical climates.",
            "sources": ["ICAR National Research Centre for Banana (NRCB)"],
            "chemical": ["Propiconazole 25% EC @ 1.0 ml/L + Mineral oil @ 10 ml/L"],
            "organic": ["Petroleum spray oil 1% foliar spray"],
            "preventive": ["De-leaf infected lower foliage promptly"]
        }
    }
}

import model_manager

def verify_local_models_exist() -> Dict[str, Any]:
    """Check existence and status of local HF model stores"""
    return model_manager.get_local_model_status()

# --- Neural Network Model Initialization ---
_hf_pipeline = None

def get_hf_pipeline():
    global _hf_pipeline
    if _hf_pipeline is None:
        try:
            from transformers import pipeline
            import torch
            project_root = Path(__file__).resolve().parents[1]
            local_model_candidates = (
                project_root / "models" / "huggingface" / "leaf_disease_realworld",
                project_root / "models" / "leaf_disease_classifier",
                project_root / "models" / "huggingface" / "leaf_disease_classifier",
            )
            local_model = next(
                (
                    candidate
                    for candidate in local_model_candidates
                    if (candidate / "config.json").is_file()
                    and (candidate / "preprocessor_config.json").is_file()
                ),
                None,
            )
            model_source = str(local_model) if local_model else "surgeonwz/plant-village"
            print(f"[Neural Network] Loading leaf disease classifier from {model_source}...")
            _hf_pipeline = pipeline(
                "image-classification",
                model=model_source,
                device=0 if torch.cuda.is_available() else -1
            )
        except Exception as e:
            logger.exception("Failed to load PlantVillage disease classifier")
    return _hf_pipeline

MODEL_LABEL_MAPPING = {
    "Rice___Brown_Spot": ("Rice (Paddy)", "Rice Brown Spot (Bipolaris oryzae)"),
    "Rice___Leaf_Blast": ("Rice (Paddy)", "Rice Leaf Blast (Pyricularia oryzae)"),
    "Rice___Bacterial_leaf_blight": ("Rice (Paddy)", "Bacterial Leaf Blight (Xanthomonas oryzae)"),
    "Wheat___Yellow_Rust": ("Wheat", "Wheat Yellow Rust (Puccinia striiformis)"),
    "Wheat___Leaf_Rust": ("Wheat", "Wheat Leaf Rust (Puccinia triticina)"),
    "Tomato___Early_blight": ("Tomato", "Tomato Early Blight (Alternaria solani)"),
    "Tomato___Late_blight": ("Tomato", "Tomato Late Blight (Phytophthora infestans)"),
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": ("Tomato", "Tomato Yellow Leaf Curl Virus (TYLCV)"),
    "Potato___Early_blight": ("Potato", "Potato Early Blight (Alternaria solani)"),
    "Potato___Late_blight": ("Potato", "Potato Late Blight (Phytophthora infestans)"),
    "Corn_(maize)___Northern_Leaf_Blight": ("Maize (Corn)", "Northern Corn Leaf Blight (Exserohilum turcicum)"),
    "Corn_(maize)___Common_rust_": ("Maize (Corn)", "Common Corn Rust (Puccinia sorghi)"),
    "Tomato___healthy": ("Tomato", "Healthy Foliage"),
    "Potato___healthy": ("Potato", "Healthy Foliage"),
    "Corn_(maize)___healthy": ("Maize (Corn)", "Healthy Foliage"),
}

def map_model_label_to_rag(label_name: str) -> tuple[str, str]:
    if label_name in MODEL_LABEL_MAPPING:
        return MODEL_LABEL_MAPPING[label_name]
    
    lower_label = label_name.lower().replace("_", " ")
    crop_label = label_name.split("___", 1)[0]
    crop_names = {
        "apple": "Apple",
        "blueberry": "Blueberry",
        "cherry (including sour)": "Cherry",
        "corn (maize)": "Maize (Corn)",
        "grape": "Grape",
        "orange": "Orange",
        "peach": "Peach",
        "pepper, bell": "Bell Pepper",
        "potato": "Potato",
        "raspberry": "Raspberry",
        "soybean": "Soybean",
        "squash": "Squash",
        "strawberry": "Strawberry",
        "tomato": "Tomato",
    }
    crop = crop_names.get(crop_label.lower().replace("_", " "), "Unknown")
        
    disease_name = label_name.replace("___", " - ").replace("_", " ")
    if "healthy" in lower_label:
        disease_name = "Healthy Foliage"
        
    return crop, disease_name


def process_real_image_inference(image_bytes: bytes) -> Dict[str, Any]:
    """
    Universal AI Crop Disease Vision Specialist Inference Engine:
    Predicts crop species & diseases using a trained Neural Network.
    Returns 10-point structured JSON contract.
    """
    # 1. Image Preprocessing & Initial Quality Checks
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {
            "crop_species": "Unknown", "crop_confidence": 0,
            "disease": "Unable to diagnose. Please upload a clearer leaf image.", "disease_confidence": 0,
            "top_predictions": [], "leaf_detected": False, "image_quality": "Poor",
            "needs_manual_verification": True, "valid": False,
            "error": "Unable to diagnose. Please upload a clearer leaf image."
        }

    h, w, c = img.shape
    if w < 80 or h < 80:
        return {
            "crop_species": "Unknown", "crop_confidence": 0,
            "disease": "Unable to diagnose. Please upload a clearer leaf image.", "disease_confidence": 0,
            "top_predictions": [], "leaf_detected": False, "image_quality": "Poor",
            "needs_manual_verification": True, "valid": False,
            "error": "Image dimensions too small. Minimum 80x80px required."
        }

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    image_quality = "Good" if blur_score > 50.0 else ("Medium" if blur_score > 20.0 else "Poor")

    if blur_score < 10.0:
        return {
            "crop_species": "Unknown", "crop_confidence": 0,
            "disease": "Unable to diagnose. Please upload a clearer leaf image.", "disease_confidence": 0,
            "top_predictions": [], "leaf_detected": False, "image_quality": "Poor",
            "needs_manual_verification": True, "valid": False,
            "error": "Unable to diagnose. Please upload a clearer leaf image."
        }

    # 2. Neural Network Inference
    try:
        classifier = get_hf_pipeline()
        if classifier is None:
            raise ValueError("Failed to load Hugging Face model")
            
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = classifier(pil_img)
        
        if not results:
             raise ValueError("Empty results from model")
             
        top_result = results[0]
        raw_label = top_result['label']
        confidence_pct = int(top_result['score'] * 100)
        
        crop_species, disease_name = map_model_label_to_rag(raw_label)
        
        top_preds = []
        for res in results[:5]:
            _, mapped_disease = map_model_label_to_rag(res['label'])
            top_preds.append({"name": mapped_disease, "confidence": int(res['score'] * 100)})

    except Exception as e:
        logger.exception("Neural network disease inference failed")
        return {
            "crop_species": "Unknown",
            "crop_confidence": 0,
            "disease": "Disease classifier failed to run. No diagnosis was generated.",
            "disease_confidence": 0,
            "top_predictions": [],
            "leaf_detected": False,
            "image_quality": image_quality,
            "needs_manual_verification": True,
            "valid": False,
            "status": "error",
            "error": "Disease classifier failed to run. Check the backend log and try again."
        }

    if crop_species == "Unknown":
        return {
            "crop_species": "Unknown",
            "crop_confidence": 0,
            "disease": "This crop or model label is not supported. No diagnosis was generated.",
            "disease_confidence": 0,
            "top_predictions": [],
            "leaf_detected": False,
            "image_quality": image_quality,
            "needs_manual_verification": True,
            "valid": False,
            "status": "crop_unidentified",
            "error": "This crop or model label is not supported. No diagnosis was generated."
        }

    # Preserve legacy visual stats for UI compatibility
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask_green = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
    mask_brown = cv2.inRange(hsv, np.array([10, 40, 40]), np.array([30, 255, 255]))
    total_px = float(w * h)
    green_ratio = (cv2.countNonZero(mask_green) / total_px) * 100.0
    brown_ratio = (cv2.countNonZero(mask_brown) / total_px) * 100.0

    image_stats = {
        "dimensions": f"{w}x{h}px",
        "green_foliage_ratio": f"{round(green_ratio, 1)}%",
        "brown_lesion_ratio": f"{round(brown_ratio, 1)}%",
        "lesion_spot_count": "N/A (Neural Net Engine)",
        "sharpness_score": round(blur_score, 1)
    }
    needs_manual_verification = confidence_pct < 60 or image_quality == "Poor"
    confidence_notes = ""
    if confidence_pct < 60:
        confidence_notes = (
            f"Caution: the model predicts {disease_name} on {crop_species}, but its "
            f"confidence is {confidence_pct}%. Treat this as a preliminary result."
        )
    if image_quality == "Poor":
        quality_note = (
            "The image is blurry or low quality; try a sharper close-up photo "
            "of one tomato leaf."
        )
        confidence_notes = f"{confidence_notes} {quality_note}".strip()

    return {
        "crop_species": crop_species,
        "crop_confidence": confidence_pct,
        "disease": disease_name,
        "disease_confidence": confidence_pct,
        "top_predictions": top_preds,
        "leaf_detected": True,
        "image_quality": image_quality,
        "needs_manual_verification": needs_manual_verification,
        "valid": True,
        "status": "success",
        "confidence_notes": confidence_notes,
        "crop_name": crop_species,
        "confidence": confidence_pct,
        "primary_disease": disease_name,
        "secondary_disease": top_preds[1]["name"] if len(top_preds) > 1 else disease_name,
        "image_stats": image_stats
    }

def query_ollama_qwen(prompt: str, context: str = "") -> str:
    """Query local Ollama qwen:latest instance for farmer Q&A and prescriptions."""
    payload = {
        "model": "qwen:latest",
        "prompt": f"Context: {context}\nUser Question: {prompt}\nDetailed Agricultural Answer:",
        "stream": False,
        "options": {
            "num_predict": 180,
            "temperature": 0.2
        }
    }
    try:
        req = urllib.request.Request(
            OLLAMA_URL, 
            data=json.dumps(payload).encode('utf-8'), 
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            d = json.loads(resp.read().decode('utf-8'))
            return d.get("response", "").strip()
    except Exception as e:
        logger.warning("Local Ollama treatment assistant is unavailable: %s", e)
        return "Remove affected leaves, improve airflow, and confirm the diagnosis before treatment."

def execute_crop_doctor_full_pipeline(image_bytes: bytes) -> Dict[str, Any]:
    start_t = time.time()
    
    inference = process_real_image_inference(image_bytes)
    
    if not inference.get("valid"):
        return {
            "status": inference.get("status", "crop_unidentified"),
            "error": inference.get("error", "Invalid crop photo."),
            "suggestion": "Could not identify crop species or valid leaf foliage. Please upload a clear photo of crop leaves."
        }

    crop_name = inference["crop_species"]
    disease_key = inference["primary_disease"]

    crop_rag = CROP_SPECIFIC_RAG_STORE.get(crop_name)
    if disease_key == "Healthy Foliage":
        rag_info = {
            "symptoms": "No disease symptoms were identified by the classifier.",
            "causes": "",
            "chemical": [],
            "organic": [],
            "preventive": [],
            "sources": []
        }
        qwen_explanation = ""
    else:
        rag_info = crop_rag.get(disease_key) if crop_rag else None
        if rag_info is None:
            rag_info = {
                "symptoms": "The model predicted this disease; confirm the symptoms on the plant before treatment.",
                "causes": "",
                "chemical": [],
                "organic": [],
                "preventive": [],
                "sources": []
            }

        recommendation_context = (
            f"Crop: {crop_name}. Model-predicted disease: {disease_key}. "
            f"Model confidence: {inference['confidence']}%. "
            f"Image quality: {inference['image_quality']}. "
            f"Verified symptoms: {rag_info['symptoms']}. "
            f"Verified chemical guidance: {rag_info['chemical']}. "
            f"Verified organic guidance: {rag_info['organic']}."
        )
        qwen_explanation = query_ollama_qwen(
            (
                f"Give a concise, cautious treatment plan for the model-predicted "
                f"{disease_key} on {crop_name}. If confidence is low, say the "
                "diagnosis is preliminary. Prefer practical non-chemical steps. "
                "Do not invent pesticide names, doses, or verified sources; if "
                "no verified treatment is provided, advise expert confirmation."
            ),
            recommendation_context
        )

    guidance_missing = disease_key != "Healthy Foliage" and not rag_info["sources"]
    return {
        "status": "success",
        "crop_name": crop_name,
        "crop_species": crop_name,
        "health_status": "Healthy" if disease_key == "Healthy Foliage" else "Diseased",
        "disease_name": disease_key,
        "disease": disease_key,
        "confidence": inference["confidence"],
        "primary_classifier_result": inference["primary_disease"],
        "secondary_classifier_result": inference["secondary_disease"],
        "needs_expert_verification": inference["needs_manual_verification"] or guidance_missing,
        "confidence_notes": inference.get("confidence_notes", ""),
        "recommendation_notes": (
            "No verified crop-specific treatment guidance is available for this predicted disease. "
            "Use the interim precautions below and confirm the diagnosis before applying pesticides."
            if guidance_missing else ""
        ),
        "interim_recommendations": (
            [
                "Separate visibly affected plants from healthy plants where practical.",
                "Remove badly affected leaves using clean tools; do not compost diseased material.",
                "Avoid overhead watering and improve airflow around plants.",
                "Confirm the disease with a local agricultural expert before applying pesticides."
            ]
            if guidance_missing else []
        ),
        "top_predictions": inference["top_predictions"],
        "severity": "No disease detected" if disease_key == "Healthy Foliage" else (
            f"High Risk ({inference['image_stats']['brown_lesion_ratio']} leaf damage)"
            if rag_info["sources"] else "Needs expert verification"
        ),
        "affected_area": inference['image_stats']['brown_lesion_ratio'],
        "symptoms": rag_info["symptoms"],
        "possible_causes": rag_info["causes"],
        "chemical_management": rag_info["chemical"],
        "organic_management": rag_info["organic"],
        "preventive_measures": rag_info["preventive"],
        "rag_sources": rag_info["sources"],
        "qwen_ai_explanation": qwen_explanation,
        "image_stats": inference["image_stats"],
        "model_store_location": MODEL_BASE_DIR,
        "processing_time_ms": round((time.time() - start_t) * 1000, 2)
    }
