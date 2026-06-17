import os
from dotenv import load_dotenv
from pathlib import Path

# ระบุ path ตรงๆ ไปหาไฟล์ .env ที่โฟลเดอร์นอกสุดของโปรเจกต์
load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")
# ค้นหาในโฟลเดอร์ ai เผื่อไว้ด้วย
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
