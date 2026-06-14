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

# 🌟 High-Fidelity Mock Recipes for Fallback
MOCK_RECIPES = {
    101: {
        "id": 101,
        "title": "ข้าวผัดอกไก่ (Chicken Fried Rice)",
        "image": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
        "readyInMinutes": 15,
        "servings": 2,
        "instructions": "1. หั่นอกไก่เป็นชิ้นพอดีคำ\n2. ตั้งกระทะใส่น้ำมันเจียวกระเทียมให้หอม\n3. ใส่อกไก่ลงไปผัดจนสุก\n4. ใส่ไข่ไก่ ยีให้สุก แล้วใส่ข้าวสวยลงไปผัด\n5. ปรุงรสด้วยซีอิ๊วขาวและพริกไทย ผัดให้เข้ากัน พร้อมเสิร์ฟ",
        "extendedIngredients": [
            {"name": "chicken", "amount": 150.0, "unit": "g", "lotus_search_url": "https://www.lotuss.com/th/search/chicken?sort=relevance:DESC"},
            {"name": "egg", "amount": 1.0, "unit": "piece", "lotus_search_url": "https://www.lotuss.com/th/search/egg?sort=relevance:DESC"},
            {"name": "garlic", "amount": 2.0, "unit": "cloves", "lotus_search_url": "https://www.lotuss.com/th/search/garlic?sort=relevance:DESC"},
            {"name": "rice", "amount": 150.0, "unit": "g", "lotus_search_url": "https://www.lotuss.com/th/search/rice?sort=relevance:DESC"},
            {"name": "soy sauce", "amount": 1.0, "unit": "tablespoon", "lotus_search_url": "https://www.lotuss.com/th/search/soy%20sauce?sort=relevance:DESC"}
        ]
    },
    102: {
        "id": 102,
        "title": "แกงจืดเต้าหู้หมูสับ (Tofu and Minced Pork Soup)",
        "image": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
        "readyInMinutes": 20,
        "servings": 3,
        "instructions": "1. ปั้นหมูสับเป็นก้อนกลม\n2. ต้มน้ำซุปให้เดือด ใส่หมูสับลงไปต้มจนสุก\n3. ใส่เต้าหู้ขาวและผักกาดขาวลงไป\n4. ปรุงรสด้วยซีอิ๊วขาวและเกลือ\n5. โรยหน้าด้วยต้นหอม ผักชี พร้อมเสิร์ฟ",
        "extendedIngredients": [
            {"name": "pork", "amount": 100.0, "unit": "g", "lotus_search_url": "https://www.lotuss.com/th/search/pork?sort=relevance:DESC"},
            {"name": "tofu", "amount": 1.0, "unit": "block", "lotus_search_url": "https://www.lotuss.com/th/search/tofu?sort=relevance:DESC"},
            {"name": "cabbage", "amount": 100.0, "unit": "g", "lotus_search_url": "https://www.lotuss.com/th/search/cabbage?sort=relevance:DESC"},
            {"name": "soy sauce", "amount": 1.0, "unit": "tablespoon", "lotus_search_url": "https://www.lotuss.com/th/search/soy%20sauce?sort=relevance:DESC"}
        ]
    },
    103: {
        "id": 103,
        "title": "ผัดกะเพราไข่ดาว (Pad Kra Pao with Fried Egg)",
        "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        "readyInMinutes": 10,
        "servings": 1,
        "instructions": "1. ทอดไข่ดาวให้กรอบตามชอบ ตักพักไว้\n2. โขลกพริกกับกระเทียมให้พอหยาบ\n3. ตั้งกระทะเจียวพริกกระเทียมให้หอม ใส่เนื้อสัตว์ลงไปผัดจนสุก\n4. ปรุงรสด้วยซีอิ๊วขาว ซอสหอยนางรม และน้ำตาลเล็กน้อย\n5. ใส่ใบกะเพรา ผัดเร็วๆ แล้วตักราดข้าว เสิร์ฟพร้อมไข่ดาว",
        "extendedIngredients": [
            {"name": "pork", "amount": 150.0, "unit": "g", "lotus_search_url": "https://www.lotuss.com/th/search/pork?sort=relevance:DESC"},
            {"name": "egg", "amount": 1.0, "unit": "piece", "lotus_search_url": "https://www.lotuss.com/th/search/egg?sort=relevance:DESC"},
            {"name": "garlic", "amount": 2.0, "unit": "cloves", "lotus_search_url": "https://www.lotuss.com/th/search/garlic?sort=relevance:DESC"},
            {"name": "basil", "amount": 1.0, "unit": "handful", "lotus_search_url": "https://www.lotuss.com/th/search/basil?sort=relevance:DESC"},
            {"name": "soy sauce", "amount": 1.0, "unit": "tablespoon", "lotus_search_url": "https://www.lotuss.com/th/search/soy%20sauce?sort=relevance:DESC"}
        ]
    }
}

