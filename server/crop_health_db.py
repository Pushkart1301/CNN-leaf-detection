import os
import sqlite3
import time
import json
import random
from typing import Dict, Any, List, Optional

DB_FILE = r"D:\mini project learning\agriculture AI\agriculture model for AI crop doctor tab\cache\crop_health.db"

def get_db_connection():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

FARMS_SEED = [
    {"farm_id": "FARM-01", "farm_name": "Vellore Main Precision Farm", "location_gps": "12.9165 N, 79.1325 E", "total_acre": 12.5, "soil_type": "Red Loamy Soil", "water_source": "Borewell & Drip Irrigation"},
    {"farm_id": "FARM-02", "farm_name": "Kanchipuram Agro Park", "location_gps": "12.8342 N, 79.7036 E", "total_acre": 25.0, "soil_type": "Clay Loam", "water_source": "River Palar Canal"},
    {"farm_id": "FARM-03", "farm_name": "Thanjavur Rice Delta Belt", "location_gps": "10.7870 N, 79.1378 E", "total_acre": 40.0, "soil_type": "Alluvial Delta Soil", "water_source": "Kaveri Canal Mesh"},
    {"farm_id": "FARM-04", "farm_name": "Madurai Horticulture Zone", "location_gps": "9.9252 N, 78.1198 E", "total_acre": 18.0, "soil_type": "Black Cotton Soil", "water_source": "Vaigai Reservoir"},
    {"farm_id": "FARM-05", "farm_name": "Coimbatore Cotton & Grain Ranch", "location_gps": "11.0168 N, 76.9558 E", "total_acre": 30.0, "soil_type": "Red Sandy Loam", "water_source": "Borewell Drip Network"}
]

