import httpx
from ai_services.gemini_service import analyze_food_image
from ai_services.config import BACKEND_URL


def normalize_box(box):
    if not isinstance(box, list) or len(box) != 4:
        return [0, 0, 100, 100]
    try:
        coords = [float(x) for x in box]
        max_val = max(coords)
        
        # If coordinates are in [0.0, 1.0] range (floats)
        if max_val <= 1.0:
            coords = [x * 100.0 for x in coords]
        # If coordinates are in [0, 1000] range (standard Gemini format)
        elif max_val > 100.0:
            coords = [x / 10.0 for x in coords]
            
        coords = [max(0.0, min(100.0, x)) for x in coords]
        return coords
    except Exception:
        return [0, 0, 100, 100]


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

    # ขั้น 2: เพิ่มเข้าตู้เย็นผ่าน backend แบบ Bulk (Enterprise standard)
    added = []
    failed = []
    
    bulk_items = [
        {
            "name": item.get("name", ""),
            "quantity": float(item.get("quantity", 1.0)),
            "unit": item.get("unit", "ชิ้น"),
            "category": item.get("category", "other"),
            "added_by": "scan",
        }
        for item in ingredients if item.get("name")
    ]

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{BACKEND_URL}/inventory/bulk",
                json={"items": bulk_items},
                headers={"Authorization": f"Bearer {token}"},
                timeout=15.0,
            )
            if res.status_code == 201:
                added = ingredients
            else:
                print(f"Bulk add failed with status {res.status_code}: {res.text}")
                failed = ingredients
        except Exception as e:
            print(f"Bulk add request exception: {e}")
            failed = ingredients

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
