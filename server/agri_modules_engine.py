import os
import time
import json
import urllib.request
from typing import Dict, Any, List, Optional

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

def get_satellite_analytics_data() -> Dict[str, Any]:
    """AI Satellite Farm Observation Center Data"""
    return {
        "status": "success",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "field_id": "FIELD-VELLORE-01",
        "area_acres": 4.5,
        "spectral_indexes": {
            "ndvi": 0.78,
            "ndre": 0.64,
            "evi": 0.71,
            "savi": 0.68,
            "moisture_index": 0.62,
            "surface_temp_c": 27.4
        },
        "vegetation_health": "Optimal Green Canopy (High Biomass)",
        "biomass_estimation_ton_per_ha": 4.2,
        "water_stress_pct": 14.2,
        "drought_risk": "Low",
        "flood_risk": "Low",
        "crop_growth_stage": "Mid-Vegetative Tillering (Day 45)",
        "ai_change_detection": "Canopy cover increased by +12.4% over last 14 days.",
        "ai_recommendation": "Maintain 3-5cm standing water in paddy block #1; no water stress detected."
    }

def get_soil_laboratory_data() -> Dict[str, Any]:
    """AI Soil Laboratory Stratum Data"""
    return {
        "status": "success",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "npk_metrics": {
            "nitrogen_kg_ha": 140,
            "phosphorus_kg_ha": 45,
            "potassium_kg_ha": 210,
            "status": "Balanced NPK Ratio"
        },
        "ph_level": 6.8,
        "ph_status": "Slightly Acidic to Neutral (Optimal for Paddy & Tomato)",
        "organic_carbon_pct": 0.85,
        "cec_meq_100g": 18.5,
        "soil_texture": "Red Loamy Clay Soil",
        "micronutrients": {
            "zinc_ppm": 1.2,
            "iron_ppm": 4.5,
            "boron_ppm": 0.6,
            "status": "Zinc Mild Deficiency Detected"
        },
        "root_zone_moisture_pct": 42.5,
        "ai_soil_doctor_advice": "Apply Zinc Sulphate @ 10kg/acre during next split fertilizer application."
    }

def get_seed_intelligence_data() -> Dict[str, Any]:
    """AI Seed Intelligence Platform Data"""
    return {
        "status": "success",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "top_seeds": [
            {
                "rank": 1,
                "crop": "Rice (Paddy)",
                "variety": "ADT 54 Certified High-Yield",
                "climate_match_pct": 98.4,
                "germination_probability_pct": 96.0,
                "yield_potential_q_acre": 28.5,
                "days_to_harvest": 115,
                "disease_resistance": "Resistant to Blast & Brown Spot",
                "government_subsidy_eligible": True,
                "market_demand": "High (Mandi Rate ₹2,183/Q)"
            },
            {
                "rank": 2,
                "crop": "Tomato",
                "variety": "Arka Rakshak F1 Hybrid",
                "climate_match_pct": 92.1,
                "germination_probability_pct": 94.0,
                "yield_potential_q_acre": 22.0,
                "days_to_harvest": 90,
                "disease_resistance": "Triple Resistance to ToLCV, BW & EB",
                "government_subsidy_eligible": True,
                "market_demand": "Very High"
            }
        ]
    }

def get_fertilizer_planner_data() -> Dict[str, Any]:
    """AI Nutrient Planning System Data"""
    return {
        "status": "success",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "crop": "Rice (Paddy - ADT 54)",
        "current_stage": "Stage 2: Active Tillering (Day 45)",
        "recommended_dosage": {
            "urea_kg_acre": 35,
            "dap_kg_acre": 20,
            "mop_kg_acre": 15,
            "zinc_sulphate_kg_acre": 10
        },
        "cost_per_acre_inr": 1450,
        "gantt_schedule": [
            {"stage": "Basal (Day 0)", "status": "Completed", "date": "2026-06-10"},
            {"stage": "Active Tillering (Day 45)", "status": "Scheduled Today", "date": "2026-07-25"},
            {"stage": "Panicle Initiation (Day 75)", "status": "Pending", "date": "2026-08-24"}
        ],
        "organic_alternative": "Foliar spray of Panchagavya 3% @ 300L/acre.",
        "ai_warning": "Do not apply excess Urea in wet soil conditions to prevent leeching."
    }

def get_irrigation_command_data() -> Dict[str, Any]:
    """AI Smart Irrigation Command Center Data"""
    return {
        "status": "success",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "soil_moisture_pct": 42.0,
        "evapotranspiration_et0_mm_day": 4.8,
        "pump_status": "Auto Standby (Solar Pump Operational)",
        "next_auto_cycle": "Tomorrow 05:30 AM (Duration: 45 Mins)",
        "water_saved_liters_today": 3400,
        "crop_water_stress_index": "Low (0.12 - Healthy)",
        "weekly_water_budget_m3": 120,
        "ai_recommendation": "Delay evening pumping cycle; 4.2mm natural rainfall expected this weekend."
    }
