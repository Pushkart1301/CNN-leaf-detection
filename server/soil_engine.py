import os
import time
import json
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, Query
from pydantic import BaseModel

# Assume we have a SQLite helper (similar to crop_health_db) for soil samples
from soil_db import (
    init_soil_db,
    get_all_soil_samples,
    create_soil_sample,
    get_soil_sample_by_id,
    update_soil_record,
    soft_delete_soil_sample,
    duplicate_soil_sample,
    get_soil_history,
    get_soil_audit_logs,
)

# AI utilities (Ollama, RAG, etc.)
from soil_ai_agents import (
    run_soil_doctor_agent,
    run_nutrient_agent,
    run_fertilizer_agent,
    run_water_agent,
    run_risk_prediction_agent,
)

# ---------- Data Models ----------
class SoilSampleSchema(BaseModel):
    farm_name: str
    farm_id: str
    field_name: str
    area_ha: float
    coordinates: str  # WKT POINT
    village: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    crop: Optional[str] = ""
    season: Optional[str] = ""
    test_date: Optional[str] = None
    next_test_date: Optional[str] = None
    soil_type: Optional[str] = None
    texture: Optional[str] = None
    moisture: Optional[float] = None
    temperature: Optional[float] = None
    ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    calcium: Optional[float] = None
    magnesium: Optional[float] = None
    sulfur: Optional[float] = None
    iron: Optional[float] = None
    zinc: Optional[float] = None
    copper: Optional[float] = None
    manganese: Optional[float] = None
    boron: Optional[float] = None
    ec: Optional[float] = None
    salinity: Optional[float] = None
    bulk_density: Optional[float] = None
    microbial_activity: Optional[float] = None
    compaction: Optional[float] = None
    water_holding_capacity: Optional[float] = None
    notes: Optional[Dict[str, Any]] = {}

# ---------- Helper Functions ----------
def calculate_overall_score(sample: Dict[str, Any]) -> float:
    """Simple deterministic soil health score.
    In production replace with a ML model.
    """
    weight = {
        "ph": 0.15,
        "nitrogen": 0.2,
        "phosphorus": 0.15,
        "potassium": 0.2,
        "organic_carbon": 0.1,
        "moisture": 0.1,
        "salinity": 0.1,
    }
    score = 0.0
    total_w = 0.0
    for key, w in weight.items():
        val = sample.get(key)
        if val is None:
            continue
        if key == "ph":
            norm = max(0, min(1, 1 - abs(val - 6.5) / 3))
        elif key == "salinity":
            norm = max(0, min(1, 1 - val / 5))
        else:
            norm = max(0, min(1, val / 100))
        score += norm * w
        total_w += w
    return round(score / total_w * 100, 2) if total_w else 0.0

# ---------- API Endpoints ----------
async def list_soil_samples(search: Optional[str] = Query(""), filter_status: Optional[str] = Query("ALL"), page: int = Query(1), per_page: int = Query(20)) -> Dict[str, Any]:
    return get_all_soil_samples(search, filter_status, page, per_page)

async def create_soil(sample: SoilSampleSchema) -> Dict[str, Any]:
    return create_soil_sample(sample.dict())

async def get_soil(sample_id: str) -> Dict[str, Any]:
    sample = get_soil_sample_by_id(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Soil sample not found")
    return sample

async def update_soil(sample_id: str, sample: SoilSampleSchema) -> Dict[str, Any]:
    return update_soil_record(sample_id, sample.dict())

async def delete_soil(sample_id: str) -> Dict[str, Any]:
    return soft_delete_soil_sample(sample_id)

async def duplicate_soil(sample_id: str) -> Dict[str, Any]:
    return duplicate_soil_sample(sample_id)

async def soil_history(sample_id: str) -> List[Dict[str, Any]]:
    return get_soil_history(sample_id)

async def soil_audit_logs() -> List[Dict[str, Any]]:
    return get_soil_audit_logs()

async def soil_score(sample_id: str) -> Dict[str, Any]:
    sample = get_soil_sample_by_id(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Soil sample not found")
    return {"sample_id": sample_id, "overall_score": calculate_overall_score(sample)}

async def soil_prediction(sample_id: str, horizon: str = Query("30d")) -> Dict[str, Any]:
    sample = get_soil_sample_by_id(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Soil sample not found")
    base = calculate_overall_score(sample)
    factor = {"7d": 1.02, "30d": 1.05, "90d": 1.10, "180d": 1.15, "1y": 1.25}.get(horizon, 1.05)
    return {"sample_id": sample_id, "horizon": horizon, "forecast_score": round(min(100, base * factor), 2)}

async def run_soil_doctor(sample_id: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if sample_id:
        sample = get_soil_sample_by_id(sample_id)
        if not sample:
            raise HTTPException(status_code=404, detail="Soil sample not found")
        data = sample
    elif payload:
        data = payload
    else:
        raise HTTPException(status_code=400, detail="Provide sample_id or payload")
    return run_soil_doctor_agent(data)

__all__ = [
    "list_soil_samples",
    "create_soil",
    "get_soil",
    "update_soil",
    "delete_soil",
    "duplicate_soil",
    "soil_history",
    "soil_audit_logs",
    "soil_score",
    "soil_prediction",
    "run_soil_doctor",
]
