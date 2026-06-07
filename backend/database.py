import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. โหลด .env จากโฟลเดอร์ปัจจุบัน
current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

# 2. สร้าง Engine (ท่อส่งข้อมูลหลัก)
# เพิ่ม pool_pre_ping=True เพื่อให้มันคอยเช็กตัวเองตลอดเวลาว่าท่อหลุดไหมก่อนจะคิวรี่
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# --- [ขั้นตอนสถาปัตยกรรมที่เพิ่มเข้ามา]: ตรวจสอบการเชื่อมต่อทันที (Ping Test) ---
try:
    print("\n[Architecture Status] กำลังทดสอบเชื่อมต่อสายเคเบิลไปที่ Docker...")
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("[Architecture Status] 🟢 เชื่อมต่อ PostgreSQL สำเร็จเสร็จสิ้น! ทุกขั้นตอนทำงานปกติ\n")
except Exception as e:
    print("\n[Architecture Status] 🔴 ระบบเชื่อมต่อรั่วไหลพังที่ขั้นตอนนี้!")
    print(f"สาเหตุเกิดจาก: {e}\n")
# ----------------------------------------------------------------------

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()