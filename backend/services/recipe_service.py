import os
import json
import httpx
from urllib.parse import quote
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timezone, timedelta

from database import SessionLocal
from models.recipe import RecipeSaved, CachedResponse
from models.inventory import InventoryItem

SPOONACULAR_KEY = os.getenv("SPOONACULAR_API_KEY")
BASE_URL = "https://api.spoonacular.com/recipes"

# 🚀 --- Caching Helpers (Enterprise Cache Layer) ---

def get_cached_api_response(cache_key: str) -> dict | list | None:
    db = SessionLocal()
    try:
        # กำหนดอายุแคชไว้ที่ 7 วัน เพื่อไม่ให้เก่าเกินไป
        expiry_limit = datetime.now(timezone.utc) - timedelta(days=7)
        cached = db.query(CachedResponse).filter(
            CachedResponse.cache_key == cache_key,
            CachedResponse.cached_at >= expiry_limit
        ).first()
        if cached:
            print(f"⚡ [Cache HIT] ค้นพบแคชสำหรับคีย์: {cache_key}")
            return json.loads(cached.response_json)
        return None
    except Exception as e:
        print(f"⚠️ [Cache Read Error] อ่านแคชล้มเหลว: {e}")
        return None
    finally:
        db.close()

def set_cached_api_response(cache_key: str, response_data: dict | list):
    db = SessionLocal()
    try:
        cached = db.query(CachedResponse).filter(CachedResponse.cache_key == cache_key).first()
        if cached:
            cached.response_json = json.dumps(response_data)
            cached.cached_at = datetime.now(timezone.utc)
        else:
            new_cache = CachedResponse(
                cache_key=cache_key,
                response_json=json.dumps(response_data)
            )
            db.add(new_cache)
        db.commit()
        print(f"💾 [Cache Saved] บันทึกแคชสำเร็จสำหรับคีย์: {cache_key}")
    except Exception as e:
        db.rollback()
        print(f"⚠️ [Cache Write Error] บันทึกแคชล้มเหลว: {e}")
    finally:
        db.close()

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
    },
    104: {
        "id": 104,
        "title": "ไข่เจียวทรงเครื่อง (Thai Omelet)",
        "image": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80",
        "readyInMinutes": 10,
        "servings": 1,
        "instructions": "1. ตอกไข่ใส่ชาม ปรุงรสด้วยซีอิ๊วขาวและพริกไทย ตีให้เข้ากัน\n2. ตั้งกระทะใส่น้ำมัน รอจนร้อนจัด\n3. เทไข่ลงไปเจียวจนขึ้นฟูและเหลืองกรอบทั้งสองด้าน\n4. ตักขึ้นสะเด็ดน้ำมัน เสิร์ฟพร้อมข้าวสวยร้อนๆ",
        "extendedIngredients": [
            {"name": "egg", "amount": 2.0, "unit": "piece", "lotus_search_url": "https://www.lotuss.com/th/search/egg?sort=relevance:DESC"},
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
                    status_code=status.HTTP_502_BAD_GATEWAY, 
                    detail=f"SPOONACULAR Error [{response.status_code}]: {response.text}"
                )
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"ไม่สามารถเชื่อมต่อไปยังผู้ให้บริการสูตรอาหารได้: {str(exc)}"
            )

