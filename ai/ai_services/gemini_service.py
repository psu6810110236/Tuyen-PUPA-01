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
                time.sleep(wait)
            else:
                print(f"[gemini_service] Call failed: {e}")
                return None
    return None


async def analyze_food_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> list:
    prompt = (
        "You are an expert refrigerator content analyzer. "
        "Your task is to identify ONLY items that belong inside a refrigerator or freezer. "
        "This includes: raw meats, seafood, vegetables, fruits, dairy products (milk, cheese, butter, yogurt, eggs), "
        "drinks/beverages, condiments (sauces, ketchup, mustard, mayonnaise), leftovers, tofu, and packaged food. "
        "DO NOT detect: people, hands, furniture, kitchen appliances, utensils, plates, bowls, bags, boxes that are clearly NOT food, "
        "walls, floors, or any non-food items. "
        "BE PRECISE with bounding boxes — each box must tightly fit around only that specific item. "
        "DO NOT overlap boxes. DO NOT group multiple items into one box. "
        "For each item found, return a JSON array with: name (in Thai if possible), x, y, width, height as percentage (0-100) of image dimensions. "
        "Example: ["
        '{"name": "ไข่ไก่", "x": 60, "y": 5, "width": 30, "height": 20}, '
        '{"name": "นมสด", "x": 5, "y": 5, "width": 15, "height": 25}'
        "]. "
        "Return ONLY the JSON array, no explanation. If no refrigerator items found, return []."
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    result = _call_with_retry(
        lambda: client.models.generate_content(
            model=GEMINI_VISION_MODEL,
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                temperature=0.1,
                top_p=0.8,
            ),
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
