from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from urllib.parse import quote

from database import get_db
from routers.auth import get_current_user
from models.user import User
from models.inventory import InventoryItem
import services.recipe_service as recipe_service

router = APIRouter(prefix="/recipes", tags=["Recipes"])

# --- Pydantic Validation Schemas ---
class RecipeSaveRequest(BaseModel):
    spoonacular_id: int
    title: str
    image_url: Optional[str] = None
    ready_in_minutes: Optional[int] = None
    servings: Optional[int] = None

class RecipeSavedResponse(BaseModel):
    id: int
    user_id: int
    spoonacular_id: int
    title: str
    image_url: Optional[str]
    ready_in_minutes: Optional[int]
    servings: Optional[int]
    saved_at: datetime
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/suggest")
async def get_suggested_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ดึงรายการวัตถุดิบทั้งหมดของผู้ใช้จาก DB แล้วนำไปให้ AI ค้นหาสูตรอาหารแนะนำ"""
    # 1. คิวรี่รายชื่อของกินทั้งหมดในตู้เย็นปัจจุบัน
    user_items = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    if not user_items:
        return {"message": "ตู้เย็นคุณว่างเปล่า กรอกข้อมูลอาหารก่อนเพื่อให้ระบบแนะนำเมนู", "recipes": []}
    
    ingredients = [item.name for item in user_items]
    # 2. ส่งรายชื่อวิ่งตรงไปขอเมนูกับ Service ลอจิก
    recipes = await recipe_service.suggest_recipes(ingredients)
    return recipes

@router.get("/search")
async def search_recipes(q: str, current_user: User = Depends(get_current_user)):
    """ค้นหาสูตรอาหารด้วยการพิมพ์ระบุคำค้นหาทั่วไป"""
    if not q:
        raise HTTPException(status_code=400, detail="กรุณากรอกคำค้นหาในพารามิเตอร์ q")
    return await recipe_service.search_recipe_by_name(q)


@router.get("/{recipe_id}")
async def get_recipe_details(
    recipe_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """ดึงขั้นตอนวิธีทำและส่วนผสมเชิงลึกของเมนูที่เลือกมาแสดงผล (เปรียบเทียบตู้เย็นให้อัตโนมัติ)"""
    return await recipe_service.check_recipe_inventory(current_user.id, recipe_id, db)

@router.post("/saved", response_model=RecipeSavedResponse, status_code=status.HTTP_201_CREATED)
async def save_user_recipe(payload: RecipeSaveRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ผู้ใช้คลิกเลือกบันทึกเมนูที่ตนเองชื่นชอบเก็บไว้ในฐานข้อมูลประจำตัว"""
    return await recipe_service.save_recipe(current_user.id, payload.model_dump(), db)

@router.get("/saved", response_model=list[RecipeSavedResponse])
async def list_saved_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """เรียกดูรายการสูตรอาหารทั้งหมดที่เจ้าของแอคเคาท์เคยทำการกดบันทึกเก็บไว้"""
    return await recipe_service.get_saved_recipes(current_user.id, db)

@router.delete("/saved/{recipe_id}")
async def remove_saved_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ลบเมนูอาหารที่เคยเซฟไว้ออกจากคลังประวัติ"""
    success = await recipe_service.delete_saved_recipe(current_user.id, recipe_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="ไม่พบรายการเมนูอาหารนี้ที่เคยเซฟไว้ในระบบของคุณ")
    return {"status": "success", "message": "ลบสูตรอาหารที่บันทึกไว้สำเร็จแล้ว"}

@router.post("/{recipe_id}/cook")
async def cook_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ทำอาหาร: หักลบวัตถุดิบออกจากตู้เย็นตามส่วนผสมของเมนูนี้ และบันทึกประวัติสารอาหารแคลอรี่โดยอัตโนมัติ"""
    try:
        result = await recipe_service.cook_recipe(current_user.id, recipe_id, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ไม่สามารถดำเนินการทำอาหารและตัดสต็อกได้: {str(e)}"
        )