# 📋 1. ค้นหาเมนูอาหารแนะนำจากวัตถุดิบที่ส่งเข้าไป
async def suggest_recipes(ingredients: list[str]) -> list[dict]:
    sorted_ingredients = sorted([i.strip().lower() for i in ingredients])
    cache_key = f"suggest_recipes:{','.join(sorted_ingredients)}"
    cached_data = get_cached_api_response(cache_key)
    if cached_data is not None:
        return cached_data

    # 1. คำนวณหา Mock Recipes ที่ผู้ใช้มีส่วนผสมหลักอยู่ด้วย (จะได้แสดงผลเมนูไทยจำลองที่เหมาะสม)
    mock_results = []
    user_ings_lower = [i.lower() for i in ingredients]
    thai_translations = {
        "egg": ["ไข่", "ไข่ไก่", "ไข่เป็ด"],
        "chicken": ["ไก่", "อกไก่", "เนื้อไก่"],
        "pork": ["หมู", "หมูสับ", "เนื้อหมู"],
        "garlic": ["กระเทียม"],
        "cabbage": ["กะหล่ำปลี", "ผักกาด"],
        "rice": ["ข้าว", "ข้าวสวย"],
        "soy sauce": ["ซีอิ๊ว", "ซีอิ๊วขาว", "ซอส"],
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
        
        # แนบเข้าผลลัพธ์ถ้าพบว่ามีวัตถุดิบตรงกันอย่างน้อย 1 รายการ
        if used_count > 0:
            mock_results.append({
                "id": r["id"],
                "title": r["title"],
                "image": r["image"],
                "usedIngredientCount": used_count,
                "missedIngredientCount": missed_count
            })

    # เรียงให้สูตรที่มีวัตถุดิบครบถ้วนที่สุดอยู่ด้านบน
    mock_results.sort(key=lambda x: x["usedIngredientCount"], reverse=True)

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
                translated_ingredients.append(item)

        ingredients_str = ",".join(translated_ingredients)
        data = await _fetch_from_spoonacular("findByIngredients", {"ingredients": ingredients_str, "number": 10, "ranking": 1})
        
        # นำรายการสูตรอาหาร Mock มาผสมร่วมและขึ้นก่อนสำหรับการสาธิตเทส
        combined_data = mock_results + data
        set_cached_api_response(cache_key, combined_data)
        return combined_data
    except Exception as e:
        print(f"[recipe_service] Suggest fallback triggered: {e}")
        # หากต่อ API ไม่ได้หรือข้อมูลเป็นศูนย์ ให้ใช้ผลลัพธ์ Mock ทั้งหมดที่มี
        if not mock_results:
            mock_results = []
            for r_id, r in MOCK_RECIPES.items():
                mock_results.append({
                    "id": r["id"],
                    "title": r["title"],
                    "image": r["image"],
                    "usedIngredientCount": 0,
                    "missedIngredientCount": len(r["extendedIngredients"])
                })
        return mock_results

# 🔍 2. ดึงรายละเอียดเชิงลึกของเมนูอาหารรายตัว
async def get_recipe_detail(recipe_id: int) -> dict:
    if recipe_id in MOCK_RECIPES:
        return MOCK_RECIPES[recipe_id]

    cache_key = f"recipe_detail:{recipe_id}"
    cached_data = get_cached_api_response(cache_key)
    if cached_data is not None:
        return cached_data

    try:
        if not SPOONACULAR_KEY or SPOONACULAR_KEY == "your_spoonacular_api_key_here":
            raise ValueError("Placeholder API Key detected")

        data = await _fetch_from_spoonacular(f"{recipe_id}/information")
        parsed_data = {
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
        set_cached_api_response(cache_key, parsed_data)
        return parsed_data
    except Exception as e:
        print(f"[recipe_service] Detail fallback triggered for recipe {recipe_id}: {e}")
        # Default ไปที่ข้าวผัดอกไก่หากเรียกข้อมูลอื่นไม่สำเร็จ
        return MOCK_RECIPES.get(recipe_id, MOCK_RECIPES[101])

# 🔎 3. ค้นหาเมนูอาหารผ่านการพิมพ์ชื่อค้นหาตรงๆ
async def search_recipe_by_name(name: str) -> list[dict]:
    cache_key = f"search_recipes:{name.strip().lower()}"
    cached_data = get_cached_api_response(cache_key)
    if cached_data is not None:
        return cached_data

    # ค้นหาใน Mock Recipes ก่อนเป็นอันดับแรก (หากคำค้นหาตรงกับภาษาไทย)
    mock_results = []
    name_lower = name.lower()
    for r_id, r in MOCK_RECIPES.items():
        if name_lower in r["title"].lower() or name_lower in r["instructions"].lower():
            mock_results.append({
                "id": r["id"],
                "title": r["title"],
                "image": r["image"],
                "readyInMinutes": r["readyInMinutes"]
            })

    try:
        if not SPOONACULAR_KEY or SPOONACULAR_KEY == "your_spoonacular_api_key_here":
            raise ValueError("Placeholder API Key detected")
        params = {"query": name, "number": 10}
        data = await _fetch_from_spoonacular("complexSearch", params)
        
        parsed_data = [{
            "id": r["id"],
            "title": r["title"],
            "image": r.get("image"),
            "readyInMinutes": r.get("readyInMinutes", 0)
        } for r in data.get("results", [])]
        
        # ผสมผลลัพธ์: เอา Mock Recipes ภาษาไทยขึ้นก่อน เพื่อให้แสดงเมนูไทยตรงใจผู้ใช้งาน
        combined_data = mock_results + parsed_data
        set_cached_api_response(cache_key, combined_data)
        return combined_data
    except Exception as e:
        print(f"[recipe_service] Search fallback triggered for {name}: {e}")
        # หากต่อ API ไม่ได้ ให้คืนค่า Mock Recipes ที่ค้นพบ (ถ้าไม่มีเลย คืน Mock ทั้งหมด)
        if not mock_results:
            mock_results = [{
                "id": r["id"],
                "title": r["title"],
                "image": r["image"],
                "readyInMinutes": r["readyInMinutes"]
            } for r in MOCK_RECIPES.values()]
        return mock_results

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
        "soy sauce": ["ซีอิ๊ว", "ซีอิ๊วขาว", "ซอส"],
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

# 🍳 8. ทำอาหาร (ตัดสต็อกตู้เย็น และบันทึกแคลอรี่สารอาหารเข้าประวัติแคลอรี่โดยอัตโนมัติ)
async def cook_recipe(user_id: int, recipe_id: int, db: Session) -> dict:
    from models.nutrition import NutritionLog
    
    # 1. ดึงรายละเอียดสูตรอาหาร
    recipe = await get_recipe_detail(recipe_id)
    recipe_ingredients = recipe.get("extendedIngredients", [])
    
    # 1.5 เช็กของขาดก่อนทำอาหาร เพื่อความถูกต้องและป้องกันการทำข้ามขั้นตอน
    inventory_check = await check_recipe_inventory(user_id, recipe_id, db)
    if inventory_check["missing_ingredients"]:
        missing_names = ", ".join([i["name"] for i in inventory_check["missing_ingredients"]])
        raise ValueError(f"วัตถุดิบไม่ครบ ไม่สามารถทำอาหารได้ (ขาด: {missing_names})")
        
    # 2. ดึงของกินทั้งหมดในตู้เย็นปัจจุบันของผู้ใช้งาน
    inventory_items = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
    
    deducted_items = []
    
    thai_translations = {
        "egg": ["ไข่", "ไข่ไก่", "ไข่เป็ด"],
        "chicken": ["ไก่", "อกไก่", "เนื้อไก่"],
        "pork": ["หมู", "หมูสับ", "เนื้อหมู"],
        "garlic": ["กระเทียม"],
        "onion": ["หอมใหญ่", "หัวหอม"],
        "cabbage": ["กะหล่ำปลี", "ผักกาด"],
        "rice": ["ข้าว", "ข้าวสวย", "ข้าวสาร"],
        "soy sauce": ["ซีอิ๊ว", "ซีอิ๊วขาว", "ซอส"],
    }
    
    # 3. ตรวจเช็คและตัดสต็อกสินค้าทีละรายการ
    for ing in recipe_ingredients:
        ing_name = ing["name"].lower()
        ing_amount = ing.get("amount", 0.0)
        
        # มองหาวัตถุดิบที่ตรงกันในตู้เย็น
        matched_item = None
        for item in inventory_items:
            # เช็กความสอดคล้องของชื่อวัตถุดิบภาษาอังกฤษและภาษาไทย
            name_matched = False
            if ing_name in item.name.lower() or item.name.lower() in ing_name:
                name_matched = True
            else:
                for eng_key, translation_list in thai_translations.items():
                    if eng_key in ing_name:
                        for translation in translation_list:
                            if translation in item.name.lower():
                                name_matched = True
                                break
                        if name_matched:
                            break
            
            if name_matched:
                matched_item = item
                break
                
        if matched_item:
            # ตรวจเช็คเครื่องปรุงหรือซอสเพื่อข้ามการตัดสต็อก
            is_seasoning = False
            seasoning_keywords = [
                "ซอส", "ซีอิ๊ว", "น้ำปลา", "เกลือ", "พริกไทย", "น้ำตาล", "น้ำมัน", "ผงปรุงรส", 
                "รสดี", "ซอสหอย", "น้ำมันหอย", "ซอสปรุงรส", "เครื่องปรุง", "ผงชูรส", "เนย",
                "sauce", "soy sauce", "fish sauce", "salt", "pepper", "sugar", "oil", "seasoning", 
                "ketchup", "vinegar", "mayonnaise", "butter", "dressing", "syrup", "paste", "condiment"
            ]
            for kw in seasoning_keywords:
                if kw in ing_name or kw in matched_item.name.lower():
                    is_seasoning = True
                    break
            
            if is_seasoning:
                # ข้ามการหักสต็อกสำหรับเครื่องปรุง/ซอส
                deducted_items.append({
                    "name": matched_item.name,
                    "deducted_amount": 0.0,
                    "unit": matched_item.unit,
                    "remaining_amount": matched_item.quantity
                })
                continue

            # คำนวณจำนวนคงเหลือหลังหักลบ
            old_qty = matched_item.quantity
            new_qty = old_qty - ing_amount
            
            if new_qty <= 0:
                db.delete(matched_item)
                deducted_qty = old_qty
            else:
                matched_item.quantity = new_qty
                db.add(matched_item)
                deducted_qty = ing_amount
            
            deducted_items.append({
                "name": matched_item.name,
                "deducted_amount": deducted_qty,
                "unit": matched_item.unit,
                "remaining_amount": max(0.0, new_qty)
            })
            
    # 4. ประมาณค่าแคลอรี่และสารอาหารของเมนูนี้ โดยส่งไปประมวลผลที่ AI Service (หรือค่าตั้งต้น)
    calories = 300.0
    protein = 15.0
    carb = 30.0
    fat = 10.0
    
    # ปรับแต่งค่าตั้งต้นแยกรายเมนูจำลองเพื่อความแม่นยำสูงสุด
    if recipe_id == 101 or "fried rice" in recipe["title"].lower():
        calories, protein, carb, fat = 550.0, 28.0, 65.0, 15.0
    elif recipe_id == 102 or "soup" in recipe["title"].lower():
        calories, protein, carb, fat = 220.0, 18.0, 10.0, 12.0
    elif recipe_id == 103 or "kra pao" in recipe["title"].lower():
        calories, protein, carb, fat = 580.0, 30.0, 60.0, 20.0
    elif recipe_id == 104 or "omelet" in recipe["title"].lower() or "ไข่เจียว" in recipe["title"]:
        calories, protein, carb, fat = 280.0, 12.0, 2.0, 24.0
        
    # พยายามยิงวิเคราะห์ละเอียดกับ AI Service พอร์ต 8001
    url = "http://host.docker.internal:8001/ai/nutrition"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"food_name": recipe["title"]}, timeout=3.0)
            if response.status_code == 200:
                ai_data = response.json()
                calories = float(ai_data.get("calories", calories))
                protein = float(ai_data.get("protein", protein))
                carb = float(ai_data.get("carbs", carb))
                fat = float(ai_data.get("fat", fat))
    except Exception as e:
        print(f"⚠️ [AI Nutrition Fallback] ใช้ค่าวิเคราะห์ฐานข้อมูลจำลองเนื่องจากติดต่อ AI Service ไม่ได้: {e}")
        
    # คำนวณประเภทมื้อตามเวลาในประเทศไทย (UTC+7)
    from datetime import timedelta, timezone
    thai_hour = (datetime.now(timezone.utc) + timedelta(hours=7)).hour
    if 5 <= thai_hour < 11:
        meal_type = "breakfast"
    elif 11 <= thai_hour < 16:
        meal_type = "lunch"
    elif 16 <= thai_hour < 22:
        meal_type = "dinner"
    else:
        meal_type = "snack"

    # 5. บันทึกมื้ออาหารลงตารางประวัติโภชนาการ (Nutrition Log)
    log_entry = NutritionLog(
        user_id=user_id,
        meal_type=meal_type,
        food_name=recipe["title"],
        calories=calories,
        protein=protein,
        carb=carb,
        fat=fat,
        source="cook"
    )
    db.add(log_entry)
    db.commit()
    
    return {
        "success": True,
        "recipe_title": recipe["title"],
        "deducted_ingredients": deducted_items,
        "logged_nutrition": {
            "food_name": recipe["title"],
            "calories": calories,
            "protein": protein,
            "carb": carb,
            "fat": fat
        }
    }