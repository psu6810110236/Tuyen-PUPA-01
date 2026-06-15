from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from models.user import User
from models.inventory import InventoryItem
from models.recipe import RecipeSaved
from models.nutrition import NutritionLog

# 🛠️ รันการทำ Database Migrations ผ่าน Alembic อัตโนมัติในตอนเริ่มเปิดระบบ (Enterprise Standard)
from alembic.config import Config
from alembic import command
import os

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    ini_path = os.path.join(current_dir, "alembic.ini")
    alembic_cfg = Config(ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(current_dir, "alembic"))
    command.upgrade(alembic_cfg, "head")
    print("🚀 [Alembic] อัปเกรดโครงสร้างตารางฐานข้อมูลสำเร็จ (Upgraded to head)")
except Exception as e:
    print(f"⚠️ [Alembic] ไม่สามารถอัปเกรดฐานข้อมูลเมื่อเริ่มต้นระบบได้: {e}")

from routers.auth import router as auth_router  # ดึง Router สำหรับ Authentication มาใช้งาน
from routers.inventory import router as inventory_router  # ดึง Router สำหรับ Inventory มาใช้งาน
from routers.recipe import router as recipe_router  # ดึง Router สำหรับ Recipe มาใช้งาน
from routers.nutrition import router as nutrition_router  # ดึง Router สำหรับ Nutrition มาใช้งาน
from routers.agent import router as agent_router  # ดึง Router สำหรับ AI Agent มาใช้งาน
from routers.ai import router as ai_router  # ดึง Router สำหรับ AI มาใช้งาน
from routers.user import router as user_router  # ดึง Router สำหรับ Users มาใช้งาน
from routers.test import router as test_router  # ดึง Router สำหรับ Testing (เช่น test-line) มาใช้งาน
import time

app = FastAPI()

# 🔓 CORS Middleware — อนุญาตให้ Frontend (Next.js) เรียก API ข้ามโดเมนได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ที่อยู่ของ Next.js dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(inventory_router)
app.include_router(recipe_router)
app.include_router(nutrition_router)
app.include_router(agent_router)
app.include_router(ai_router)
app.include_router(user_router)
app.include_router(test_router)

@app.middleware("http")
async def log_and_time_middleware(request: Request, call_next):
    # 1. จังหวะขาเข้า: บันทึกเวลาเริ่มต้นที่ Request วิ่งเข้ามาชนเซิร์ฟเวอร์
    start_time = time.time()
    
    # 2. ส่งไม้ต่อให้ระบบในเครื่องทำงาน (เช่น วิ่งไปคิวรี่เบส หรือเช็ก JWT ใน auth.py)
    response = await call_next(request)
    
    # 3. จังหวะขาออก: คำนวณเวลาหลังจากระบบทำงานเสร็จสิ้น
    process_time = time.time() - start_time
    
    # พ่น Log ออกมาที่หน้าจอ Terminal ของเราเพื่อเอาไว้ดีบั๊กตรวจสอบความเร็ว
    print(f"⏰ [Middleware LOG] มีคนเรียกพาธ: {request.url.path} | ใช้เวลาประมวลผลไป: {process_time:.4f} วินาที")
    
    # ส่ง Response กลับไปหาหน้าเว็บเบราว์เซอร์ของผู้ใช้
    return response
