from fastapi import FastAPI, Depends, HTTPException,Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User  # ดึงโมเดล User มาใช้งาน
from models.inventory import InventoryItem  # ดึงโมเดล InventoryItem มาใช้งาน
from routers.auth import router as auth_router  # ดึง Router สำหรับ Authentication มาใช้งาน
from routers.inventory import router as inventory_router  # ดึง Router สำหรับ Inventory มาใช้งาน
import time

app = FastAPI() # (ใช้ app ตัวเดิมของคุณที่มีอยู่แล้วได้เลย)

app.include_router(auth_router)  # (สมมติว่า auth_router คือ Router ที่คุณสร้างใน auth.py)
app.include_router(inventory_router)  # (สมมติว่า inventory_router คือ Router ที่คุณสร้างใน inventory.py)


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
 
# ----------------------------------------------------
# 📋 1. อ่านข้อมูลผู้ใช้ "ทั้งหมด" ในฐานข้อมูล (ดึงออกมาเป็น List)
# ----------------------------------------------------
@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    # .query(User).all() จะไปดึงข้อมูลทุกแถวในตาราง users มาให้
    users = db.query(User).all()
    return users


# ----------------------------------------------------
# 🔍 2. อ่านข้อมูล "เฉพาะเจาะจง" โดยค้นหาจาก ID (ดึงมาแค่คนเดียว)
# ----------------------------------------------------
@app.get("/users/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    # .filter() ทำหน้าที่เหมือน WHERE ใน SQL เพื่อกรองข้อมูลตามเงื่อนไข
    # .first() คือเลือกตัวแรกที่เจอ (ถ้าไม่เจอจะคืนค่าเป็น None)
    user = db.query(User).filter(User.id == user_id).first()
    
    # ถ้าค้นหาในฐานข้อมูลแล้วไม่เจอ ID นี้ ให้พ่น Error 404 บอกฝั่งหน้าเว็บ
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบผู้ใช้งาน ID: {user_id}")
        
    return user


# ----------------------------------------------------
# 🏷️ 3. อ่านข้อมูลโดยใช้เงื่อนไขอื่น เช่น ค้นหาจาก Username
# ----------------------------------------------------
@app.get("/users/search/{username}")
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบผู้ใช้งานชื่อ: {username}")
    return user