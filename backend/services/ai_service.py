import os
import json
import time
from pydantic import BaseModel
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.inventory import InventoryItem
from models.user import User

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# สร้าง Client (จะดึงจาก GEMINI_API_KEY ใน os.environ อัตโนมัติถ้าตั้งค่าไว้ แต่เราสามารถใส่เพื่อความชัวร์)
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

class DetectedItem(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str
    box_2d: list[int]

def _call_with_retry(func, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                if "limit: 20" in error_str or "daily" in error_str.lower():
                    print("[gemini_service] Daily quota exhausted. Failing fast.")
                    return None
                wait = (attempt + 1) * 2
                print(f"[gemini_service] Rate limited. Waiting {wait}s... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
            else:
                wait = (attempt + 1) * 2
                print(f"[gemini_service] Call failed: {e}. Waiting {wait}s and retrying... (Attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    return None
                time.sleep(wait)
    return None

async def chat_with_gemini(message: str, history: list) -> str:
    if not client:
        return "ขออภัยค่ะ ไม่พบการตั้งค่า GEMINI_API_KEY ในระบบ กรุณาตรวจสอบไฟล์ .env"
    
    # รวมประวัติการสนทนาเป็นข้อความเดียวเพื่อให้โมเดลเข้าใจบริบท (Stateless Memory)
    prompt = (
        "คุณคือ TUYEN AI ผู้ช่วยด้านโภชนาการส่วนตัวที่เชี่ยวชาญ เป็นมิตร และให้คำแนะนำแบบมืออาชีพ\n"
        "ใช้ภาษาไทยในการตอบ ตอบกระชับ เข้าใจง่าย และให้กำลังใจผู้ใช้\n\n"
        "--- ประวัติการสนทนาก่อนหน้า ---\n"
    )
    
    for msg in history:
        role_label = "ผู้ใช้งาน" if msg.get("role") == "user" else "TUYEN AI"
        prompt += f"{role_label}: {msg.get('content')}\n"
        
    prompt += f"\nผู้ใช้งาน: {message}\nTUYEN AI:"

    try:
        # ใช้ gemini-2.5-flash (โมเดลตัวล่าสุดและเร็วที่สุดของเวอร์ชัน flash) หรือใช้ 1.5-flash ได้เช่นกัน
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        response = await client.aio.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}"

async def generate_text(prompt: str) -> str:
    if not client:
        raise ValueError("GEMINI_API_KEY is missing")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
    )
    return response.text

async def analyze_food_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> list:
    if not client:
        return []
    prompt = (
        "You are an expert refrigerator content analyzer. "
        "Your task is to identify ONLY items that belong inside a refrigerator or freezer. "
        "This includes: raw meats, seafood, vegetables, fruits, dairy products (milk, cheese, butter, yogurt, eggs), "
        "drinks/beverages, condiments (sauces, ketchup, mustard, mayonnaise), leftovers, tofu, and packaged food. "
        "DO NOT detect: people, hands, furniture, kitchen appliances, utensils, plates, bowls, bags, boxes that are clearly NOT food, "
        "walls, floors, or any non-food items.\n"
        "CRITICAL: Do NOT group multiple separate identical items (such as multiple eggs in a tray, multiple tomatoes, or multiple beverage cans) into a single bounding box. "
        "Detect EACH individual item separately as a distinct item with a quantity of 1.0 and its own tight bounding box. "
        "For example, if you see 6 separate eggs in a carton, you must return 6 separate DetectedItem objects, each with name 'ไข่ไก่', quantity 1.0, unit 'ฟอง', and its own precise bounding box.\n"
        "For each detected item, determine its precise location in the image as a 2D bounding box [ymin, xmin, ymax, xmax] "
        "normalized to [0, 1000] (0 is top/left, 1000 is bottom/right) tightly wrapping that specific object.\n"
        "Name of the item MUST be in Thai, concise, and represent a clean common food ingredient (e.g. 'ไข่ไก่', 'หมูสับ', 'นมสด', 'แครอท').\n"
        "Category MUST be exactly one of: 'protein', 'veggie', 'fruit', 'dairy', 'grain', 'other'.\n"
        "Unit MUST be exactly one of: 'ชิ้น', 'ฟอง', 'กรัม', 'กิโลกรัม', 'ลิตร', 'ขวด', 'ถุง', 'กล่อง', 'หัว', 'ลูก'."
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    model_name = os.getenv("GEMINI_VISION_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=list[DetectedItem],
        temperature=0.1,
        top_p=0.8,
    )

    result = _call_with_retry(
        lambda: client.models.generate_content(
            model=model_name,
            contents=[image_part, prompt],
            config=config,
        )
    )

    if result is None:
        return []

    try:
        text = result.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception:
        return []

def normalize_box(box):
    if not isinstance(box, list) or len(box) != 4:
        return [0, 0, 100, 100]
    try:
        coords = [float(x) for x in box]
        max_val = max(coords)
        if max_val <= 1.0:
            coords = [x * 100.0 for x in coords]
        elif max_val > 100.0:
            coords = [x / 10.0 for x in coords]
        coords = [max(0.0, min(100.0, x)) for x in coords]
        return coords
    except Exception:
        return [0, 0, 100, 100]

async def detect_and_add_to_fridge_local(
    image_bytes: bytes, mime_type: str, db: Session, current_user: User
) -> dict:
    ingredients = await analyze_food_image(image_bytes, mime_type)
    if not ingredients:
        return {
            "success": False,
            "message": "ไม่พบวัตถุดิบในรูปภาพ",
            "ingredients_found": [],
            "added_count": 0,
        }

    added = []
    failed = []
    
    for item in ingredients:
        name = item.get("name")
        if not name:
            continue
        name_stripped = name.strip()
        unit_stripped = item.get("unit", "ชิ้น").strip()
        quantity = float(item.get("quantity", 1.0))
        category = item.get("category", "other")
        
        try:
            existing_item = db.query(InventoryItem).filter(
                InventoryItem.user_id == current_user.id,
                func.lower(InventoryItem.name) == func.lower(name_stripped)
            ).first()
            
            if existing_item:
                existing_item.quantity += quantity
                if category and category != "other":
                    existing_item.category = category
                existing_item.added_by = "scan"
                db.commit()
                db.refresh(existing_item)
            else:
                new_item = InventoryItem(
                    user_id=current_user.id,
                    name=name_stripped,
                    quantity=quantity,
                    unit=unit_stripped,
                    category=category,
                    added_by="scan"
                )
                db.add(new_item)
                db.commit()
                db.refresh(new_item)
            added.append(item)
        except Exception as e:
            print(f"Error adding scanned item to database: {e}")
            failed.append(item)
            
    return {
        "success": True,
        "message": f"พบ {len(ingredients)} รายการ เพิ่มสำเร็จ {len(added)} รายการ",
        "ingredients_found": [item.get("name", "") for item in ingredients],
        "added": [item.get("name", "") for item in added],
        "failed": [item.get("name", "") for item in failed],
        "added_count": len(added),
        "detections": [
            {
                "name": item.get("name", ""),
                "quantity": float(item.get("quantity", 1.0)),
                "unit": item.get("unit", "ชิ้น"),
                "box_2d": normalize_box(item.get("box_2d"))
            }
            for item in ingredients if item.get("name")
        ],
    }


