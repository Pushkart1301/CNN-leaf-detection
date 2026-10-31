import uvicorn
import sys
from main import app

if __name__ == "__main__":
    try:
        print("Starting AgriVerse FastAPI server on http://127.0.0.1:8000...")
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
    except Exception as e:
        print(f"Server Error: {e}", file=sys.stderr)
