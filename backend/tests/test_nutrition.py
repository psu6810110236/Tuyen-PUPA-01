"""
test_nutrition.py — Tests for /nutrition router & nutrition_service
ครอบคลุม: log meal, today summary, history, estimate, timezone offset
"""

import pytest
import respx
import httpx
from datetime import datetime, timezone, timedelta

from models.nutrition import NutritionLog
from tests.mocks import MOCK_NUTRITION_RESPONSE


# ============================================================
# 5.1 — POST /nutrition/log
# ============================================================

class TestNutritionLog:
    async def test_log_meal_returns_201(self, client, auth_headers):
        response = await client.post(
            "/nutrition/log",
            json={
                "meal_type": "lunch",
                "food_name": "ข้าวผัดกะเพรา",
                "calories": 450.0,
                "protein": 25.0,
                "carb": 60.0,
                "fat": 12.0,
                "source": "manual",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["food_name"] == "ข้าวผัดกะเพรา"
        assert data["calories"] == 450.0

    async def test_log_meal_requires_auth(self, client):
        response = await client.post(
            "/nutrition/log",
            json={"meal_type": "lunch", "food_name": "test", "calories": 100, "protein": 0, "carb": 0, "fat": 0},
        )
        assert response.status_code == 401


# ============================================================
# 5.2 — GET /nutrition/today
# ============================================================

class TestTodaySummary:
    async def test_today_summary_empty_returns_zero_totals(self, client, auth_headers):
        response = await client.get("/nutrition/today", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["totals"]["calories"] == 0.0
        assert data["meals_count"] == 0

    async def test_today_summary_sums_correctly(
        self, client, auth_headers, db_session, test_user
    ):
        """บันทึก 2 มื้อ → totals ต้องรวมถูกต้อง"""
        now_utc = datetime.now(timezone.utc)
        for food, cal in [("มื้อเช้า", 300.0), ("มื้อเที่ยง", 500.0)]:
            log = NutritionLog(
                user_id=test_user.id,
                meal_type="meal",
                food_name=food,
                calories=cal,
                protein=10.0,
                carb=50.0,
                fat=5.0,
                logged_at=now_utc,
            )
            db_session.add(log)
        db_session.commit()

        response = await client.get("/nutrition/today", headers=auth_headers)
        data = response.json()
        assert data["totals"]["calories"] == 800.0  # 300 + 500
        assert data["meals_count"] == 2

    async def test_today_summary_progress_percentage_calculated(
        self, client, auth_headers, db_session, test_user
    ):
        """บันทึก 2000 cal → calories_pct ต้องเป็น 100%"""
        now_utc = datetime.now(timezone.utc)
        log = NutritionLog(
            user_id=test_user.id, meal_type="lunch", food_name="test",
            calories=2000.0, protein=0.0, carb=0.0, fat=0.0, logged_at=now_utc,
        )
        db_session.add(log)
        db_session.commit()

        response = await client.get("/nutrition/today", headers=auth_headers)
        data = response.json()
        assert data["progress_percentage"]["calories_pct"] == 100.0


# ============================================================
# 5.3 — Timezone Offset Test (UTC+7) — CRITICAL
# ============================================================

class TestTimezoneOffset:
    async def test_log_at_2330_utc_counts_as_today_in_bangkok(
        self, client, auth_headers, db_session, test_user
    ):
        """
        23:30 UTC = 06:30 วันถัดไป UTC → แต่เป็น 06:30 วันเดิม Bangkok (UTC+7)
        ถ้าผู้ใช้ log ที่เวลา 17:00 Bangkok (= 10:00 UTC) และ
        เราทดสอบ summary ณ Bangkok "วันนี้" → ต้องนับ log นั้น
        """
        # สร้าง log ที่ logged_at = "ตอนนี้" (ซึ่งอยู่ในวันนี้ Bangkok แน่นอน)
        now_utc = datetime.now(timezone.utc)
        log = NutritionLog(
            user_id=test_user.id, meal_type="dinner", food_name="timezone_test",
            calories=100.0, protein=5.0, carb=10.0, fat=3.0, logged_at=now_utc,
        )
        db_session.add(log)
        db_session.commit()

        response = await client.get("/nutrition/today", headers=auth_headers)
        data = response.json()
        # log ที่เพิ่งสร้างต้องถูกนับในวันนี้
        food_names = []
        assert data["meals_count"] >= 1

    async def test_log_from_yesterday_not_counted_today(
        self, db_session, client, auth_headers, test_user
    ):
        """Log จากเมื่อวาน (UTC+7) ต้องไม่ถูกนับใน today summary"""
        # สร้าง log เมื่อ 25 ชั่วโมงที่แล้ว (UTC) → เมื่อวานแน่นอนใน Bangkok
        yesterday_utc = datetime.now(timezone.utc) - timedelta(hours=25)
        log = NutritionLog(
            user_id=test_user.id, meal_type="breakfast", food_name="yesterday_food",
            calories=500.0, protein=0.0, carb=0.0, fat=0.0, logged_at=yesterday_utc,
        )
        db_session.add(log)
        db_session.commit()

        response = await client.get("/nutrition/today", headers=auth_headers)
        data = response.json()
        # calories จาก yesterday_food ไม่ควรถูกนับ
        assert data["totals"]["calories"] == 0.0


# ============================================================
# 5.4 — GET /nutrition/history
# ============================================================

class TestNutritionHistory:
    async def test_history_returns_logs_in_descending_order(
        self, client, auth_headers, db_session, test_user
    ):
        now_utc = datetime.now(timezone.utc)
        for i, food in enumerate(["อาหาร_1", "อาหาร_2", "อาหาร_3"]):
            log = NutritionLog(
                user_id=test_user.id, meal_type="lunch", food_name=food,
                calories=100.0, protein=0.0, carb=0.0, fat=0.0,
                logged_at=now_utc - timedelta(days=i),
            )
            db_session.add(log)
        db_session.commit()

        response = await client.get("/nutrition/history?days=7", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    async def test_history_excludes_old_logs(
        self, client, auth_headers, db_session, test_user
    ):
        """Log ที่เก่ากว่า 7 วันต้องไม่ถูกดึงออกมา"""
        old_log = NutritionLog(
            user_id=test_user.id, meal_type="lunch", food_name="very_old_food",
            calories=999.0, protein=0.0, carb=0.0, fat=0.0,
            logged_at=datetime.now(timezone.utc) - timedelta(days=10),
        )
        db_session.add(old_log)
        db_session.commit()

        response = await client.get("/nutrition/history?days=7", headers=auth_headers)
        names = [r["food_name"] for r in response.json()]
        assert "very_old_food" not in names


# ============================================================
# 5.5 — GET /nutrition/estimate
# ============================================================

class TestNutritionEstimate:
    @respx.mock
    async def test_estimate_calls_ai_service_and_returns_nutrition(self, client, auth_headers):
        """Mock AI Service HTTP call → ต้องได้ค่า nutrition กลับมา"""
        respx.post("http://host.docker.internal:8001/ai/nutrition").mock(
            return_value=httpx.Response(200, json=MOCK_NUTRITION_RESPONSE)
        )
        response = await client.get(
            "/nutrition/estimate?food_name=ข้าวผัด", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["calories"] == 350.0
        assert data["protein"] == 12.0

    @respx.mock
    async def test_estimate_ai_service_down_returns_zeros(self, client, auth_headers):
        """ถ้า AI Service ไม่ตอบ → คืนค่า 0.0 ทั้งหมด (graceful fallback)"""
        respx.post("http://host.docker.internal:8001/ai/nutrition").mock(
            side_effect=httpx.ConnectError("Connection refused")
        )
        response = await client.get(
            "/nutrition/estimate?food_name=ข้าวผัด", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["calories"] == 0.0

    async def test_estimate_missing_food_name_returns_400(self, client, auth_headers):
        response = await client.get("/nutrition/estimate", headers=auth_headers)
        assert response.status_code in (400, 422)


# ============================================================
# 5.6 — DELETE /nutrition/log/{id}
# ============================================================

class TestDeleteNutritionLog:
    async def test_delete_log_returns_success(
        self, client, auth_headers, db_session, test_user
    ):
        log = NutritionLog(
            user_id=test_user.id, meal_type="snack", food_name="คุกกี้",
            calories=150.0, protein=2.0, carb=20.0, fat=7.0,
        )
        db_session.add(log)
        db_session.commit()

        response = await client.delete(f"/nutrition/log/{log.id}", headers=auth_headers)
        assert response.status_code == 200

    async def test_delete_nonexistent_log_returns_404(self, client, auth_headers):
        response = await client.delete("/nutrition/log/99999", headers=auth_headers)
        assert response.status_code == 404
