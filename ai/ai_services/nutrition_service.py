import json
from google.genai import types
from ai_services.config import GEMINI_MODEL, GEMINI_VISION_MODEL
from ai_services.gemini_service import _call_with_retry, client


async def analyze_nutrition(food_name: str) -> dict:
    """
    วิเคราะห์แคลอรี่และสารอาหารจากชื่ออาหาร
    """
    prompt = (
        f"Analyze the nutritional content of: {food_name}\n"
        "Return ONLY a JSON object with these fields:\n"
        "{\n"
        '  "food_name": "ชื่ออาหาร",\n'
        '  "calories": 000,\n'
        '  "protein": 00,\n'
        '  "carbs": 00,\n'
        '  "fat": 00,\n'
        '  "fiber": 00,\n'
        '  "serving_size": "1 serving",\n'
        '  "summary": "สรุปสั้นๆ เป็นภาษาไทย"\n'
        "}\n"
        "All numeric values are in grams except calories (kcal)."
    )

    result = _call_with_retry(
        lambda: client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    )

    if result is None:
        return {
            "food_name": food_name,
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "serving_size": "1 serving",
            "summary": "ไม่สามารถวิเคราะห์ได้ในขณะนี้",
        }

    try:
        text = result.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {
            "food_name": food_name,
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "serving_size": "1 serving",
            "summary": "ไม่สามารถวิเคราะห์ได้ในขณะนี้",
        }


async def analyze_nutrition_from_image(
    image_bytes: bytes, mime_type: str = "image/jpeg"
) -> dict:
    """
    วิเคราะห์แคลอรี่จากรูปภาพอาหาร
    """
    prompt = (
        "Look at this food image and analyze its nutritional content.\n"
        "Return ONLY a JSON object with these fields:\n"
        "{\n"
        '  "food_name": "ชื่ออาหารที่เห็นในรูป",\n'
        '  "calories": 000,\n'
        '  "protein": 00,\n'
        '  "carbs": 00,\n'
        '  "fat": 00,\n'
        '  "fiber": 00,\n'
        '  "serving_size": "ปริมาณโดยประมาณ",\n'
        '  "summary": "สรุปสั้นๆ เป็นภาษาไทย"\n'
        "}\n"
        "All numeric values are in grams except calories (kcal)."
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    result = _call_with_retry(
        lambda: client.models.generate_content(
            model=GEMINI_VISION_MODEL, contents=[image_part, prompt]
        )
    )

    if result is None:
        return {
            "food_name": "ไม่ทราบ",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "serving_size": "1 serving",
            "summary": "ไม่สามารถวิเคราะห์ได้ในขณะนี้",
        }

    try:
        text = result.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {
            "food_name": "ไม่ทราบ",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "serving_size": "1 serving",
            "summary": "ไม่สามารถวิเคราะห์ได้ในขณะนี้",
        }
