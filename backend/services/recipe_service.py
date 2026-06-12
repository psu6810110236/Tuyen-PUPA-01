import os
import httpx
from urllib.parse import quote
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.recipe import RecipeSaved
from models.inventory import InventoryItem

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
# ตัวอย่างไอเดีย: แอบแปลงร่างคำศัพท์ก่อนยิงไปหา Spoonacular
async def suggest_recipes(ingredients: list[str]) -> list[dict]:
    
    # 💡 อนาคตอาจจะเอาบอทแปลภาษามาครอบตรงนี้ 
    # จาก ['อกไก่สด', 'ไข่ไก่'] แปลงให้กลายเป็น ['chicken', 'egg']
    translated_ingredients = []
    for item in ingredients:
        if "อกไก่" in item or "ไก่" in item:
            translated_ingredients.append("chicken")
        elif "ไข่" in item:
            translated_ingredients.append("egg")
        elif "ผักกาด" in item:
            translated_ingredients.append("cabbage")
        else:
            translated_ingredients.append(item) # ถ้าเป็นอังกฤษอยู่แล้วปล่อยผ่าน

    ingredients_str = ",".join(translated_ingredients)
    data = await _fetch_from_spoonacular("findByIngredients", {"ingredients": ingredients_str, "number": 10, "ranking": 1})
    return data

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
            {
                "name": ing["name"], 
                "amount": ing["amount"], 
                "unit": ing["unit"],
                "lotus_search_url": f"https://www.lotuss.com/th/search/{quote(ing['name'])}?sort=relevance:DESC"
            }
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

# 🛒 7. ตรวจสอบวัตถุดิบและของที่ขาดเพื่อจัดทำรายการสั่งของ Lotus's
async def check_recipe_inventory(user_id: int, recipe_id: int, db: Session) -> dict:
    # 1. ดึงรายละเอียดสูตรอาหาร (ซึ่งจะมี lotus_search_url อยู่แล้ว)
    recipe = await get_recipe_detail(recipe_id)
    recipe_ingredients = recipe.get("extendedIngredients", [])

    # 2. ดึงของในตู้เย็นของผู้ใช้จริง
    inventory_items = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
    user_inv_names = [item.name.lower() for item in inventory_items]

    available = []
    missing = []

    # ตารางคำแปลภาษาไทยเบื้องต้นเพื่อแมตช์คำระหว่างตู้เย็นไทยกับสูตรอังกฤษ
    thai_translations = {
        "egg": ["ไข่", "ไข่ไก่", "ไข่เป็ด"],
        "chicken": ["ไก่", "อกไก่", "เนื้อไก่"],
        "pork": ["หมู", "หมูสับ", "เนื้อหมู"],
        "garlic": ["กระเทียม"],
        "onion": ["หอมใหญ่", "หัวหอม"],
        "cabbage": ["กะหล่ำปลี", "ผักกาด"],
        "rice": ["ข้าว", "ข้าวสวย", "ข้าวสาร"],
    }

    # 3. วนลูปแมตช์วัตถุดิบ
    for ing in recipe_ingredients:
        ing_name = ing["name"]
        found = False

        # เทียบชื่อตรงๆ
        for inv_name in user_inv_names:
            if ing_name.lower() in inv_name or inv_name in ing_name.lower():
                found = True
                break

        # เทียบผ่านคำแปลไทย
        if not found:
            base_name = ing_name.lower()
            for eng_key, translation_list in thai_translations.items():
                if eng_key in base_name:
                    for translation in translation_list:
                        for inv_name in user_inv_names:
                            if translation in inv_name:
                                found = True
                                break
                        if found:
                            break
                if found:
                    break

        ing_info = {
            "name": ing_name,
            "amount": ing.get("amount"),
            "unit": ing.get("unit"),
            "lotus_search_url": ing.get("lotus_search_url")
        }

        if found:
            available.append(ing_info)
        else:
            missing.append(ing_info)

    # 4. สร้างลิงก์สำหรับส่งรายการช้อปปิ้งของขาดเข้า Line
    line_share_url = None
    if missing:
        text_lines = [f"🛒 รายการของต้องซื้อจาก Lotus's สำหรับทำ '{recipe['title']}':"]
        for i, ing in enumerate(missing, 1):
            text_lines.append(f"{i}. {ing['name']} ({ing['amount']} {ing['unit']})")
            text_lines.append(f"   👉 https://www.lotuss.com/th/search/{quote(ing['name'])}?sort=relevance:DESC")
        
        share_text = "\n".join(text_lines)
        line_share_url = f"https://line.me/R/share?text={quote(share_text)}"

    return {
        "id": recipe["id"],
        "title": recipe["title"],
        "image": recipe["image"],
        "readyInMinutes": recipe["readyInMinutes"],
        "servings": recipe["servings"],
        "instructions": recipe["instructions"],
        "available_ingredients": available,
        "missing_ingredients": missing,
        "line_share_url": line_share_url,
        "shopping_list_ready": len(missing) > 0
    }