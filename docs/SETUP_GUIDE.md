# AgriVerse AI — Production Developer Setup & Deployment Guide

Welcome to the official developer installation and deployment guide for **AgriVerse AI Ultimate**. This document explains how to set up, configure, run, and maintain the platform from scratch.

---

## 📋 Table of Contents

- [1. Prerequisites & Hardware Requirements](#1-prerequisites--hardware-requirements)
- [2. System Dependencies Installation](#2-system-dependencies-installation)
- [3. Repository Cloning & Project Initialization](#3-repository-cloning--project-initialization)
- [4. Backend Setup (FastAPI & Python Environment)](#4-backend-setup-fastapi--python-environment)
- [5. Frontend Setup (React 18 & Vite)](#5-frontend-setup-react-18--vite)
- [6. Ollama Local LLM Configuration](#6-ollama-local-llm-configuration)
- [7. Hugging Face Vision Models Setup](#7-hugging-face-vision-models-setup)
- [8. Google OAuth & Auth Gate Configuration](#8-google-oauth--auth-gate-configuration)
- [9. Model Context Protocol (MCP) Setup](#9-model-context-protocol-mcp-setup)
- [10. First-Time Step-by-Step Launch Guide](#10-first-time-step-by-step-launch-guide)
- [11. Daily Fast Startup Workflow (Returning Users)](#11-daily-fast-startup-workflow-returning-users)
- [12. Troubleshooting & Common Port Conflicts](#12-troubleshooting--common-port-conflicts)
- [13. Production Deployment & Reverse Proxy](#13-production-deployment--reverse-proxy)
- [14. Model Updates, Backup & Maintenance](#14-model-updates-backup--maintenance)
- [15. Recommended Documentation Location](#15-recommended-documentation-location)

---

## 1. Prerequisites & Hardware Requirements

AgriVerse AI runs local AI models directly on your hardware. For optimal performance, ensure your system meets the following specifications:

### Hardware Specifications

| Component | Minimum Requirement | Recommended Specification |
| :--- | :--- | :--- |
| **CPU** | Intel Core i5 (10th Gen) or AMD Ryzen 5 | Intel Core i7 / i9 (12th Gen+) or AMD Ryzen 7 / 9 |
| **RAM** | 8 GB DDR4 | 16 GB - 32 GB DDR4 / DDR5 |
| **GPU (Optional)** | Integrated Graphics | NVIDIA RTX 3060 / 4060 (8 GB+ VRAM) |
| **Storage** | 10 GB SSD free space | 25 GB NVMe SSD free space |
| **OS** | Windows 10/11, macOS 12+, or Ubuntu 20.04+ | Windows 11 / Ubuntu 22.04 LTS |

---

## 2. System Dependencies Installation

Before running the project, install the following required software:

1. **Node.js** (v18.0.0 or higher):
   - Download: [nodejs.org](https://nodejs.org/)
   - Verification command: `node -v` (Should return `v18.x` or `v20.x`).
2. **Python** (v3.10.0 or v3.11.x):
   - Download: [python.org](https://python.org/)
   - Verification command: `python --version` (Should return `Python 3.10.x` or `3.11.x`).
3. **Ollama** (Local LLM Server):
   - Download: [ollama.com](https://ollama.com/)
   - Verification command: `ollama --version`.
4. **Git**:
   - Download: [git-scm.com](https://git-scm.com/)

---

## 3. Repository Cloning & Project Initialization

Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:

```bash
git clone https://github.com/your-org/agriverse-ai.git
cd "agriverse-ai"
```

---

## 4. Backend Setup (FastAPI & Python Environment)

The backend powers the local AI prompts, RAG engine, report generator, and MCP connectors.

1. Navigate to the project root:
   ```bash
   cd "d:/mini project learning/agriculture AI"
   ```
2. Create and activate a Python Virtual Environment:
   ```bash
   python -m venv venv
   
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   
   # Linux / macOS
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install fastapi uvicorn httpx torch transformers sentence-transformers pillow pydantic
   ```
4. Verify backend server script:
   ```bash
   python server/run_server.py
   ```
   *Expected Output*: `Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)`

> 💡 **Note**: If `python server/run_server.py` says `Address already in use`, a backend instance is **already running** on port 8000. You do not need to restart it.

---

## 5. Frontend Setup (React 18 & Vite)

1. Open a new terminal in the project directory.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Expected Output*: `VITE v5.x.x ready in 450 ms Local: http://localhost:5173/`

---

## 6. Ollama Local LLM Configuration

AgriVerse AI relies on Ollama for local LLM inference (`qwen:latest` / `qwen2.5:7b`).

> ⚡ **Important for Windows & macOS Users**: Ollama automatically runs in the system tray / background. If `ollama serve` gives `bind: Only one usage of each socket address is normally permitted`, **Ollama is already running!** Skip `ollama serve` and run `ollama list` directly.

1. Verify installed models:
   ```bash
   ollama list
   ```
   *Expected Output*: `qwen:latest  2.3 GB`
2. If `qwen:latest` is not listed, pull the model:
   ```bash
   ollama pull qwen:latest
   ```

---

## 7. Hugging Face Vision Models Setup

Computer vision diagnostics in **AI Crop Doctor** use local PyTorch Hugging Face transformers (`google/vit-base-patch16-224`).

1. PyTorch will automatically download model weights on first image scan and cache them locally in `~/.cache/huggingface/hub/`.
2. To pre-download vision model weights offline:
   ```python
   from transformers import AutoFeatureExtractor, AutoModelForImageClassification
   AutoFeatureExtractor.from_pretrained("google/vit-base-patch16-224")
   ```

---

## 8. Google OAuth & Auth Gate Configuration

AgriVerse AI includes a client-side Google Identity Services (GIS) integration:
- `index.html` loads the Google script: `https://accounts.google.com/gsi/client`.
- When logging in, entering `sathya.seelan@gmail.com` or clicking Google OAuth automatically sets `Sathya Seelan` with profile picture `/sathyaseelan_profile.jpg`.
- To configure your own Google Client ID for live production, update `VITE_GOOGLE_CLIENT_ID` in `.env`:
  ```env
  VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id.apps.googleusercontent.com
  ```

---

## 9. Model Context Protocol (MCP) Setup

MCP servers provide tool capabilities to the local AI:
- `server/mcp/weather_mcp.py`: Real-time weather lookup tool.
- `server/mcp/web_search_mcp.py`: DuckDuckGo agricultural news search.
- `server/mcp/db_mcp.py`: SQLite query tool.

To verify MCP tools standalone:
```bash
python server/mcp/weather_mcp.py
```

---

## 10. First-Time Step-by-Step Launch Guide

Follow these steps in order when running AgriVerse AI for the first time:

### Step 1: Verify Ollama Service
Check if Ollama is running:
```bash
ollama list
```
*(If Ollama is not running, start it with `ollama serve` or from your Windows Start Menu).*

### Step 2: Start FastAPI Backend Engine
```bash
python server/run_server.py
```
*Verification*: Open browser to `http://localhost:8000/docs` — Should show FastAPI Interactive OpenAPI documentation.

### Step 3: Launch Vite Frontend UI
```bash
npm run dev
```
*Verification*: Open browser to `http://localhost:5173/` — AgriVerse AI Operating System loads!

---

## 11. Daily Fast Startup Workflow (Returning Users)

Once configured, daily launch takes less than 10 seconds:

```bash
# 1. Start Backend (if not already running)
python server/run_server.py

# 2. Start Frontend Dev Server
npm run dev
```

1. Open `http://localhost:5173/` in your browser.
2. Returning user session automatically logs you in as **Sathya Seelan** (`sathya.seelan@gmail.com`).
3. Click `⚡ Run Tab AI Analysis` on any tab to generate streaming AI reports!

---

## 12. Troubleshooting & Common Port Conflicts

### Issue 1: `ollama serve` Error: `bind: Only one usage of each socket address (protocol/network address/port) is normally permitted`
- **Cause**: Ollama is already running in the background (Port 11434 is active).
- **Solution**: Do NOT run `ollama serve` again. Simply run `ollama list` or proceed directly to launching the backend/frontend.

### Issue 2: `python server/run_server.py` Error: `Address already in use`
- **Cause**: The FastAPI backend server is already running on port 8000 in another terminal or background process.
- **Solution**: Open `http://localhost:8000/docs` in your browser to verify the server is live. If you need to restart it, kill the existing process using Task Manager or PowerShell:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```

### Issue 3: Vite Port 5173 in use
- **Cause**: Another Vite instance is running.
- **Solution**: Vite will automatically select port 5174 or 5175. Access the application at the URL displayed in terminal output.

---

## 13. Production Deployment & Reverse Proxy

For enterprise network or cloud deployment (NGINX + PM2):

1. **Build Production Frontend**:
   ```bash
   npm run build
   ```
   This creates an optimized production bundle in `/dist`.
2. **Configure NGINX Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name agriverse.yourdomain.com;

       location / {
           root /var/www/agriverse-ai/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

---

## 14. Model Updates, Backup & Maintenance

### Updating Ollama LLM Models
```bash
ollama pull qwen:latest
```

### Backing Up SQLite RAG & User Settings
Backup the following file to preserve vector embeddings and soil telemetry:
- `d:/mini project learning/agriculture AI/soil_intelligence.db`

---

## 15. Recommended Documentation Location

Per enterprise repository conventions, all system documentation is stored inside the `/docs/` folder:

```
AgriVerse-AI/
│
├── docs/
│   ├── README.md            # Enterprise Architecture & Tab Guide
│   └── SETUP_GUIDE.md       # Developer Setup & Deployment Guide
│
├── public/
├── server/
├── src/
└── ...
```

---
*AgriVerse AI Technical Operations & Engineering Team*
