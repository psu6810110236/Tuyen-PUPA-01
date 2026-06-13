import json
import time
from google import genai
from google.genai import types
from ai_services.config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_VISION_MODEL

client = genai.Client(api_key=GEMINI_API_KEY)


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
) -> list[str]:
    """
    วิเคราะห์รูปภาพ ถ้า quota หมด → คืน list ว่าง ไม่ขึ้น error
    """
    prompt = (
        "You are a food ingredient detector. "
        "Look at this image and list all food ingredients or grocery items you can see. "
        "Return ONLY a JSON array of ingredient names in English, lowercase. "
        'Example: ["egg", "chicken", "garlic", "tomato"]. '
        "If you cannot identify any food, return an empty array []."
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    result = _call_with_retry(
        lambda: client.models.generate_content(
            model=GEMINI_VISION_MODEL, contents=[image_part, prompt]
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
        "คุณคือผู้ช่วย AI ด้านอาหารและโภชนาการ ตอบเป็นภาษาไทย กระชับ และเป็นมิตร\n\n"
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
