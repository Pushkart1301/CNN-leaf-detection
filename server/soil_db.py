import sqlite3
from datetime import datetime

DB_PATH = "soil_intelligence.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_soil_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS soil_samples (
            id TEXT PRIMARY KEY,
            farm_name TEXT NOT NULL,
            farm_id TEXT NOT NULL,
            field_name TEXT NOT NULL,
            area_ha REAL NOT NULL,
            coordinates TEXT,
            village TEXT,
            district TEXT,
            state TEXT,
            crop TEXT,
            season TEXT,
            test_date TEXT,
            next_test_date TEXT,
            soil_type TEXT,
            texture TEXT,
            moisture REAL,
            temperature REAL,
            ph REAL,
            nitrogen REAL,
            phosphorus REAL,
            potassium REAL,
            organic_carbon REAL,
            calcium REAL,
            magnesium REAL,
            sulfur REAL,
            iron REAL,
            zinc REAL,
            copper REAL,
            manganese REAL,
            boron REAL,
            ec REAL,
            salinity REAL,
            bulk_density REAL,
            microbial_activity REAL,
            compaction REAL,
            water_holding_capacity REAL,
            notes TEXT,
            created_at TEXT,
            updated_at TEXT,
            deleted_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_all_soil_samples(search: str = "", filter_status: str = "ALL", page: int = 1, per_page: int = 20):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM soil_samples WHERE 1=1"
    params = []
    if search:
        query += " AND (farm_name LIKE ? OR field_name LIKE ? OR crop LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like, like])
    if filter_status == "DELETED":
        query += " AND deleted_at IS NOT NULL"
    elif filter_status == "ACTIVE":
        query += " AND deleted_at IS NULL"
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([per_page, (page-1)*per_page])
    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_soil_sample(data: dict):
    conn = get_connection()
    c = conn.cursor()
    data_id = data.get("id") or f"soil_{int(datetime.now().timestamp())}"
    now = datetime.utcnow().isoformat()
    placeholders = ",".join(["?" for _ in data])
    columns = ",".join(data.keys())
    c.execute(f"INSERT INTO soil_samples ({columns}, created_at, updated_at) VALUES ({placeholders}, ?, ?)",
              list(data.values()) + [now, now])
    conn.commit()
    conn.close()
    return {"id": data_id, **data, "created_at": now, "updated_at": now}

def get_soil_sample_by_id(sample_id: str):
    conn = get_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM soil_samples WHERE id = ?", (sample_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def update_soil_record(sample_id: str, data: dict):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    set_clause = ", ".join([f"{k} = ?" for k in data])
    params = list(data.values()) + [now, sample_id]
    c.execute(f"UPDATE soil_samples SET {set_clause}, updated_at = ? WHERE id = ?", params)
    conn.commit()
    conn.close()
    return get_soil_sample_by_id(sample_id)

def soft_delete_soil_sample(sample_id: str):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("UPDATE soil_samples SET deleted_at = ? WHERE id = ?", (now, sample_id))
    conn.commit()
    conn.close()
    return {"deleted": True, "id": sample_id}

def duplicate_soil_sample(sample_id: str):
    original = get_soil_sample_by_id(sample_id)
    if not original:
        raise ValueError("Sample not found")
    new_id = f"{sample_id}_dup_{int(datetime.now().timestamp())}"
    original["id"] = new_id
    original.pop("created_at", None)
    original.pop("updated_at", None)
    original.pop("deleted_at", None)
    return create_soil_sample(original)

def get_soil_history(sample_id: str):
    # Placeholder: In real implementation, track changes in a separate audit table.
    return []

def get_soil_audit_logs():
    # Placeholder for audit logs.
    return []

# Initialize DB on import
init_soil_db()
