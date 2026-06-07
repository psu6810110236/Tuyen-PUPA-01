from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db , engine,SessionLocal, Base


# สร้างตารางในฐานข้อมูล (ถ้าไม่มีอยู่แล้ว)
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def root():
    return {"message": "FastAPI ทำงานปกติครับ"}

@app.get("/check-db")
def check_database_connection(db: Session = Depends(get_db)):
    try:
        # บังคับคิวรี่เช็กสัญญาณผ่าน Session ที่ส่งมาจาก get_db ตัวล่าสุด
        result = db.execute(text("SELECT 1"))
        return {
            "status": "success", 
            "message": "ระบบทำงานสมบูรณ์แบบ ทั้งสถาปัตยกรรมเชื่อมต่อได้ครบวงจรแล้ว!"
        }
    except Exception as e:
        # หากเกิดปัญหาข้างใน ให้พ่นข้อความฟ้องออกมาดูตรงๆ บนเว็บเลย
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}")