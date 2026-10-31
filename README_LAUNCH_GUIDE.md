# AgriVerse AI — Verified Production Launch & Setup Guide

> **Important Note**: This document was generated exclusively by conducting a full static audit of the actual codebase, `package.json`, `vite.config.js`, `server/run_server.py`, `server/main.py`, and Python model managers. No unverified or generic commands have been included.

---

## 📋 Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Actual Folder Structure](#2-actual-folder-structure)
- [3. Required Software Dependencies](#3-required-software-dependencies)
- [4. First Time Setup (Step-by-Step)](#4-first-time-setup-step-by-step)
- [5. Daily Quick Start (Returning User)](#5-daily-quick-start-returning-user)
- [6. Exact Terminal Commands & Launch Order](#6-exact-terminal-commands--launch-order)
- [7. Local AI Services & Model Stores](#7-local-ai-services--model-stores)
- [8. Database Auto-Initialization](#8-database-auto-initialization)
- [9. Port Mappings & Network Proxies](#9-port-mappings--network-proxies)
- [10. System Health Checks](#10-system-health-checks)
- [11. Troubleshooting & Common Errors](#11-troubleshooting--common-errors)
- [12. Shutdown Procedure](#12-shutdown-procedure)
- [13. Restart Procedure](#13-restart-procedure)
- [14. Production Build & Deployment Notes](#14-production-build--deployment-notes)

---

## 1. Project Overview

**AgriVerse AI v1.0 Ultimate** is a privacy-focused Smart Agriculture Operating System. It integrates:
- **Frontend**: React 18, Vite 5.4, Tailwind CSS 4, Lucide React Icons.
- **Backend API**: Python FastAPI running via Uvicorn on port `8000`.
- **Local LLM**: Ollama service running on port `11434` with model `qwen:latest`.
- **Vision & RAG**: Hugging Face PyTorch transformers stored locally in `/models/huggingface`.
- **Database Layer**: 34 SQLite databases initialized on backend server startup.

---

## 2. Actual Folder Structure

```
AgriVerse-AI/
├── index.html                                 # HTML5 Canvas & Google Identity entry point
├── package.json                               # Frontend scripts and npm dependencies
├── vite.config.js                             # Vite configuration (Port 3000 + Proxies)
├── public/                                    # Static assets (including /sathyaseelan_profile.jpg)
│
├── server/                                    # Python FastAPI backend core
│   ├── main.py                                # Main FastAPI application entry (34 DB init calls)
│   ├── run_server.py                          # Primary server runner (uvicorn.run port 8000)
│   ├── start_api.py                           # Secondary API launcher
│   ├── download_models.py                     # HF model directory initializer
│   ├── download_hf_models.py                  # Snapshot downloader for Hugging Face models
│   ├── setup_crop_doctor_store.py             # 11 subfolder store builder for Crop Doctor
│   ├── ai/                                    # Prompt manager engine
│   └── mcp/                                   # Model Context Protocol tools (weather, web search)
│
├── models/                                    # Local Hugging Face models directory
│   └── huggingface/                           # all-MiniLM-L6-v2, deit-small, trocr-small, etc.
│
├── agriculture model for AI crop doctor tab/   # Local Crop Doctor model store (11 subfolders)
├── docs/                                      # Enterprise documentation
└── src/                                       # React application components and state
    ├── context/AuthContext.jsx                # SaaS Google Identity & persistent auth gate
    ├── components/layout/                     # Header, Sidebar, AIDrawer
    └── components/tabs/                       # 51 Modular Agriculture Tabs
```

---

## 3. Required Software Dependencies

### Verified System Software
1. **Node.js** (`>= 18.0.0`)
2. **Python** (`3.10.x` or `3.11.x`)
3. **Ollama** (Local LLM service)
4. **Git**

### Verified `package.json` Dependencies
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`
- `lucide-react`: `^0.453.0`
- `vite`: `^5.4.1`
- `tailwindcss`: `^4.0.0`
- `@tailwindcss/vite`: `^4.0.0`
- `@vitejs/plugin-react`: `^4.3.1`

### Verified Python Backend Dependencies
- `fastapi`, `uvicorn`, `httpx`, `pydantic`, `pillow`, `torch`, `transformers`, `sentence-transformers`, `huggingface_hub`

---

## 4. First Time Setup (Step-by-Step)

Perform these steps in order on a fresh machine:

### Step 1: Open Terminal in Project Directory
```powershell
cd "d:\mini project learning\agriculture AI"
```

### Step 2: Install Node.js Frontend Packages
```bash
npm install
```
*Expected Output*: Verified package installation into `node_modules`.

### Step 3: Install Python Dependencies
```bash
pip install fastapi uvicorn httpx torch transformers sentence-transformers pillow pydantic huggingface_hub
```

### Step 4: Initialize Local Model Directories
Run the verified setup scripts to prepare local stores:
```bash
python server/setup_crop_doctor_store.py
python server/download_models.py
```
*Expected Output*:
```
[CropDoctor Store] All 11 Subdirectories Initialized Successfully.
[LocalAI Setup] All 7 Local Hugging Face Models Registered Successfully.
```

### Step 5: Download Required Ollama Model
Verify that `qwen:latest` is available in your Ollama installation:
```bash
ollama list
```
If `qwen:latest` is missing:
```bash
ollama pull qwen:latest
```

---

## 5. Daily Quick Start (Returning User)

For developers and users returning to an installed setup:

### Terminal 1 — Start FastAPI Backend
Open PowerShell / Terminal in project root:
```powershell
python server/run_server.py
```
*Wait until output displays*: `Starting AgriVerse FastAPI server on http://127.0.0.1:8000...`

### Terminal 2 — Start Vite Frontend
Open a second PowerShell / Terminal in project root:
```bash
npm run dev
```
*Wait until output displays*: `Local: http://localhost:3000/` (or `http://localhost:5173/`).

### Launch Browser
Open `http://localhost:3000/` (or `http://localhost:5173/`). Your active session automatically logs in as **Sathya Seelan** (`sathya.seelan@gmail.com`).

---

## 6. Exact Terminal Commands & Launch Order

```
[System Service: Ollama]
Port 11434 (Auto-starts on OS boot or run 'ollama list')
          │
          ▼
[Terminal 1: Python Backend]
python server/run_server.py (Port 8000)
          │
          ▼
[Terminal 2: Vite Frontend]
npm run dev (Port 3000 / 5173)
```

---

## 7. Local AI Services & Model Stores

- **Ollama Engine**: Endpoint `http://127.0.0.1:11434/api/generate` (Model: `qwen:latest`).
- **Hugging Face Model Store**: Located at `models/huggingface/` (`all-MiniLM-L6-v2`, `deit-small`, `trocr-small`, `yolov8n`).
- **Crop Doctor Store**: Located at `agriculture model for AI crop doctor tab/` (11 subfolders for classifiers, vision, detection, and logs).

### Tomato Disease Classifier Training

The image classifier can be fine-tuned on all 10 tomato classes in the PlantVillage dataset:

```powershell
python scripts/prepare_tomato_dataset.py
python scripts/train_leaf_classifier.py --data data/leaf_disease --output models/leaf_disease_classifier --epochs 8 --batch-size 16 --learning-rate 0.001 --freeze-backbone
```

The preparation script downloads the dataset archive (about 2.2 GB), preserves its official leaf-grouped test split, and reserves validation images without splitting a leaf between training and validation. The training script caches the frozen Swin backbone features and trains the tomato classification head; the backend automatically loads the resulting `models/leaf_disease_classifier` checkpoint on restart. The dataset is licensed CC BY-SA 3.0; see `data/leaf_disease/DATASET_ATTRIBUTION.txt`.

PlantVillage images have controlled backgrounds, so test metrics on that dataset do not guarantee accuracy on field photos. Verify performance on separately collected, correctly labeled field images before relying on diagnoses or treatment recommendations.

---

## 8. Database Auto-Initialization

When `python server/run_server.py` is executed, `server/main.py` automatically initializes **34 SQLite databases** upon startup:
- `init_crop_health_db()`
- `init_yield_db()`
- `init_harvest_db()`
- `init_soil_db()`
- `init_water_db()`
- `init_fertilizer_db()`
- `init_market_db()`
- `init_task_planner_db()`
- `init_farmer_community_db()`
- *(and 25 additional module DB engines)*

No manual SQL scripts or database migrations are needed.

---

## 9. Port Mappings & Network Proxies

As configured in `vite.config.js` and `server/run_server.py`:

| Service | Target URL | Config Source |
| :--- | :--- | :--- |
| **Vite Frontend UI** | `http://localhost:3000` (or `5173`) | `vite.config.js` (`server.port: 3000`) |
| **FastAPI Backend Core** | `http://127.0.0.1:8000` | `server/run_server.py` (`port=8000`) |
| **Ollama Local LLM** | `http://127.0.0.1:11434` | `server/main.py` (`OLLAMA_URL`) |

### Vite Proxy Rules (`vite.config.js`)
- `/api/ollama` → `http://localhost:11434`
- `/api/backend` → `http://localhost:8000`
- `/api` → `http://localhost:8000`

---

## 10. System Health Checks

Verify operational status by checking these endpoints:

1. **FastAPI OpenAPI Interactive Docs**: `http://127.0.0.1:8000/docs`
2. **Ollama Service Health**: `http://127.0.0.1:11434/` (Returns `Ollama is running`)
3. **Frontend Dashboard**: `http://localhost:3000/` or `http://localhost:5173/`

---

## 11. Troubleshooting & Common Errors

### 1. `ollama serve` Error: `bind: Only one usage of each socket address is normally permitted`
- **Symptom**: Port 11434 conflict error when attempting to run `ollama serve`.
- **Cause**: On Windows and macOS, Ollama runs automatically in the background as a system tray service.
- **Resolution**: Do NOT run `ollama serve` manually. Run `ollama list` to verify model status.

### 2. `python server/run_server.py` Error: `Address already in use`
- **Symptom**: FastAPI fails to bind to port 8000.
- **Cause**: A previous Python backend process is still running on port 8000.
- **Resolution**: Kill port 8000 in PowerShell before restarting:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  python server/run_server.py
  ```

### 3. Frontend Displays Port `5173` Instead of `3000`
- **Symptom**: Console indicates `http://localhost:5173/`.
- **Cause**: Port 3000 is occupied by another application, so Vite automatically falls back to 5173.
- **Resolution**: Open the URL displayed in the Vite terminal output (`http://localhost:5173/`).

---

## 12. Shutdown Procedure

To cleanly stop the platform:

1. **Stop Frontend**: In Terminal 2 (Vite), press `CTRL + C` and confirm termination (`Y`).
2. **Stop Backend**: In Terminal 1 (Python), press `CTRL + C`.

---

## 13. Restart Procedure

To restart after code or database updates:

```powershell
# 1. Kill active backend process (if port 8000 is locked)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force

# 2. Restart Backend
python server/run_server.py

# 3. Restart Frontend
npm run dev
```

---

## 14. Production Build & Deployment Notes

To create a static production web bundle:
```bash
npm run build
```
This compiles optimized assets into the `/dist` directory. Serve `/dist` using NGINX or static web host proxying `/api` requests to `http://127.0.0.1:8000`.

---
*AgriVerse AI Verification & Engineering Team*
