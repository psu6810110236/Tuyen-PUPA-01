import json
import time
from pydantic import BaseModel
from google import genai
from google.genai import types
from ai_services.config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_VISION_MODEL

client = genai.Client(api_key=GEMINI_API_KEY)


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
                wait = (attempt + 1) * 10
                time.sleep(wait)
            else:
                return None
    return None


async def analyze_food_image(
    image_bytes: bytes, mime_type: str = "image/jpeg"
) -> list[dict]:
    """
    วิเคราะห์รูปภาพเพื่อหาวัตถุดิบและจำนวน/หน่วย/หมวดหมู่
    """
    prompt = (
        "You are an expert food and grocery detector.\n"
        "Carefully analyze this image and detect ALL individual food items, ingredients, drinks, condiments, and grocery products visible. "
        "Be thorough and highly specific about brand names, product types, packaging, and flavors when visible.\n\n"
        "CRITICAL INSTRUCTIONS FOR OBJECT DETECTION:\n"
        "1. Every single physical item (e.g., each individual bottle of sauce, each can of Coke, each fruit, etc.) must be detected as a SEPARATE, INDIVIDUAL entry in the JSON array. Do NOT group them together.\n"
        "2. Do NOT merge different kinds of items (like different sauces) or even multiple identical items (like 3 separate cans of Coke) into a single entry or a single large bounding box. Detect them as separate instances (e.g., 3 separate entries for 3 cans of Coke, each with its own bounding box and quantity of 1.0).\n"
        "3. Overlapping or stacked items (such as stacked eggs, or items placed close to or behind one another) must still be detected individually. Locate and return a bounding box for each individual item, even if it is partially occluded or overlapping.\n"
        "4. Pay close attention to items inside transparent or opaque packaging, plastic wraps, trays, boxes, and cartons (like meat trays, milk cartons, juice boxes, and sauce cartons). Do not overlook them.\n"
        "5. If you detect a physical object but cannot identify or recognize what food, drink, or ingredient it is, set its name to 'ไม่รู้จัก' (in Thai) instead of guessing incorrectly.\n"
        "6. For each detected item, determine its precise location in the image as a 2D bounding box `[ymin, xmin, ymax, xmax]` normalized to [0, 1000] (0 is top/left, 1000 is bottom/right) tightly wrapping that specific object.\n"
        "7. Estimate the visible quantity (usually 1.0 for a single physical instance) and determine the appropriate Thai unit and category.\n\n"
        "Fields description:\n"
        "- name: Specific name of the item in Thai (e.g., 'นมสดพาสเจอร์ไรส์เมจิ', 'เนยถั่วสคิปปี้', 'ไข่ไก่สด', 'น้ำมะเขือเทศดอยคำ', 'อกไก่เบทาโกร', 'โค้กรสออริจินัล'). "
        "Be as specific and detailed as possible. Translate brand names and product types into common, recognizable Thai grocery terms. "
        "If you see an object but cannot identify it, write 'ไม่รู้จัก'.\n"
        "- quantity: A float or integer representing the count/amount of this specific item instance (typically 1.0)\n"
        "- unit: The Thai unit (e.g., 'ฟอง', 'ขวด', 'ชิ้น', 'กล่อง', 'ลูก', 'หัว', 'กรัม', 'ถุง', 'กระป๋อง')\n"
        "- category: One of 'protein', 'veggie', 'fruit', 'dairy', 'grain', 'other'\n"
        "- box_2d: Bounding box `[ymin, xmin, ymax, xmax]` normalized to [0, 1000]\n"
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=list[DetectedItem],
    )

    result = _call_with_retry(
        lambda: client.models.generate_content(
            model=GEMINI_VISION_MODEL, 
            contents=[image_part, prompt],
            config=config
        )
    )

    if result is None:
        return []

    try:
        text = result.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return []


async def chat_with_gemini(message: str, history: list = []) -> str:
    """
    แชทกับ Gemini ถ้า quota หมด → คืนข้อความปกติ ไม่ขึ้น error
    """
    prompt = (
        "คุณคือผู้ช่วย AI ด้านอาหารและโภชนาการ ตอบเป็นภาษาไทย กระชับ และเป็นมิตร\n"
        "เมื่อแนะนำเมนูอาหาร ให้บอกข้อมูลโภชนาการโดยประมาณด้วยทุกครั้ง ได้แก่ แคลอรี่ (kcal) โปรตีน (g) คาร์โบไฮเดรต (g) และไขมัน (g)\n\n"
    )

    for msg in history:
        role = "ผู้ใช้" if msg.get("role") == "user" else "AI"
        prompt += f"{role}: {msg.get('content')}\n"

    prompt += f"ผู้ใช้: {message}\nAI:"

    result = _call_with_retry(
        lambda: client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    )

    if result is None:
        return "ขออภัยครับ กรุณาลองใหม่อีกครั้ง 🙏"

    return result.text
