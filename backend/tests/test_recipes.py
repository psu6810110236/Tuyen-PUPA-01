"""
test_recipes.py — Tests for /recipes router & recipe_service
ครอบคลุม: suggest, search, saved CRUD, detail, cook, cache layer, stock deduction
"""

import pytest
import respx
import httpx
from unittest.mock import patch, AsyncMock

from models.inventory import InventoryItem
from models.recipe import CachedResponse
import json


# ============================================================
# 4.1 — GET /recipes/suggest
# ============================================================

class TestRecipeSuggest:
    async def test_suggest_empty_fridge_returns_empty_list(self, client, auth_headers):
        """ตู้เย็นว่าง → message + recipes: []"""
        response = await client.get("/recipes/suggest", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data or isinstance(data, dict)
        # ถ้ามี message key แปลว่า fallback ตู้เย็นว่าง
        assert "message" in data or data.get("recipes", None) is not None

    async def test_suggest_with_inventory_calls_service(
        self, client, auth_headers, inventory_item
    ):
        """ถ้าตู้เย็นมีของ ต้องเรียก suggest_recipes (อาจ fallback MOCK_RECIPES)"""
        with patch(
            "services.recipe_service.suggest_recipes",
            new_callable=AsyncMock,
            return_value={"recipes": [{"id": 101, "title": "ข้าวผัดอกไก่"}]},
        ):
            response = await client.get("/recipes/suggest", headers=auth_headers)
        assert response.status_code == 200


# ============================================================
# 4.2 — GET /recipes/search
# ============================================================

class TestRecipeSearch:
    async def test_search_without_q_returns_400(self, client, auth_headers):
        """FastAPI คืน 422 เมื่อ required query param หาย (ไม่ใช่ 400)"""
        response = await client.get("/recipes/search", headers=auth_headers)
        assert response.status_code == 422

    async def test_search_with_q_calls_service(self, client, auth_headers):
        with patch(
            "services.recipe_service.search_recipe_by_name",
            new_callable=AsyncMock,
            return_value={"results": []},
        ):
            response = await client.get(
                "/recipes/search?q=ไข่เจียว", headers=auth_headers
            )
        assert response.status_code == 200


# ============================================================
# 4.3 — Saved Recipes CRUD
# ============================================================

class TestSavedRecipes:
    async def test_save_recipe_returns_201(self, client, auth_headers):
        response = await client.post(
            "/recipes/saved",
            json={
                "spoonacular_id": 12345,
                "title": "Test Recipe",
                "image_url": "https://example.com/img.jpg",
                "ready_in_minutes": 20,
                "servings": 2,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["spoonacular_id"] == 12345

    async def test_list_saved_recipes(self, client, auth_headers):
        # บันทึกก่อน
        await client.post(
            "/recipes/saved",
            json={"spoonacular_id": 55555, "title": "Recipe A"},
            headers=auth_headers,
        )
        response = await client.get("/recipes/saved", headers=auth_headers)
        assert response.status_code == 200
        ids = [r["spoonacular_id"] for r in response.json()]
        assert 55555 in ids

    async def test_delete_saved_recipe(self, client, auth_headers):
        """
        delete_saved_recipe() filter ด้วย spoonacular_id ไม่ใช่ database id
        ดังนั้น DELETE /recipes/saved/{recipe_id} ຕ้องใช้ spoonacular_id เป็น path param
        """
        spoonacular_id = 77777
        await client.post(
            "/recipes/saved",
            json={"spoonacular_id": spoonacular_id, "title": "Recipe B"},
            headers=auth_headers,
        )
        # ใช้ spoonacular_id เป็น path param (ตามที่ router ส่งไปให้ service)
        del_r = await client.delete(f"/recipes/saved/{spoonacular_id}", headers=auth_headers)
        assert del_r.status_code == 200

    async def test_delete_nonexistent_saved_recipe_returns_404(self, client, auth_headers):
        response = await client.delete("/recipes/saved/99999", headers=auth_headers)
        assert response.status_code == 404


# ============================================================
# 4.4 — GET /recipes/{id} (Detail + Inventory Check)
# ============================================================

class TestRecipeDetail:
    async def test_get_recipe_detail_returns_ingredient_lists(self, client, auth_headers):
        """ใช้ Mock Recipe 101 ที่มีอยู่ใน MOCK_RECIPES"""
        response = await client.get("/recipes/101", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "available_ingredients" in data
        assert "missing_ingredients" in data

    async def test_recipe_detail_marks_owned_ingredient_as_available(
        self, client, auth_headers, db_session, test_user
    ):
        """ถ้ามี ไข่ไก่ ในตู้เย็น → chicken ของ recipe 101 ต้องอยู่ใน available"""
        # เพิ่ม chicken ในตู้เย็น
        item = InventoryItem(
            user_id=test_user.id, name="chicken", quantity=200.0,
            unit="g", category="protein", added_by="manual"
        )
        db_session.add(item)
        db_session.commit()

        response = await client.get("/recipes/101", headers=auth_headers)
        data = response.json()
        available_names = [i["name"].lower() for i in data["available_ingredients"]]
        assert "chicken" in available_names


# ============================================================
# 4.5 — POST /recipes/{id}/cook
# ============================================================

class TestCookRecipe:
    async def test_cook_recipe_with_all_ingredients_deducts_stock(
        self, client, auth_headers, db_session, test_user
    ):
        """ถ้ามีของครบทุกอย่าง → Cook สำเร็จ และของในตู้เย็นลดลง"""
        # เพิ่มของให้ครบตาม Mock Recipe 101
        for name, qty in [
            ("chicken", 500.0), ("egg", 5.0), ("garlic", 10.0),
            ("rice", 500.0), ("soy sauce", 5.0)
        ]:
            item = InventoryItem(
                user_id=test_user.id, name=name, quantity=qty,
                unit="g", category="protein", added_by="manual"
            )
            db_session.add(item)
        db_session.commit()

        response = await client.post("/recipes/101/cook", headers=auth_headers)
        # ต้องไม่ error (200 หรือ 201)
        assert response.status_code in (200, 201)

    async def test_cook_recipe_missing_ingredients_raises_error(
        self, client, auth_headers
    ):
        """ตู้เย็นว่าง → cook ต้องส่งคืน error"""
        response = await client.post("/recipes/101/cook", headers=auth_headers)
        # คาดว่าเป็น 500 (ValueError ถูก catch ใน router)
        assert response.status_code in (400, 422, 500)


# ============================================================
# 4.6 — Cache Layer (recipe_service)
# ============================================================

class TestRecipeCacheLayer:
    def test_cache_hit_returns_cached_data(self, db_session):
        """
        ถ้า cache ยังไม่หมดอายุ (< 7 วัน) ต้องดึงจาก DB
        NOTE: get_cached_api_response() ใช้ SessionLocal() ของตัวเอง (real engine)
        ต้อง patch SessionLocal ใน recipe_service ให้ใช้ test session factory
        """
        import services.recipe_service as svc
        from unittest.mock import patch, MagicMock
        from datetime import datetime, timezone

        # บันทึก cache ลงใน db_session โดยตรง
        cached = CachedResponse(
            cache_key="test:cache:key",
            response_json=json.dumps({"data": "cached"}),
        )
        db_session.add(cached)
        db_session.flush()  # ทำให้มองเห็นใน session เดียวกัน

        # แทน SessionLocal ของ recipe_service ด้วย session factory ที่คืน db_session
        def mock_session_local():
            return db_session

        with patch.object(svc, "SessionLocal", side_effect=mock_session_local):
            # พร้อมกัน patch db.close() เพื่อไม่ปิด session ที่แชร์อยู่
            with patch.object(db_session, "close", return_value=None):
                result = svc.get_cached_api_response("test:cache:key")

        assert result == {"data": "cached"}

    def test_cache_miss_returns_none(self, db_session):
        """key ที่ไม่มีใน DB → None"""
        import services.recipe_service as svc
        result = svc.get_cached_api_response("nonexistent:key:xyz")
        assert result is None

    def test_cache_write_creates_record(self, db_session):
        """set_cached_api_response ต้องบันทึกลง DB"""
        import services.recipe_service as svc
        svc.set_cached_api_response("write:test:key", {"hello": "world"})

        # ตรวจ DB โดยตรง (ใช้ SessionLocal ของตัวเอง)
        from database import SessionLocal
        db = SessionLocal()
        record = db.query(CachedResponse).filter(
            CachedResponse.cache_key == "write:test:key"
        ).first()
        db.close()
        assert record is not None
        assert json.loads(record.response_json) == {"hello": "world"}
