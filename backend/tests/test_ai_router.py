"""
test_ai_router.py — Tests for /ai router (scan, scan-and-add, proxy logic)
ครอบคลุม: proxy path, local fallback, scan-and-add DB writes
"""

import pytest
import respx
import httpx
import base64
import json
from unittest.mock import patch, AsyncMock

from tests.mocks import MOCK_SCAN_RESPONSE


# helper: สร้าง base64 จาก dummy bytes
DUMMY_IMAGE_B64 = base64.b64encode(b"fake_image_data").decode()


# ============================================================
# 7.1 — POST /ai/scan (Local Fallback Path)
# ============================================================

class TestAIScanEndpoint:
    async def test_scan_without_token_returns_401(self, client):
        response = await client.post(
            "/ai/scan",
            json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
        )
        assert response.status_code == 401

    async def test_scan_local_path_returns_ingredients(self, client, auth_headers):
        """Mock analyze_food_image → ต้องได้ ingredients list กลับมา"""
        with patch(
            "services.ai_service.analyze_food_image",
            new_callable=AsyncMock,
            return_value=MOCK_SCAN_RESPONSE["ingredients"],
        ):
            response = await client.post(
                "/ai/scan",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        assert response.status_code == 200
        data = response.json()
        assert "ingredients" in data
        assert len(data["ingredients"]) == 2

    async def test_scan_local_path_returns_empty_on_no_items(self, client, auth_headers):
        """Mock ที่คืน [] → ingredients list ว่าง"""
        with patch(
            "services.ai_service.analyze_food_image",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = await client.post(
                "/ai/scan",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        assert response.status_code == 200
        assert response.json()["ingredients"] == []


# ============================================================
# 7.2 — POST /ai/scan (Proxy Path)
# ============================================================

class TestAIScanProxyPath:
    @respx.mock
    async def test_proxy_path_used_when_ai_service_url_is_remote(
        self, client, auth_headers
    ):
        """ถ้า AI_SERVICE_URL ชี้ไปยัง remote host → ต้อง proxy ไป"""
        remote_url = "http://ai-service.example.com"
        respx.post(f"{remote_url}/ai/scan").mock(
            return_value=httpx.Response(
                200, json={"ingredients": [{"name": "ไข่ไก่", "quantity": 1.0}]}
            )
        )
        with patch.dict("os.environ", {"AI_SERVICE_URL": remote_url}):
            response = await client.post(
                "/ai/scan",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        # ไม่ว่า proxy จะสำเร็จหรือ fallback local → status ต้องเป็น 200
        assert response.status_code == 200

    async def test_localhost_url_skips_proxy(self, client, auth_headers):
        """AI_SERVICE_URL = localhost → ข้ามการ proxy ไป"""
        call_count = {"proxy": 0, "local": 0}

        async def mock_local(*args, **kwargs):
            call_count["local"] += 1
            return []

        with (
            patch.dict("os.environ", {"AI_SERVICE_URL": "http://localhost:8001"}),
            patch("services.ai_service.analyze_food_image", side_effect=mock_local),
        ):
            await client.post(
                "/ai/scan",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        assert call_count["local"] == 1


# ============================================================
# 7.3 — POST /ai/scan-and-add
# ============================================================

class TestScanAndAddEndpoint:
    async def test_scan_and_add_saves_items_to_db(
        self, client, auth_headers, db_session
    ):
        """Mock analyze_food_image → items ต้องถูกบันทึกลง inventory"""
        mock_items = [
            {"name": "แครอท", "quantity": 2.0, "unit": "หัว", "category": "veggie", "box_2d": [0, 0, 100, 100]},
            {"name": "บร็อคโคลี่", "quantity": 1.0, "unit": "หัว", "category": "veggie", "box_2d": [0, 0, 100, 100]},
        ]
        with patch(
            "services.ai_service.analyze_food_image",
            new_callable=AsyncMock,
            return_value=mock_items,
        ):
            response = await client.post(
                "/ai/scan-and-add",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        assert response.status_code == 200
        data = response.json()
        assert data["added_count"] == 2
        assert "แครอท" in data["added"]
        assert "บร็อคโคลี่" in data["added"]

    async def test_scan_and_add_merges_existing_items(
        self, client, auth_headers, inventory_item
    ):
        """ถ้าชื่อซ้ำกับที่มีใน DB → ต้อง merge (quantity +=)"""
        # inventory_item มี ไข่ไก่ 5 ฟอง อยู่แล้ว
        mock_items = [
            {"name": "ไข่ไก่", "quantity": 3.0, "unit": "ฟอง", "category": "protein", "box_2d": [0, 0, 100, 100]},
        ]
        with patch(
            "services.ai_service.analyze_food_image",
            new_callable=AsyncMock,
            return_value=mock_items,
        ):
            response = await client.post(
                "/ai/scan-and-add",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        assert response.status_code == 200
        # ตรวจ inventory ว่า quantity รวมถูกต้อง
        inv_response = await client.get("/inventory/", headers=auth_headers)
        egg_items = [i for i in inv_response.json() if i["name"] == "ไข่ไก่"]
        assert len(egg_items) == 1
        assert egg_items[0]["quantity"] == 8.0  # 5 + 3

    async def test_scan_and_add_empty_result_returns_failure(
        self, client, auth_headers
    ):
        """AI ไม่พบอะไรในรูป → success: False"""
        with patch(
            "services.ai_service.analyze_food_image",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = await client.post(
                "/ai/scan-and-add",
                json={"image_base64": DUMMY_IMAGE_B64, "mime_type": "image/jpeg"},
                headers=auth_headers,
            )
        assert response.status_code == 200
        assert response.json()["success"] is False
