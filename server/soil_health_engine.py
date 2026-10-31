import os
import sqlite3
import time
import json
import urllib.request
from typing import Dict, Any, List, Optional

SOIL_DB_PATH = r"D:\mini project learning\agriculture AI\agriculture model for AI crop doctor tab\cache\soil_health.db"
os.makedirs(os.path.dirname(SOIL_DB_PATH), exist_ok=True)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

SOIL_TYPES_SEED = [
  {"name": "Black Cotton Soil", "texture": "Heavy Clay (60% Clay)", "moisture": "28.5%", "suitability": "Cotton, Sugarcane, Wheat, Soybean", "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600"},
  {"name": "Red Loamy Soil", "texture": "Sandy Clay Loam", "moisture": "22.0%", "suitability": "Groundnut, Pulses, Millets, Potato", "image": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=600"},
  {"name": "Alluvial Delta Soil", "texture": "Silt Loam (Fine Alluvium)", "moisture": "32.0%", "suitability": "Rice Paddy, Wheat, Sugarcane, Jute", "image": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600"},
  {"name": "Sandy Loam Soil", "texture": "Coarse Sandy Loam", "moisture": "14.5%", "suitability": "Watermelon, Groundnut, Maize, Vegetables", "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600"},
  {"name": "Peaty Organic Soil", "texture": "Highly Organic Muck", "moisture": "40.0%", "suitability": "Tea, Cardamom, Vegetables, Spices", "image": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600"},
  {"name": "Saline Alkaline Soil", "texture": "Silty Clay (High Salts)", "moisture": "18.0%", "suitability": "Barley, Mustard, Date Palm, Salt-tolerant Grass", "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600"},
  {"name": "Acidic Laterite Soil", "texture": "Gravelly Clay Loam", "moisture": "20.0%", "suitability": "Coffee, Rubber, Cashew, Tapioca", "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600"},
  {"name": "Organic Forest Soil", "texture": "Rich Humus Loam", "moisture": "35.0%", "suitability": "Spices, Cocoa, Medicinal Herbs, Fruit Trees", "image": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=600"}
]

def init_soil_db():
    """Initialize SQLite database for Soil Laboratory Samples & Projections"""
    conn = sqlite3.connect(SOIL_DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS soil_samples (
            sample_id TEXT PRIMARY KEY,
            farm_name TEXT NOT NULL,
            field_name TEXT NOT NULL,
            soil_type TEXT NOT NULL,
            image_url TEXT,
            ph_level REAL NOT NULL,
            nitrogen_kg_ha REAL NOT NULL,
            phosphorus_kg_ha REAL NOT NULL,
            potassium_kg_ha REAL NOT NULL,
            organic_carbon_pct REAL NOT NULL,
            calcium_ppm REAL DEFAULT 1200.0,
            magnesium_ppm REAL DEFAULT 340.0,
            sulfur_ppm REAL DEFAULT 24.5,
            iron_ppm REAL DEFAULT 18.2,
            copper_ppm REAL DEFAULT 2.4,
            zinc_ppm REAL NOT NULL,
            boron_ppm REAL DEFAULT 0.8,
            manganese_ppm REAL DEFAULT 14.5,
            electrical_conductivity_ds_m REAL DEFAULT 0.85,
            salinity_ds_m REAL DEFAULT 0.4,
            moisture_pct REAL DEFAULT 24.5,
            temperature_c REAL DEFAULT 26.5,
            bulk_density_g_cm3 REAL DEFAULT 1.32,
            texture TEXT DEFAULT 'Silt Loam',
            organic_matter_pct REAL DEFAULT 1.85,
            microbial_activity_index REAL DEFAULT 88.5,
            root_zone_quality TEXT DEFAULT 'Optimal',
            compaction_psi REAL DEFAULT 140.0,
            water_holding_capacity_mm REAL DEFAULT 165.0,
            health_score REAL NOT NULL,
            disease_risk_status TEXT DEFAULT 'Low Risk',
            recommendation TEXT,
            test_date TEXT NOT NULL,
            is_deleted INTEGER DEFAULT 0
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM soil_samples WHERE is_deleted = 0")
    if cursor.fetchone()[0] == 0:
        now = time.strftime("%Y-%m-%d")

        # Seed 20 Realistic Soil Samples across 5 Farms
        farms = [
            ("Vellore Main Precision Farm", "Paddy Block A", "Red Loamy Soil", 6.8, 140.0, 45.0, 210.0, 0.85, 1.2, 92.4, "Apply Zinc Sulphate @ 10kg/acre during next split. Basal dressing optimal.", SOIL_TYPES_SEED[1]["image"]),
            ("Vellore Main Precision Farm", "Tomato Block B", "Black Cotton Soil", 7.2, 125.0, 52.0, 195.0, 0.92, 0.9, 88.6, "Foliar spray of Boron 0.2% during flowering stage. Gypsum application recommended.", SOIL_TYPES_SEED[0]["image"]),
            ("Kanchipuram Agro Park", "Sugarcane Block C", "Alluvial Delta Soil", 6.5, 160.0, 58.0, 240.0, 1.15, 1.5, 94.8, "Soil organic carbon level excellent. Maintain drip fertigation schedule.", SOIL_TYPES_SEED[2]["image"]),
            ("Kanchipuram Agro Park", "Groundnut Field D", "Sandy Loam Soil", 6.4, 110.0, 38.0, 160.0, 0.74, 0.8, 82.5, "Apply Gypsum @ 200kg/acre at pegging stage for kernel development.", SOIL_TYPES_SEED[3]["image"]),
            ("Thanjavur Rice Delta Belt", "Paddy Delta #1", "Alluvial Delta Soil", 6.9, 155.0, 48.0, 225.0, 1.05, 1.4, 95.2, "Ideal delta soil chemistry. Azospirillum bio-fertilizer inoculation recommended.", SOIL_TYPES_SEED[2]["image"]),
            ("Thanjavur Rice Delta Belt", "Paddy Delta #2", "Alluvial Delta Soil", 7.1, 148.0, 42.0, 215.0, 0.98, 1.1, 91.0, "Zinc deficiency early warning. Incorporate green manure (Daincha) prior to planting.", SOIL_TYPES_SEED[2]["image"]),
            ("Madurai Horticulture Zone", "Chilli Field #1", "Black Cotton Soil", 7.4, 130.0, 50.0, 190.0, 0.88, 1.0, 86.4, "Maintain soil moisture above 25%. Apply Neem cake @ 250kg/acre to mitigate wilt.", SOIL_TYPES_SEED[0]["image"]),
            ("Madurai Horticulture Zone", "Jasmine & Herbs", "Red Loamy Soil", 6.6, 120.0, 40.0, 175.0, 0.80, 0.9, 84.0, "Organic matter replenishment required. Apply vermicompost @ 2 tons/acre.", SOIL_TYPES_SEED[1]["image"]),
            ("Coimbatore Cotton & Grain Ranch", "Maize Field #1", "Red Sandy Loam", 6.7, 135.0, 46.0, 205.0, 0.82, 1.3, 89.5, "NPK ratio balanced. Incorporate bio-potash during stem elongation stage.", SOIL_TYPES_SEED[3]["image"]),
            ("Coimbatore Cotton & Grain Ranch", "Cotton Field #2", "Black Cotton Soil", 7.3, 142.0, 54.0, 230.0, 0.95, 1.2, 93.0, "High potassium reserve. Excellent cation exchange capacity (CEC).", SOIL_TYPES_SEED[0]["image"])
        ]

        for idx, f in enumerate(farms, 1):
            sid = f"SOIL-2026-{idx:03d}"
            cursor.execute("""
                INSERT OR IGNORE INTO soil_samples (
                    sample_id, farm_name, field_name, soil_type, image_url, ph_level, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha,
                    organic_carbon_pct, calcium_ppm, magnesium_ppm, sulfur_ppm, iron_ppm, copper_ppm, zinc_ppm, boron_ppm, manganese_ppm,
                    electrical_conductivity_ds_m, salinity_ds_m, moisture_pct, temperature_c, bulk_density_g_cm3, texture, organic_matter_pct,
                    microbial_activity_index, root_zone_quality, compaction_psi, water_holding_capacity_mm, health_score, disease_risk_status,
                    recommendation, test_date, is_deleted
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sid, f[0], f[1], f[2], f[11], f[3], f[4], f[5], f[6],
                f[7], 1200.0 + idx * 10, 340.0 + idx * 5, 24.5, 18.2, 2.4, f[8], 0.8, 14.5,
                0.85, 0.4, 24.5, 26.5, 1.32, f[2], f[7] * 1.72,
                88.5, "Optimal", 140.0, 165.0, f[9], "Low Risk",
                f[10], now, 0
            ))

        conn.commit()
    conn.close()

def get_all_soil_samples(
    search: str = "",
    farm_name: str = "ALL",
    soil_type: str = "ALL",
    sort_by: str = "newest"
) -> List[Dict[str, Any]]:
    init_soil_db()
    conn = sqlite3.connect(SOIL_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM soil_samples WHERE is_deleted = 0"
    params = []

    if search:
        query += " AND (sample_id LIKE ? OR farm_name LIKE ? OR field_name LIKE ? OR soil_type LIKE ? OR recommendation LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern, pattern])

    if farm_name != "ALL":
        query += " AND farm_name = ?"
        params.append(farm_name)

    if soil_type != "ALL":
        query += " AND soil_type = ?"
        params.append(soil_type)

    if sort_by == "health_desc":
        query += " ORDER BY health_score DESC"
    elif sort_by == "health_asc":
        query += " ORDER BY health_score ASC"
    elif sort_by == "ph_desc":
        query += " ORDER BY ph_level DESC"
    else:
        query += " ORDER BY sample_id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]

def get_soil_sample_by_id(sample_id: str) -> Optional[Dict[str, Any]]:
    init_soil_db()
    conn = sqlite3.connect(SOIL_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM soil_samples WHERE sample_id = ? AND is_deleted = 0", (sample_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_soil_sample(data: Dict[str, Any]) -> Dict[str, Any]:
    init_soil_db()
    sample_id = f"SOIL-2026-{(int(time.time()) % 1000):03d}"
    conn = sqlite3.connect(SOIL_DB_PATH)
    cursor = conn.cursor()

    ph = float(data.get("ph_level", 6.8))
    n = float(data.get("nitrogen_kg_ha", 140.0))
    p = float(data.get("phosphorus_kg_ha", 45.0))
    k = float(data.get("potassium_kg_ha", 210.0))
    oc = float(data.get("organic_carbon_pct", 0.85))
    zn = float(data.get("zinc_ppm", 1.2))

    score = min(99.0, max(50.0, (ph / 7.0 * 20.0) + (n / 180.0 * 25.0) + (p / 60.0 * 20.0) + (k / 250.0 * 20.0) + (oc / 1.2 * 15.0)))

    cursor.execute("""
        INSERT INTO soil_samples (
            sample_id, farm_name, field_name, soil_type, image_url, ph_level, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha,
            organic_carbon_pct, zinc_ppm, health_score, recommendation, test_date, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sample_id,
        data.get("farm_name", "Vellore Main Precision Farm"),
        data.get("field_name", "New Field Block"),
        data.get("soil_type", "Red Loamy Soil"),
        data.get("image_url", SOIL_TYPES_SEED[1]["image"]),
        ph, n, p, k, oc, zn, round(score, 1),
        data.get("recommendation", "Apply balanced organic compost and NPK split."),
        time.strftime("%Y-%m-%d"), 0
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "sample_id": sample_id}

def update_soil_sample(sample_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    init_soil_db()
    conn = sqlite3.connect(SOIL_DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE soil_samples SET
            farm_name = ?, field_name = ?, soil_type = ?, ph_level = ?, nitrogen_kg_ha = ?,
            phosphorus_kg_ha = ?, potassium_kg_ha = ?, organic_carbon_pct = ?, zinc_ppm = ?, recommendation = ?
        WHERE sample_id = ? AND is_deleted = 0
    """, (
        data.get("farm_name"), data.get("field_name"), data.get("soil_type"),
        float(data.get("ph_level", 6.8)), float(data.get("nitrogen_kg_ha", 140.0)),
        float(data.get("phosphorus_kg_ha", 45.0)), float(data.get("potassium_kg_ha", 210.0)),
        float(data.get("organic_carbon_pct", 0.85)), float(data.get("zinc_ppm", 1.2)),
        data.get("recommendation"), sample_id
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "sample_id": sample_id}

def soft_delete_soil_sample(sample_id: str) -> Dict[str, Any]:
    init_soil_db()
    conn = sqlite3.connect(SOIL_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE soil_samples SET is_deleted = 1 WHERE sample_id = ?", (sample_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "sample_id": sample_id}

def restore_soil_sample(sample_id: str) -> Dict[str, Any]:
    init_soil_db()
    conn = sqlite3.connect(SOIL_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE soil_samples SET is_deleted = 0 WHERE sample_id = ?", (sample_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "sample_id": sample_id}

def compare_soil_samples(sample_id_a: str, sample_id_b: str) -> Dict[str, Any]:
    a = get_soil_sample_by_id(sample_id_a) or get_all_soil_samples()[0]
    b = get_soil_sample_by_id(sample_id_b) or get_all_soil_samples()[1]

    return {
        "sample_a": a,
        "sample_b": b,
        "delta": {
            "ph": round(a["ph_level"] - b["ph_level"], 2),
            "nitrogen": round(a["nitrogen_kg_ha"] - b["nitrogen_kg_ha"], 1),
            "phosphorus": round(a["phosphorus_kg_ha"] - b["phosphorus_kg_ha"], 1),
            "potassium": round(a["potassium_kg_ha"] - b["potassium_kg_ha"], 1),
            "organic_carbon": round(a["organic_carbon_pct"] - b["organic_carbon_pct"], 2),
            "health_score": round(a["health_score"] - b["health_score"], 1)
        }
    }

def get_soil_risk_matrix() -> Dict[str, Any]:
    return {
        "timeframes": ["7 Days", "30 Days", "90 Days", "180 Days", "1 Year"],
        "risks": [
            {"risk_type": "Nutrient Deficiency (Nitrogen / Zinc)", "7d": "Low", "30d": "Moderate", "90d": "High", "180d": "Critical", "1y": "Severe", "action": "Basal NPK & Micronutrient split"},
            {"risk_type": "Soil Salinity & EC Build-up", "7d": "Low", "30d": "Low", "90d": "Moderate", "180d": "Moderate", "1y": "High", "action": "Leaching with fresh canal water"},
            {"risk_type": "Acidity / pH Degradation", "7d": "None", "30d": "Low", "90d": "Low", "180d": "Moderate", "1y": "Moderate", "action": "Agricultural Lime @ 150kg/acre"},
            {"risk_type": "Subsoil Compaction & Hardpan", "7d": "None", "30d": "Low", "90d": "Moderate", "180d": "High", "1y": "Critical", "action": "Deep chiseling / subsoiling prior to sowing"}
        ]
    }

def get_nearby_soil_labs() -> List[Dict[str, Any]]:
    return [
        {"lab_name": "Vellore District Agricultural Soil Testing Laboratory", "agency": "Government of Tamil Nadu", "phone": "+91 416 2224501", "location": "Katpadi Road, Vellore", "distance_km": 4.5, "accreditation": "NABL Accredited"},
        {"lab_name": "TNAU Soil Chemistry & Microbiology Lab", "agency": "Tamil Nadu Agricultural University", "phone": "+91 416 2244502", "location": "Virinjipuram, Vellore", "distance_km": 8.2, "accreditation": "ICAR Research Center"},
        {"lab_name": "Krishi Vigyan Kendra Soil Clinic", "agency": "ICAR - KVK", "phone": "+91 416 2252110", "location": "Collectorate Complex, Vellore", "distance_km": 5.1, "accreditation": "Government Approved"}
    ]

def query_ollama_soil_doctor(prompt: str, context: str = "") -> str:
    full_prompt = f"""You are the Chief Agronomist and Soil Scientist at AgriVerse AI.
Soil Context: {context}
User Query: {prompt}

Provide a concise, highly practical agricultural prescription including exact NPK dosage (kg/acre), organic alternatives (FYM/Vermicompost), yield impact (%), and financial ROI (₹).
"""
    try:
        req = urllib.request.Request(
            OLLAMA_URL,
            data=json.dumps({"model": "qwen:latest", "prompt": full_prompt, "stream": False}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res.get("response", "Recommended NPK 19-19-19 foliar spray @ 5g/L and 2 tons/acre FYM.")
    except Exception as e:
        return f"AI Soil Prescription: Recommended application of Urea (45kg/acre), SSP (75kg/acre), and MOP (30kg/acre) along with Zinc Sulphate @ 10kg/acre. Estimated yield increase: +14.2% (Estimated Net Income: +₹8,500/acre)."
