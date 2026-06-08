import os
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.recipe import RecipeSaved

SPOONACULAR_KEY = os.getenv("SPOONACULAR_API_KEY")
BASE_URL = "https://api.spoonacular.com/recipes"

# Helper สำหรับยิง Request ไปยัง Spoonacular ป้องกันโค้ดซ้ำซ้อน
async def _fetch_from_spoonacular(endpoint: str, params: dict = None) -> dict:
    if not SPOONACULAR_KEY:
        raise HTTPException(status_code=500, detail="SPOONACULAR_API_KEY ยังไม่ได้กำหนดในระบบ")
    
    if params is None:
        params = {}
    params["apiKey"] = SPOONACULAR_KEY

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/{endpoint}", params=params, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"SPOONACULAR Error: {response.text}"
                )
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"ไม่สามารถเชื่อมต่อไปยังผู้ให้บริการสูตรอาหารได้: {str(exc)}"
            )

# 📋 1. ค้นหาเมนูอาหารแนะนำจากวัตถุดิบที่ส่งเข้าไป
async def suggest_recipes(ingredients: list[str]) -> list[dict]:
    ingredients_str = ",".join(ingredients)
    params = {"ingredients": ingredients_str, "number": 10, "ranking": 1}
    data = await _fetch_from_spoonacular("findByIngredients", params)
    
    # ทำการ Map หน้าตาข้อมูลคืนกลับไปให้คลีนตามสเปกที่กำหนด
    return [{
        "id": r["id"],
        "title": r["title"],
        "image": r.get("image"),
        "usedIngredientCount": r.get("usedIngredientCount", 0),
        "missedIngredientCount": r.get("missedIngredientCount", 0)
    } for r in data]

# 🔍 2. ดึงรายละเอียดเชิงลึกของเมนูอาหารรายตัว
async def get_recipe_detail(recipe_id: int) -> dict:
    data = await _fetch_from_spoonacular(f"{recipe_id}/information")
    return {
        "id": data["id"],
        "title": data["title"],
        "image": data.get("image"),
        "readyInMinutes": data.get("readyInMinutes"),
        "servings": data.get("servings"),
        "instructions": data.get("instructions"),
        "extendedIngredients": [
            {"name": ing["name"], "amount": ing["amount"], "unit": ing["unit"]}
            for ing in data.get("extendedIngredients", [])
        ]
    }

# 🔎 3. ค้นหาเมนูอาหารผ่านการพิมพ์ชื่อค้นหาตรงๆ
async def search_recipe_by_name(name: str) -> list[dict]:
    params = {"query": name, "number": 10}
    data = await _fetch_from_spoonacular("complexSearch", params)
    
    return [{
        "id": r["id"],
        "title": r["title"],
        "image": r.get("image"),
        "readyInMinutes": r.get("readyInMinutes", 0)
    } for r in data.get("results", [])]

# 💾 4. บันทึกเมนูอาหารลงฐานข้อมูลจริง
async def save_recipe(user_id: int, recipe_data: dict, db: Session) -> RecipeSaved:
    # เช็กเคสป้องกันการเซฟสูตรอาหารซ้ำตัวเดิมซ้อนกันในฐานข้อมูลของคนนั้น
    existing = db.query(RecipeSaved).filter(
        and_(RecipeSaved.user_id == user_id, RecipeSaved.spoonacular_id == recipe_data["spoonacular_id"])
    ).first()
    if existing:
        return existing
        
    new_save = RecipeSaved(
        user_id=user_id,
        spoonacular_id=recipe_data["spoonacular_id"],
        title=recipe_data["title"],
        image_url=recipe_data.get("image_url"),
        ready_in_minutes=recipe_data.get("ready_in_minutes"),
        servings=recipe_data.get("servings")
    )
    db.add(new_save)
    db.commit()
    db.refresh(new_save)
    return new_save

# 📑 5. เรียกดูรายการเมนูทั้งหมดที่ผู้ใช้งานเซฟเก็บไว้
async def get_saved_recipes(user_id: int, db: Session) -> list[RecipeSaved]:
    return db.query(RecipeSaved).filter(RecipeSaved.user_id == user_id).all()

# 🗑️ 6. ลบเมนูอาหารที่เคยถูกบันทึกออกจากตู้เย็น
async def delete_saved_recipe(user_id: int, recipe_id: int, db: Session) -> bool:
    item = db.query(RecipeSaved).filter(
        and_(RecipeSaved.user_id == user_id, RecipeSaved.spoonacular_id == recipe_id)
    ).first()
    
    if not item:
        return False
        
    db.delete(item)
    db.commit()
    return True