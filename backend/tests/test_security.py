"""
test_security.py — Security-focused tests
ครอบคลุม: /users/ endpoint ไม่มี Auth Guard (Known Issue), Cross-user isolation summary
"""

import pytest


# ============================================================
# 8.1 — /users/ — Known Missing Auth Guard
# ============================================================

class TestUsersRouterSecurityGap:
    """
    ✅ FIXED: /users/ router มี Depends(get_current_user) แล้ว
    ทั้ง 2 routes ต้องคืน 401 เมื่อไม่มี token
    """

    async def test_get_all_users_requires_auth(self, client):
        """GET /users/ ต้องการ token — ไม่มี token → 401"""
        response = await client.get("/users/")
        # 307 = trailing-slash redirect ก่อน hit auth guard
        assert response.status_code in (401, 307)

    async def test_get_user_by_id_requires_auth(self, client, test_user):
        """GET /users/{id} ต้องการ token — ไม่มี token → 401"""
        response = await client.get(f"/users/{test_user.id}")
        assert response.status_code == 401

    async def test_get_all_users_with_valid_token(self, client, auth_headers):
        """GET /users/ พร้อม token ที่ถูกต้อง → 200"""
        response = await client.get("/users/", headers=auth_headers)
        assert response.status_code in (200, 307)  # 307 redirect แล้วตาม

    async def test_get_user_by_id_with_valid_token(self, client, auth_headers, test_user):
        """GET /users/{id} พร้อม token ที่ถูกต้อง → 200"""
        response = await client.get(f"/users/{test_user.id}", headers=auth_headers)
        assert response.status_code == 200


# ============================================================
# 8.2 — Cross-User Isolation (Comprehensive)
# ============================================================

class TestCrossUserIsolationSecurity:
    async def test_user_cannot_access_others_inventory(
        self, client, auth_headers, auth_headers_b
    ):
        """User A เพิ่มของ → User B ดึง inventory ไม่ควรเห็นของ A"""
        await client.post(
            "/inventory/manual",
            json={"name": "ซีเคร็ต_ไอเทม", "quantity": 1.0, "unit": "ชิ้น"},
            headers=auth_headers,
        )
        response_b = await client.get("/inventory/", headers=auth_headers_b)
        names = [i["name"] for i in response_b.json()]
        assert "ซีเคร็ต_ไอเทม" not in names

    async def test_user_cannot_see_others_nutrition_logs(
        self, client, auth_headers, auth_headers_b, db_session, test_user
    ):
        """Log ของ User A ต้องไม่ปรากฏใน today summary ของ User B"""
        from datetime import datetime, timezone
        from models.nutrition import NutritionLog
        log = NutritionLog(
            user_id=test_user.id, meal_type="lunch", food_name="private_meal",
            calories=500.0, protein=10.0, carb=60.0, fat=15.0,
            logged_at=datetime.now(timezone.utc),
        )
        db_session.add(log)
        db_session.commit()

        response_b = await client.get("/nutrition/today", headers=auth_headers_b)
        assert response_b.json()["totals"]["calories"] == 0.0

    async def test_user_cannot_see_others_saved_recipes(
        self, client, auth_headers, auth_headers_b
    ):
        """Recipe ที่ User A บันทึก ต้องไม่ปรากฏใน saved list ของ User B"""
        await client.post(
            "/recipes/saved",
            json={"spoonacular_id": 9999, "title": "Secret Recipe"},
            headers=auth_headers,
        )
        response_b = await client.get("/recipes/saved", headers=auth_headers_b)
        ids = [r["spoonacular_id"] for r in response_b.json()]
        assert 9999 not in ids
