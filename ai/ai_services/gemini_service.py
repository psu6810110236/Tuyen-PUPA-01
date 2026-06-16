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
        "Carefully analyze this image and identify ALL food items, ingredients, drinks, condiments, and grocery products visible.\n"
        "For each detected item, determine its location in the image as a 2D bounding box `[ymin, xmin, ymax, xmax]` normalized to [0, 1000] (0 is top/left, 1000 is bottom/right).\n"
        "Also estimate the visible quantity/count and determine the appropriate Thai unit and category.\n\n"
        "Fields description:\n"
        "- name: Thai name of the ingredient (e.g., 'ไข่ไก่', 'นมสด', 'อกไก่', 'มะเขือเทศ', 'แอปเปิ้ล')\n"
        "- quantity: A float or integer representing the count/amount of the item visible\n"
        "- unit: The Thai unit (e.g., 'ฟอง', 'ขวด', 'ชิ้น', 'กล่อง', 'ลูก', 'หัว', 'กรัม', 'ถุง')\n"
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
