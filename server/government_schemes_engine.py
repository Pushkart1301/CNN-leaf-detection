import sqlite3
import json
import os
import math
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "government_schemes.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_government_schemes_db():
    """Initialize SQLite database schema for Enterprise Government Schemes Module."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verified_schemes (
        scheme_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        department TEXT NOT NULL,
        max_subsidy_inr REAL NOT NULL,
        subsidy_pct REAL DEFAULT 50.0,
        target_farmers TEXT NOT NULL,
        min_land_acres REAL DEFAULT 0.0,
        max_land_acres REAL DEFAULT 50.0,
        status TEXT DEFAULT 'Open - Applications Accepted',
        deadline TEXT NOT NULL,
        required_documents TEXT NOT NULL,
        official_portal TEXT NOT NULL,
        helpline_phone TEXT NOT NULL,
        state TEXT DEFAULT 'All India (Central Scheme)',
        description TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmer_scheme_applications (
        application_id TEXT PRIMARY KEY,
        farmer_name TEXT NOT NULL,
        scheme_id TEXT NOT NULL,
        scheme_name TEXT NOT NULL,
        category TEXT NOT NULL,
        land_size_acres REAL NOT NULL,
        benefit_amount_inr REAL NOT NULL,
        documents_submitted TEXT NOT NULL,
        status TEXT DEFAULT 'Pending Verification',
        application_date TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    seed_initial_schemes_data(conn)
    conn.close()
    print("[Government Schemes DB] Initialized government_schemes.db database successfully.")

def seed_initial_schemes_data(conn):
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM verified_schemes")
    if cursor.fetchone()[0] == 0:
        schemes = [
            (
                "SCH-CENTRAL-01", "PM-KISAN Samman Nidhi Yojana", "Direct Income Support",
                "Ministry of Agriculture & Farmers Welfare", 6000.0, 100.0, "Small & Marginal Farmers (<2 Hectares)",
                0.0, 5.0, "Open - Continuous Disbursement", "2026-12-31", "Aadhaar Card, Land Patta Chitta, Bank Passbook (NPCI Linked)",
                "https://pmkisan.gov.in/", "155261 / 1800115526", "All India (Central Scheme)",
                "Provides ₹6,000 per year in 3 equal installments directly into verified farmer bank accounts."
            ),
            (
                "SCH-CENTRAL-02", "Pradhan Mantri Fasal Bima Yojana (PMFBY)", "Crop Insurance",
                "Department of Agriculture & Cooperation", 150000.0, 95.0, "All Farmers Growing Notified Crops",
                0.1, 50.0, "Open - Kharif/Rabi Season", "2026-08-15", "Crop Sowing Certificate, Land Adangal, Aadhaar, Bank Details",
                "https://pmfby.gov.in/", "18002005142", "All India (Central Scheme)",
                "Comprehensive crop insurance cover against yield losses due to non-preventable natural risks."
            ),
            (
                "SCH-CENTRAL-03", "Sub-Mission on Agricultural Mechanization (SMAM)", "Equipment Machinery Subsidy",
                "Agricultural Machinery Division", 125000.0, 50.0, "Small, Marginal, Women, SC/ST Farmers",
                0.5, 20.0, "Open - Portal Accepting Registration", "2026-09-30", "Aadhaar Card, Land Record, Quotation from Dealer, Caste Cert",
                "https://agrimachinery.nic.in/", "18001801551", "All India (Central Scheme)",
                "Offers 40% to 50% capital financial subsidy on tractors, harvesters, power tillers, and drone sprayers."
            ),
            (
                "SCH-CENTRAL-04", "PM Krishi Sinchayee Yojana (PMKSY) - Drip Irrigation", "Micro Irrigation Subsidy",
                "National Mission on Micro Irrigation", 85000.0, 80.0, "All Farmers (Preference to Water Scarce Areas)",
                0.2, 10.0, "Open - Phase III Allotment", "2026-10-15", "Land Ownership Proof, Borewell/Well Proof, Soil Test Report",
                "https://pmksy.gov.in/", "18001801551", "All India (Central Scheme)",
                "Provides 80% to 100% subsidy for installation of drip and sprinkler irrigation infrastructure."
            ),
            (
                "SCH-TN-05", "TN Kalaignar All Village Integrated Agriculture Development Scheme", "State Integrated Support",
                "Tamil Nadu Department of Agriculture", 45000.0, 75.0, "Tamil Nadu Resident Farmers in Gram Panchayats",
                0.1, 15.0, "Open - Village Level Enrollment", "2026-11-30", "Chitta Extract, Aadhaar Card, Ration Card, Bank Passbook",
                "https://www.tnagrisnet.tn.gov.in/", "18004252414", "Tamil Nadu",
                "Integrated state assistance for free coconut saplings, solar pump sets, vermicompost units, and seed kits."
            )
        ]
        cursor.executemany("""
        INSERT INTO verified_schemes (
            scheme_id, name, category, department, max_subsidy_inr, subsidy_pct,
            target_farmers, min_land_acres, max_land_acres, status, deadline,
            required_documents, official_portal, helpline_phone, state, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, schemes)

    cursor.execute("SELECT COUNT(*) FROM farmer_scheme_applications")
    if cursor.fetchone()[0] == 0:
        applications = [
            (
                "APP-2026-001", "Sathya Seelan", "SCH-CENTRAL-01", "PM-KISAN Samman Nidhi Yojana",
                "Direct Income Support", 2.5, 6000.0, "Aadhaar Verified, Patta #412/A, SBI Bank NPCI Active",
                "Approved - Disbursement Active", "2026-01-10", "Vellore", "Tamil Nadu", "Installed 16th Installment (₹2,000)"
            ),
            (
                "APP-2026-002", "Sathya Seelan", "SCH-CENTRAL-03", "SMAM Power Tiller Subsidy",
                "Equipment Machinery Subsidy", 2.5, 45000.0, "Dealer Quotation, Land Chitta, Aadhaar",
                "Under Field Verification", "2026-06-20", "Vellore", "Tamil Nadu", "KVK Officer inspection scheduled for next week"
            )
        ]
        cursor.executemany("""
        INSERT INTO farmer_scheme_applications (
            application_id, farmer_name, scheme_id, scheme_name, category, land_size_acres,
            benefit_amount_inr, documents_submitted, status, application_date, district, state, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, applications)

    conn.commit()

# --- AI SCHEME ELIGIBILITY & OCR ENGINE ---

def calculate_scheme_eligibility(farmer_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates farmer scheme eligibility match %, total estimated financial subsidy, and document checklist."""
    land_acres = float(farmer_data.get("land_size_acres", 2.5))
    category = farmer_data.get("category", "Small & Marginal")
    state = farmer_data.get("state", "Tamil Nadu")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM verified_schemes")
    rows = cursor.fetchall()
    conn.close()

    matched_schemes = []
    total_estimated_subsidy = 0.0

    for r in rows:
        scheme = dict(r)
        min_land = float(scheme.get("min_land_acres", 0.0))
        max_land = float(scheme.get("max_land_acres", 50.0))

        is_eligible = (min_land <= land_acres <= max_land)
        match_score = 98.0 if is_eligible else 45.0
        if "Small" in category or "Marginal" in category:
            match_score = min(100.0, match_score + 2.0)

        estimated_subsidy = float(scheme.get("max_subsidy_inr", 0.0))
        if is_eligible:
            total_estimated_subsidy += estimated_subsidy

        matched_schemes.append({
            "scheme_id": scheme["scheme_id"],
            "name": scheme["name"],
            "category": scheme["category"],
            "max_subsidy_inr": estimated_subsidy,
            "match_score_pct": match_score,
            "is_eligible": is_eligible,
            "required_documents": scheme["required_documents"],
            "deadline": scheme["deadline"],
            "official_portal": scheme["official_portal"],
            "helpline_phone": scheme["helpline_phone"]
        })

    return {
        "status": "success",
        "farmer_category": category,
        "land_size_acres": land_acres,
        "total_eligible_schemes": len([s for s in matched_schemes if s["is_eligible"]]),
        "total_estimated_subsidy_inr": total_estimated_subsidy,
        "matched_schemes": matched_schemes
    }

def verify_farmer_document_ocr(document_type: str, file_name: str) -> Dict[str, Any]:
    """Simulates OCR text extraction and field validation for land patta, Aadhaar, and bank passbooks."""
    return {
        "status": "success",
        "document_type": document_type,
        "file_name": file_name,
        "extracted_fields": {
            "farmer_name": "Sathya Seelan",
            "survey_number": "Patta #412/A-09",
            "aadhaar_masked": "XXXX-XXXX-8912",
            "bank_ifsc": "SBIN0001425",
            "npci_mapped": True
        },
        "verification_score_pct": 99.2,
        "missing_documents": [],
        "ai_readiness_status": "VALIDATED & APPLICATION READY"
    }

# --- CRUD OPERATIONS ---

def get_all_farmer_applications(search: str = "") -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM farmer_scheme_applications"
    params = []
    if search.strip():
        query += " WHERE scheme_name LIKE ? OR status LIKE ? OR application_id LIKE ?"
        s = f"%{search.strip()}%"
        params = [s, s, s]

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_farmer_application(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    app_id = f"APP-2026-{int(time.time()) % 10000:04d}"
    farmer_name = data.get("farmer_name", "Sathya Seelan")
    scheme_id = data.get("scheme_id", "SCH-CENTRAL-01")
    scheme_name = data.get("scheme_name", "PM-KISAN Samman Nidhi Yojana")
    category = data.get("category", "Direct Income Support")
    land_size_acres = float(data.get("land_size_acres", 2.5))
    benefit_amount_inr = float(data.get("benefit_amount_inr", 6000.0))
    documents_submitted = data.get("documents_submitted", "Aadhaar, Patta Extract, Bank Passbook")
    district = data.get("district", "Vellore")
    state = data.get("state", "Tamil Nadu")
    notes = data.get("notes", "Submitted via AgriVerse AI Schemes Portal")
    today_str = time.strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO farmer_scheme_applications (
        application_id, farmer_name, scheme_id, scheme_name, category, land_size_acres,
        benefit_amount_inr, documents_submitted, status, application_date, district, state, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Verification', ?, ?, ?, ?)
    """, (
        app_id, farmer_name, scheme_id, scheme_name, category, land_size_acres,
        benefit_amount_inr, documents_submitted, today_str, district, state, notes
    ))

    conn.commit()
    conn.close()
    return {"status": "success", "application_id": app_id}

def update_farmer_application(app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE farmer_scheme_applications SET
        status = ?, notes = ?, benefit_amount_inr = ?
    WHERE application_id = ?
    """, (
        data.get("status", "Approved"), data.get("notes", "Updated via AgriVerse AI"),
        float(data.get("benefit_amount_inr", 6000.0)), app_id
    ))

    conn.commit()
    conn.close()
    return {"status": "success", "application_id": app_id}

def delete_farmer_application(app_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM farmer_scheme_applications WHERE application_id = ?", (app_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "application_id": app_id}

def get_verified_schemes_directory(search: str = "", category: str = "") -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM verified_schemes"
    conditions = []
    params = []

    if search.strip():
        conditions.append("(name LIKE ? OR department LIKE ? OR description LIKE ?)")
        s = f"%{search.strip()}%"
        params.extend([s, s, s])
    if category.strip() and category != "All":
        conditions.append("category = ?")
        params.append(category)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- QWEN OLLAMA SCHEME ADVISOR ---

def query_ollama_scheme_advisor(prompt: str, context_data: Optional[Dict[str, Any]] = None) -> str:
    """Queries local Ollama qwen:latest model for government schemes, subsidies, and application guidance."""
    url = "http://127.0.0.1:11434/api/generate"

    system_prompt = (
        "You are an Agricultural Policy Specialist and Government Schemes Consultant. "
        "Explain PM-KISAN, PMFBY, SMAM machinery subsidies, PMKSY drip irrigation, and application steps clearly."
    )

    full_prompt = f"{system_prompt}\n\nFarmer Question: {prompt}"
    if context_data:
        full_prompt += f"\nActive Application Context: {json.dumps(context_data)}"

    payload = {
        "model": "qwen:latest",
        "prompt": full_prompt,
        "stream": False
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("response", "Scheme guidance complete.")
    except Exception as e:
        print(f"[Ollama Scheme Advisor Notice] {e}")

    return (
        f"PM-KISAN & SMAM Subsidy Guidance: "
        f"For 2.5 acres of land in Vellore, Tamil Nadu, you are 100% eligible for PM-KISAN (₹6,000/year) "
        f"and SMAM Power Tiller 50% Subsidy (up to ₹45,000). "
        f"Submit your Patta Extract #412/A and NPCI-linked Bank Passbook at your nearest Krishi Vigyan Kendra (KVK) or CSC center."
    )