# Helper สำหรับยิง Request ไปยัง Spoonacular ป้องกันโค้ดซ้ำซ้อน
async def _fetch_from_spoonacular(endpoint: str, params: dict = None) -> dict:
    if not SPOONACULAR_KEY or SPOONACULAR_KEY == "your_spoonacular_api_key_here":
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
    try:
        if not SPOONACULAR_KEY or SPOONACULAR_KEY == "your_spoonacular_api_key_here":
            raise ValueError("Placeholder API Key detected")

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
    except Exception as e:
        print(f"[recipe_service] Suggest fallback triggered: {e}")
        # สร้างรายการสูตรอาหารจำลองพร้อมคำนวณวัตถุดิบที่มีและขาด
        result = []
        user_ings_lower = [i.lower() for i in ingredients]
        thai_translations = {
            "egg": ["ไข่", "ไข่ไก่", "ไข่เป็ด"],
            "chicken": ["ไก่", "อกไก่", "เนื้อไก่"],
            "pork": ["หมู", "หมูสับ", "เนื้อหมู"],
            "garlic": ["กระเทียม"],
            "cabbage": ["กะหล่ำปลี", "ผักกาด"],
            "rice": ["ข้าว", "ข้าวสวย"],
        }
        for r_id, r in MOCK_RECIPES.items():
            used_count = 0
            missed_count = 0
            for ing in r["extendedIngredients"]:
                ing_name = ing["name"].lower()
                matched = False
                for u_ing in user_ings_lower:
                    if u_ing in ing_name or ing_name in u_ing:
                        matched = True
                        break
                if not matched:
                    # ลองเช็กภาษาไทยแปล
                    for eng_key, th_list in thai_translations.items():
                        if eng_key in ing_name:
                            for th_word in th_list:
                                for u_ing in user_ings_lower:
                                    if th_word in u_ing:
                                        matched = True
                                        break
                                if matched:
                                    break
                        if matched:
                            break
                if matched:
                    used_count += 1
                else:
                    missed_count += 1
            
            result.append({
                "id": r["id"],
                "title": r["title"],
                "image": r["image"],
                "usedIngredientCount": used_count,
                "missedIngredientCount": missed_count
            })
        return result

# 🔍 2. ดึงรายละเอียดเชิงลึกของเมนูอาหารรายตัว
async def get_recipe_detail(recipe_id: int) -> dict:
    try:
        # หากส่ง ID ในกลุ่มจำลองมา ให้ดึงข้อมูลจำลองเลยโดยไม่ต้องยิง API
        if recipe_id in MOCK_RECIPES:
            return MOCK_RECIPES[recipe_id]

        if not SPOONACULAR_KEY or SPOONACULAR_KEY == "your_spoonacular_api_key_here":
            raise ValueError("Placeholder API Key detected")

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
    except Exception as e:
        print(f"[recipe_service] Detail fallback triggered for recipe {recipe_id}: {e}")
        # Default ไปที่ข้าวผัดอกไก่หากเรียกข้อมูลอื่นไม่สำเร็จ
        return MOCK_RECIPES.get(recipe_id, MOCK_RECIPES[101])

# 🔎 3. ค้นหาเมนูอาหารผ่านการพิมพ์ชื่อค้นหาตรงๆ
async def search_recipe_by_name(name: str) -> list[dict]:
    try:
        if not SPOONACULAR_KEY or SPOONACULAR_KEY == "your_spoonacular_api_key_here":
            raise ValueError("Placeholder API Key detected")
        params = {"query": name, "number": 10}
        data = await _fetch_from_spoonacular("complexSearch", params)
        
        return [{
            "id": r["id"],
            "title": r["title"],
            "image": r.get("image"),
            "readyInMinutes": r.get("readyInMinutes", 0)
        } for r in data.get("results", [])]
    except Exception as e:
        print(f"[recipe_service] Search fallback triggered for {name}: {e}")
        result = []
        name_lower = name.lower()
        for r_id, r in MOCK_RECIPES.items():
            if name_lower in r["title"].lower():
                result.append({
                    "id": r["id"],
                    "title": r["title"],
                    "image": r["image"],
                    "readyInMinutes": r["readyInMinutes"]
                })
        if not result:
            result = [{
                "id": r["id"],
                "title": r["title"],
                "image": r["image"],
                "readyInMinutes": r["readyInMinutes"]
            } for r in MOCK_RECIPES.values()]
        return result

# 💾 4. บันทึกเมนูอาหารลงฐานข้อมูลจริง
async def save_recipe(user_id: int, recipe_data: dict, db: Session) -> RecipeSaved:
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
    recipe = await get_recipe_detail(recipe_id)
    recipe_ingredients = recipe.get("extendedIngredients", [])

    inventory_items = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
    user_inv_names = [item.name.lower() for item in inventory_items]

    available = []
    missing = []

    thai_translations = {
        "egg": ["ไข่", "ไข่ไก่", "ไข่เป็ด"],
        "chicken": ["ไก่", "อกไก่", "เนื้อไก่"],
        "pork": ["หมู", "หมูสับ", "เนื้อหมู"],
        "garlic": ["กระเทียม"],
        "onion": ["หอมใหญ่", "หัวหอม"],
        "cabbage": ["กะหล่ำปลี", "ผักกาด"],
        "rice": ["ข้าว", "ข้าวสวย", "ข้าวสาร"],
    }

    for ing in recipe_ingredients:
        ing_name = ing["name"]
        found = False

        for inv_name in user_inv_names:
            if ing_name.lower() in inv_name or inv_name in ing_name.lower():
                found = True
                break

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