CROPS_CATALOG = [
    {"name": "Rice (Paddy)", "variety": "ADT 54", "image": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600", "duration": 120, "diseases": ["Healthy Foliage", "Brown Spot", "Rice Blast", "Bacterial Leaf Blight"]},
    {"name": "Tomato", "variety": "Arka Rakshak", "image": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=600", "duration": 90, "diseases": ["Healthy Foliage", "Early Blight", "Late Blight", "Leaf Curl Virus"]},
    {"name": "Potato", "variety": "Kufri Jyoti", "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600", "duration": 100, "diseases": ["Healthy Foliage", "Late Blight", "Black Scurf", "Common Scab"]},
    {"name": "Maize (Corn)", "variety": "Co 6 Hybrid", "image": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=600", "duration": 105, "diseases": ["Healthy Foliage", "Fall Armyworm", "Turcicum Leaf Blight", "Common Rust"]},
    {"name": "Cotton", "variety": "MCU 5", "image": "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=600", "duration": 150, "diseases": ["Healthy Foliage", "American Bollworm", "Bacterial Blight", "Verticillium Wilt"]},
    {"name": "Chilli", "variety": "K1 Hybrid", "image": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600", "duration": 130, "diseases": ["Healthy Foliage", "Anthracnose Fruit Rot", "Chilli Leaf Curl", "Powdery Mildew"]},
    {"name": "Wheat", "variety": "HD 2967", "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600", "duration": 115, "diseases": ["Healthy Foliage", "Stem Rust Ug99", "Yellow Rust", "Loose Smut"]},
    {"name": "Sugarcane", "variety": "Co 86032", "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600", "duration": 360, "diseases": ["Healthy Foliage", "Red Rot", "Smut", "Wilt"]}
]

def init_crop_health_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id TEXT UNIQUE NOT NULL,
        farm_name TEXT NOT NULL,
        location_gps TEXT,
        total_acre REAL DEFAULT 5.0,
        soil_type TEXT DEFAULT 'Red Loamy',
        water_source TEXT DEFAULT 'Borewell & Canal',
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id TEXT UNIQUE NOT NULL,
        farm_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        crop_type TEXT,
        plant_count INTEGER DEFAULT 100,
        spacing_m REAL DEFAULT 0.5,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id TEXT UNIQUE NOT NULL,
        image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600',
        farm_name TEXT NOT NULL DEFAULT 'Vellore Main Farm',
        field_name TEXT NOT NULL DEFAULT 'Field A',
        block_name TEXT NOT NULL DEFAULT 'Block 1',
        row_number INTEGER NOT NULL DEFAULT 1,
        crop_name TEXT NOT NULL,
        variety TEXT,
        plant_age_days INTEGER DEFAULT 30,
        planting_date TEXT,
        expected_harvest_date TEXT,
        gps_lat REAL DEFAULT 12.9165,
        gps_lon REAL DEFAULT 79.1325,
        health_status TEXT DEFAULT 'Healthy',
        overall_health_score REAL DEFAULT 92.0,
        leaf_health REAL DEFAULT 90.0,
        stem_health REAL DEFAULT 94.0,
        fruit_health REAL DEFAULT 95.0,
        root_health REAL DEFAULT 90.0,
        flower_health REAL DEFAULT 92.0,
        growth_score REAL DEFAULT 91.0,
        stress_score REAL DEFAULT 10.0,
        disease_score REAL DEFAULT 5.0,
        recovery_score REAL DEFAULT 95.0,
        nutrition_score REAL DEFAULT 88.0,
        water_score REAL DEFAULT 90.0,
        disease_status TEXT DEFAULT 'Healthy Foliage',
        severity TEXT DEFAULT 'Low Risk',
        treatment_notes TEXT DEFAULT 'Routine NPK applied',
        farmer_notes TEXT DEFAULT 'Observed healthy canopy',
        doctor_notes TEXT DEFAULT 'No pathogen detected',
        yield_prediction_kg REAL DEFAULT 15.5,
        economic_cost_inr REAL DEFAULT 450.0,
        economic_income_inr REAL DEFAULT 1850.0,
        is_favorite INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS plant_health_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id TEXT NOT NULL,
        day_number INTEGER DEFAULT 1,
        scan_date TEXT NOT NULL,
        image_url TEXT,
        disease_name TEXT,
        severity TEXT,
        health_score REAL,
        leaf_health REAL,
        stem_health REAL,
        fruit_health REAL,
        root_health REAL,
        ai_summary TEXT,
        farmer_notes TEXT,
        doctor_notes TEXT,
        weather_temp_c REAL DEFAULT 28.5,
        weather_humidity_pct REAL DEFAULT 65.0,
        weather_rain_mm REAL DEFAULT 0.0,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS treatment_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id TEXT NOT NULL,
        treatment_date TEXT NOT NULL,
        medicine_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        spraying_method TEXT,
        applied_by TEXT DEFAULT 'Farmer',
        outcome TEXT DEFAULT 'Ongoing',
        notes TEXT,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id TEXT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        user_name TEXT DEFAULT 'System/Farmer',
        timestamp TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS version_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id TEXT NOT NULL,
        field_changed TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by TEXT DEFAULT 'Farmer',
        reason TEXT DEFAULT 'Manual update',
        timestamp TEXT NOT NULL
    )
    """)

    conn.commit()

    # Seed 65 Production Sample Records across 5 Farms & 18 Fields if database has fewer than 20 records
    cursor.execute("SELECT COUNT(*) FROM plants WHERE is_deleted = 0")
    count = cursor.fetchone()[0]

    if count < 20:
        now = time.strftime("%Y-%m-%d %H:%M:%S")

        # Seed Farms
        for f in FARMS_SEED:
            cursor.execute("INSERT OR IGNORE INTO farms (farm_id, farm_name, location_gps, total_acre, soil_type, water_source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           (f["farm_id"], f["farm_name"], f["location_gps"], f["total_acre"], f["soil_type"], f["water_source"], now))

        # Generate 65 Plant Records
        statuses = ["Healthy", "Healthy", "Healthy", "Warning", "Critical", "Recovered", "Harvested"]
        severities = ["Low Risk", "Low Risk", "Moderate Risk", "High Risk", "Completed"]

        for i in range(1, 66):
            pid = f"PLANT-{i:03d}"
            farm = FARMS_SEED[(i - 1) % len(FARMS_SEED)]
            field_name = f"Field {chr(65 + ((i - 1) % 4))}"
            block_name = f"Block {((i - 1) % 3) + 1}"
            row_num = ((i - 1) % 5) + 1
            crop = CROPS_CATALOG[(i - 1) % len(CROPS_CATALOG)]

            status = statuses[(i - 1) % len(statuses)]
            score = 95.0 if status == "Healthy" else (78.0 if status == "Warning" else (56.0 if status == "Critical" else 88.0))
            disease = crop["diseases"][0] if status in ["Healthy", "Harvested"] else crop["diseases"][((i - 1) % (len(crop["diseases"]) - 1)) + 1]
            severity = "Low Risk" if status in ["Healthy", "Recovered"] else ("Moderate Risk" if status == "Warning" else "High Risk")

            lat = 12.9165 + (i * 0.0012)
            lon = 79.1325 + (i * 0.0015)

            cursor.execute("""
            INSERT OR IGNORE INTO plants (
                plant_id, image_url, farm_name, field_name, block_name, row_number, crop_name, variety, plant_age_days, planting_date, expected_harvest_date,
                gps_lat, gps_lon, health_status, overall_health_score, leaf_health, stem_health, fruit_health, root_health, flower_health,
                growth_score, stress_score, disease_score, recovery_score, nutrition_score, water_score, disease_status, severity,
                treatment_notes, farmer_notes, doctor_notes, yield_prediction_kg, economic_cost_inr, economic_income_inr, is_favorite, is_pinned,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pid, crop["image"], farm["farm_name"], field_name, block_name, row_num, crop["name"], crop["variety"],
                35 + (i % 40), "2026-05-15", "2026-09-30", lat, lon, status, score,
                score - 2, score + 1, score - 1, score + 2, score,
                score, 100 - score, 100 - score, score + 3, score - 3, score + 1,
                disease, severity, f"Applied scheduled bio-fertilizer for {crop['name']}",
                f"Plant #{i} canopy height {30 + (i % 25)}cm, vigorous leaf growth",
                f"No acute pathogen spread detected on {pid}",
                15.0 + (i * 0.4), 400.0 + (i * 10), 1800.0 + (i * 50),
                1 if i % 4 == 0 else 0, 1 if i % 5 == 0 else 0, now, now
            ))

            # Add Timeline Scans (5 timeline scans per plant = 325 total timeline scans)
            for t_day in range(1, 6):
                scan_date = f"2026-06-{(t_day * 5):02d}"
                cursor.execute("""
                INSERT INTO plant_health_timeline (
                    plant_id, day_number, scan_date, image_url, disease_name, severity, health_score, leaf_health, stem_health, fruit_health, root_health,
                    ai_summary, farmer_notes, doctor_notes, weather_temp_c, weather_humidity_pct, weather_rain_mm, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pid, t_day * 7, scan_date, crop["image"], disease, severity, score,
                    score - 2, score + 1, score - 1, score + 2,
                    f"Day #{t_day*7} AI Scan: {crop['name']} health index {score}%",
                    f"Farmer check day {t_day*7}", f"Doctor evaluation: {disease} status clear",
                    28.5 + (t_day * 0.4), 65.0 - t_day, 0.5 * t_day, now
                ))

            # Add Treatments
            cursor.execute("""
            INSERT INTO treatment_records (plant_id, treatment_date, medicine_name, dosage, spraying_method, applied_by, outcome, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (pid, "2026-07-05", "Neem Oil 10,000 PPM + NPK 19-19-19", "5ml/L + 5g/L", "Foliar Knapsack Spray", "Farmer", "Optimal", "Scheduled preventive spray", now))

            # Add Audit Log
            cursor.execute("INSERT INTO audit_logs (plant_id, action, details, timestamp) VALUES (?, 'CREATE', ?, ?)",
                           (pid, f"Seeded Production DHR Record for {pid} ({crop['name']})", now))

        conn.commit()

    conn.close()
    print("[CropHealth DB] Production Database Initialized with 65 Plant Records, 325 Timelines, & 5 Farms!")

def get_all_plants(
    search: str = "",
    filter_status: str = "ALL",
    farm_name: str = "ALL",
    field_name: str = "ALL",
    sort_by: str = "newest",
    page: int = 1,
    per_page: int = 100
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM plants WHERE is_deleted = 0"
    params = []
    
    if search:
        query += " AND (plant_id LIKE ? OR crop_name LIKE ? OR variety LIKE ? OR field_name LIKE ? OR farm_name LIKE ? OR disease_status LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern, pattern, pattern])

    if filter_status != "ALL":
        if filter_status == "HEALTHY":
            query += " AND health_status = 'Healthy'"
        elif filter_status == "WARNING":
            query += " AND health_status = 'Warning'"
        elif filter_status == "CRITICAL":
            query += " AND health_status = 'Critical'"
        elif filter_status == "RECOVERED":
            query += " AND health_status = 'Recovered'"
        elif filter_status == "HARVESTED":
            query += " AND health_status = 'Harvested'"
        elif filter_status == "FAVORITES":
            query += " AND is_favorite = 1"
        elif filter_status == "PINNED":
            query += " AND is_pinned = 1"

    if farm_name != "ALL":
        query += " AND farm_name = ?"
        params.append(farm_name)

    if field_name != "ALL":
        query += " AND field_name = ?"
        params.append(field_name)

    if sort_by == "health_desc":
        query += " ORDER BY overall_health_score DESC"
    elif sort_by == "health_asc":
        query += " ORDER BY overall_health_score ASC"
    elif sort_by == "age_desc":
        query += " ORDER BY plant_age_days DESC"
    else:
        query += " ORDER BY is_pinned DESC, id DESC"

    count_cursor = conn.cursor()
    count_cursor.execute(f"SELECT COUNT(*) FROM ({query})", params)
    total_count = count_cursor.fetchone()[0]

    query += " LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    plants = [dict(row) for row in rows]

    conn.close()
    return {
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "plants": plants
    }

def get_plant_medical_record(plant_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM plants WHERE plant_id = ? AND is_deleted = 0", (plant_id,))
    plant_row = cursor.fetchone()
    if not plant_row:
        conn.close()
        return None

    plant = dict(plant_row)

    cursor.execute("SELECT * FROM plant_health_timeline WHERE plant_id = ? ORDER BY day_number ASC", (plant_id,))
    timeline = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM treatment_records WHERE plant_id = ? ORDER BY id DESC", (plant_id,))
    treatments = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM version_history WHERE plant_id = ? ORDER BY id DESC LIMIT 20", (plant_id,))
    history = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "plant": plant,
        "timeline": timeline,
        "treatments": treatments,
        "version_history": history
    }

def bulk_create_plants(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Bulk Create Plants Handler"""
    created_ids = []
    for r in records:
        res = create_plant_record(r)
        if res.get("plant_id"):
            created_ids.append(res["plant_id"])
    return {"status": "success", "count": len(created_ids), "created_ids": created_ids}

def bulk_delete_plants(plant_ids: List[str]) -> Dict[str, Any]:
    """Bulk Soft Delete Plants Handler"""
    for pid in plant_ids:
        soft_delete_plant_record(pid)
    return {"status": "success", "count": len(plant_ids)}

def compare_plants_dhr(plant_id_a: str, plant_id_b: str) -> Dict[str, Any]:
    """Side-by-side DHR comparison for Plant A vs Plant B"""
    rec_a = get_plant_medical_record(plant_id_a)
    rec_b = get_plant_medical_record(plant_id_b)
    return {
        "status": "success",
        "plant_a": rec_a,
        "plant_b": rec_b,
        "comparison_summary": f"Comparing {plant_id_a} vs {plant_id_b}"
    }

def create_plant_record(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    new_id_seq = int(time.time() * 1000) % 1000000
    plant_id = data.get("plant_id") or f"PLANT-{new_id_seq}"
    now = time.strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    INSERT INTO plants (
        plant_id, image_url, farm_name, field_name, block_name, row_number, crop_name, variety, plant_age_days, planting_date, expected_harvest_date,
        gps_lat, gps_lon, health_status, overall_health_score, leaf_health, stem_health, fruit_health, root_health, flower_health,
        growth_score, stress_score, disease_score, recovery_score, nutrition_score, water_score, disease_status, severity,
        treatment_notes, farmer_notes, doctor_notes, yield_prediction_kg, economic_cost_inr, economic_income_inr, is_favorite, is_pinned,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plant_id,
        data.get("image_url", "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600"),
        data.get("farm_name", "Vellore Main Farm"),
        data.get("field_name", "Field A"),
        data.get("block_name", "Block 1"),
        int(data.get("row_number", 1)),
        data.get("crop_name", "New Crop"),
        data.get("variety", "Standard"),
        int(data.get("plant_age_days", 30)),
        data.get("planting_date", time.strftime("%Y-%m-%d")),
        data.get("expected_harvest_date", time.strftime("%Y-%m-%d")),
        float(data.get("gps_lat", 12.9165)),
        float(data.get("gps_lon", 79.1325)),
        data.get("health_status", "Healthy"),
        float(data.get("overall_health_score", 90.0)),
        float(data.get("leaf_health", 90.0)),
        float(data.get("stem_health", 92.0)),
        float(data.get("fruit_health", 92.0)),
        float(data.get("root_health", 90.0)),
        float(data.get("flower_health", 90.0)),
        float(data.get("growth_score", 90.0)),
        float(data.get("stress_score", 10.0)),
        float(data.get("disease_score", 5.0)),
        float(data.get("recovery_score", 95.0)),
        float(data.get("nutrition_score", 88.0)),
        float(data.get("water_score", 90.0)),
        data.get("disease_status", "Healthy Foliage"),
        data.get("severity", "Low Risk"),
        data.get("treatment_notes", "Routine check"),
        data.get("farmer_notes", ""),
        data.get("doctor_notes", "No anomaly"),
        float(data.get("yield_prediction_kg", 15.0)),
        float(data.get("economic_cost_inr", 400.0)),
        float(data.get("economic_income_inr", 1800.0)),
        1 if data.get("is_favorite") else 0,
        1 if data.get("is_pinned") else 0,
        now, now
    ))

    cursor.execute("""
    INSERT INTO plant_health_timeline (
        plant_id, day_number, scan_date, image_url, disease_name, severity, health_score, leaf_health, stem_health, fruit_health, root_health,
        ai_summary, farmer_notes, doctor_notes, created_at
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plant_id, time.strftime("%Y-%m-%d"),
        data.get("image_url", "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600"),
        data.get("disease_status", "Healthy Foliage"), data.get("severity", "Low Risk"),
        float(data.get("overall_health_score", 90.0)), float(data.get("leaf_health", 90.0)),
        float(data.get("stem_health", 92.0)), float(data.get("fruit_health", 92.0)), float(data.get("root_health", 90.0)),
        "Initial DHR registered", data.get("farmer_notes", ""), data.get("doctor_notes", ""), now
    ))

    cursor.execute("INSERT INTO audit_logs (plant_id, action, details, timestamp) VALUES (?, 'CREATE', ?, ?)",
                   (plant_id, f"Created new DHR for {plant_id} ({data.get('crop_name')})", now))

    conn.commit()
    conn.close()
    return {"status": "success", "plant_id": plant_id}

def update_plant_record(plant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM plants WHERE plant_id = ? AND is_deleted = 0", (plant_id,))
    old_row = cursor.fetchone()
    if not old_row:
        conn.close()
        return {"status": "error", "message": "Plant ID not found"}

    old_dict = dict(old_row)
    now = time.strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    UPDATE plants SET
        crop_name=?, variety=?, image_url=?, farm_name=?, field_name=?, block_name=?, row_number=?, plant_age_days=?,
        health_status=?, overall_health_score=?, leaf_health=?, stem_health=?, fruit_health=?, root_health=?,
        disease_status=?, severity=?, treatment_notes=?, farmer_notes=?, doctor_notes=?, yield_prediction_kg=?,
        is_favorite=?, is_pinned=?, is_archived=?, updated_at=?
    WHERE plant_id=? AND is_deleted=0
    """, (
        data.get("crop_name", old_dict["crop_name"]),
        data.get("variety", old_dict["variety"]),
        data.get("image_url", old_dict.get("image_url", "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600")),
        data.get("farm_name", old_dict["farm_name"]),
        data.get("field_name", old_dict["field_name"]),
        data.get("block_name", old_dict["block_name"]),
        int(data.get("row_number", old_dict["row_number"])),
        int(data.get("plant_age_days", old_dict["plant_age_days"])),
        data.get("health_status", old_dict["health_status"]),
        float(data.get("overall_health_score", old_dict["overall_health_score"])),
        float(data.get("leaf_health", old_dict["leaf_health"])),
        float(data.get("stem_health", old_dict["stem_health"])),
        float(data.get("fruit_health", old_dict["fruit_health"])),
        float(data.get("root_health", old_dict["root_health"])),
        data.get("disease_status", old_dict["disease_status"]),
        data.get("severity", old_dict["severity"]),
        data.get("treatment_notes", old_dict["treatment_notes"]),
        data.get("farmer_notes", old_dict["farmer_notes"]),
        data.get("doctor_notes", old_dict["doctor_notes"]),
        float(data.get("yield_prediction_kg", old_dict["yield_prediction_kg"])),
        1 if data.get("is_favorite") else 0,
        1 if data.get("is_pinned") else 0,
        1 if data.get("is_archived") else 0,
        now,
        plant_id
    ))

    conn.commit()
    conn.close()
    return {"status": "success", "plant_id": plant_id}

def soft_delete_plant_record(plant_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("UPDATE plants SET is_deleted = 1, updated_at = ? WHERE plant_id = ?", (now, plant_id))
    conn.commit()
    conn.close()
    return {"status": "success", "plant_id": plant_id}

def restore_plant_record(plant_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("UPDATE plants SET is_deleted = 0, updated_at = ? WHERE plant_id = ?", (now, plant_id))
    conn.commit()
    conn.close()
    return {"status": "success", "plant_id": plant_id}

def add_timeline_scan_entry(plant_id: str, scan_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("SELECT COUNT(*) FROM plant_health_timeline WHERE plant_id = ?", (plant_id,))
    day_count = cursor.fetchone()[0] + 1
    cursor.execute("""
    INSERT INTO plant_health_timeline (
        plant_id, day_number, scan_date, image_url, disease_name, severity, health_score, leaf_health, stem_health, fruit_health, root_health,
        ai_summary, farmer_notes, doctor_notes, weather_temp_c, weather_humidity_pct, weather_rain_mm, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plant_id, day_count, time.strftime("%Y-%m-%d"),
        scan_data.get("image_url", "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600"),
        scan_data.get("disease_name", "Healthy Foliage"), scan_data.get("severity", "Low Risk"),
        float(scan_data.get("health_score", 90.0)), float(scan_data.get("leaf_health", 90.0)),
        float(scan_data.get("stem_health", 92.0)), float(scan_data.get("fruit_health", 92.0)), float(scan_data.get("root_health", 90.0)),
        scan_data.get("ai_summary", "Scan timeline updated"), scan_data.get("farmer_notes", ""), scan_data.get("doctor_notes", ""),
        float(scan_data.get("weather_temp_c", 28.5)), float(scan_data.get("weather_humidity_pct", 65.0)), float(scan_data.get("weather_rain_mm", 0.0)), now
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "plant_id": plant_id, "day_number": day_count}

def calculate_surrounding_risk(plant_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM plants WHERE plant_id = ? AND is_deleted = 0", (plant_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        return {"status": "error", "message": "Target plant not found"}

    target_dict = dict(target)
    cursor.execute("SELECT * FROM plants WHERE plant_id != ? AND is_deleted = 0 LIMIT 10", (plant_id,))
    neighbors = [dict(r) for r in cursor.fetchall()]
    risk_analysis = []

    for n in neighbors:
        lat_diff = (n["gps_lat"] - target_dict["gps_lat"]) * 111000
        lon_diff = (n["gps_lon"] - target_dict["gps_lon"]) * 111000
        distance_m = max(1.0, round((lat_diff**2 + lon_diff**2)**0.5, 2))

        wind_prob = round(max(0.01, min(0.95, (1.0 / (1.0 + 0.1 * distance_m)) * (n["disease_score"] / 20.0))), 2)
        risk_level = "CRITICAL" if wind_prob > 0.6 else "WARNING" if wind_prob > 0.3 else "LOW"
        risk_analysis.append({
            "neighbor_plant_id": n["plant_id"],
            "crop_name": n["crop_name"],
            "distance_m": distance_m,
            "wind_spread_prob_pct": round(wind_prob * 100, 1),
            "overall_risk_level": risk_level
        })

    conn.close()
    return {
        "plant_id": plant_id,
        "crop_name": target_dict["crop_name"],
        "field_name": target_dict["field_name"],
        "surrounding_risks": risk_analysis
    }

def get_audit_logs() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")
    rows = cursor.fetchall()
    logs = [dict(row) for row in rows]
    conn.close()
    return logs

if __name__ == "__main__":
    init_crop_health_db()
