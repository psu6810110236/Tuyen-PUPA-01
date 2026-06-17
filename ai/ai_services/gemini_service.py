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


async def analyze_food_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> list:
    prompt = (
        "You are an expert refrigerator content analyzer. "
        "Your task is to identify ONLY items that belong inside a refrigerator or freezer. "
        "This includes: raw meats, seafood, vegetables, fruits, dairy products (milk, cheese, butter, yogurt, eggs), "
        "drinks/beverages, condiments (sauces, ketchup, mustard, mayonnaise), leftovers, tofu, and packaged food. "
        "DO NOT detect: people, hands, furniture, kitchen appliances, utensils, plates, bowls, bags, boxes that are clearly NOT food, "
        "walls, floors, or any non-food items. "
        "For each detected item, determine its precise location in the image as a 2D bounding box [ymin, xmin, ymax, xmax] "
        "normalized to [0, 1000] (0 is top/left, 1000 is bottom/right) tightly wrapping that specific object. "
        "Estimate the visible quantity (typically 1.0 for a single physical instance).\n"
        "Name of the item MUST be in Thai, concise, and represent a clean common food ingredient (e.g. 'ไข่ไก่', 'หมูสับ', 'นมสด', 'แครอท').\n"
        "Category MUST be exactly one of: 'protein', 'veggie', 'fruit', 'dairy', 'grain', 'other'.\n"
        "Unit MUST be exactly one of: 'ชิ้น', 'ฟอง', 'กรัม', 'กิโลกรัม', 'ลิตร', 'ขวด', 'ถุง', 'กล่อง', 'หัว', 'ลูก'."
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=list[DetectedItem],
        temperature=0.1,
        top_p=0.8,
    )

    result = _call_with_retry(
        lambda: client.models.generate_content(
            model=GEMINI_VISION_MODEL,
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
