from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from routers.auth import get_current_user
from models.user import User
import services.nutrition_service as nutrition_service

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

# --- Pydantic Validation Schemas ---
class NutritionLogRequest(BaseModel):
    meal_type: str
    food_name: str
    calories: float
    protein: float
    carb: float
    fat: float
    source: Optional[str] = "manual"

class NutritionLogResponse(BaseModel):
    id: int
    user_id: int
    meal_type: str
    food_name: str
    calories: float
    protein: float
    carb: float
    fat: float
    logged_at: datetime
    source: str
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/log", response_model=NutritionLogResponse, status_code=status.HTTP_201_CREATED)
async def log_meal(payload: NutritionLogRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """บันทึกข้อมูลมื้ออาหารเข้าคลังสารอาหารส่วนตัว"""
    return await nutrition_service.log_meal(current_user.id, payload.model_dump(), db)

@router.get("/today")
async def get_today_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ดูยอดรวมสารอาหารประจำวันปัจจุบันพร้อมขีดความคืบหน้า (Progress Bar)"""
    return await nutrition_service.get_today_summary(current_user.id, db)

@router.get("/history", response_model=List[NutritionLogResponse])
async def get_nutrition_history(days: int = 7, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ดึงข้อมูลประวัติการทานอาหารย้อนหลังตามจำนวนวัน"""
    return await nutrition_service.get_history(current_user.id, days, db)

@router.get("/estimate")
async def estimate_food_nutrition(food_name: str, current_user: User = Depends(get_current_user)):
    """(เพิ่มเติมสำหรับหน้าบ้าน) ส่งชื่อเมนูภาษาอังกฤษไปให้ระบบช่วยเดาแคลและสารอาหารให้ก่อนกดบันทึก"""
    if not food_name:
        raise HTTPException(status_code=400, detail="กรุณาระบุชื่ออาหารในช่องพารามิเตอร์ food_name")
    return await nutrition_service.estimate_calories(food_name)

@router.delete("/log/{log_id}")
async def delete_nutrition_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ลบรายการสารอาหารมื้อที่คีย์ข้อมูลผิดพลาดออกจากประวัติ"""
    success = await nutrition_service.delete_log(current_user.id, log_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="ไม่พบรายการบันทึกอาหารไอดีนี้ที่ระบุในระบบของคุณ")
    return {"status": "success", "message": "ลบรายการบันทึกอาหารสำเร็จแล้ว"}