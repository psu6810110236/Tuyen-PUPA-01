import httpx
from ai_services.gemini_service import analyze_food_image
from ai_services.config import BACKEND_URL


async def detect_and_add_to_fridge(
    image_bytes: bytes, mime_type: str, token: str, user_id: int = None
) -> dict:
    """
    1. รับรูปภาพ
    2. ส่งให้ Gemini Vision วิเคราะห์หาวัตถุดิบ
    3. เพิ่มวัตถุดิบที่พบเข้าตู้เย็นของ user ผ่าน backend API
    """
    # ขั้น 1: วิเคราะห์รูป
    ingredients = await analyze_food_image(image_bytes, mime_type)

    if not ingredients:
        return {
            "success": False,
            "message": "ไม่พบวัตถุดิบในรูปภาพ",
            "ingredients_found": [],
            "added_count": 0,
        }

    # ขั้น 2: เพิ่มเข้าตู้เย็นผ่าน backend
    added = []
    failed = []

    async with httpx.AsyncClient() as client:
        for name in ingredients:
            try:
                res = await client.post(
                    f"{BACKEND_URL}/inventory/manual",
                    json={
                        "name": name,
                        "quantity": 1,
                        "unit": "ชิ้น",
                        "category": "other",
                        "added_by": "scan",
                    },
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10.0,
                )
                if res.status_code == 201:
                    added.append(name)
                else:
                    failed.append(name)
            except Exception as e:
                print(f"Failed to add {name}: {e}")
                failed.append(name)

    return {
        "success": True,
        "message": f"พบ {len(ingredients)} รายการ เพิ่มสำเร็จ {len(added)} รายการ",
        "ingredients_found": ingredients,
        "added": added,
        "failed": failed,
        "added_count": len(added),
    }
