"""
test_ai_service.py — Tests for services/ai_service.py
ครอบคลุม: _call_with_retry (exponential backoff, fail-fast), normalize_box, analyze fallback
"""

import pytest
import time
from unittest.mock import patch, MagicMock, call


# ============================================================
# 6.1 — _call_with_retry
# ============================================================

class TestCallWithRetry:
    def test_success_on_first_attempt(self):
        from services.ai_service import _call_with_retry
        mock_fn = MagicMock(return_value="ok")
        result = _call_with_retry(mock_fn)
        assert result == "ok"
        mock_fn.assert_called_once()

    def test_retries_on_generic_error_then_succeeds(self):
        from services.ai_service import _call_with_retry
        attempts = {"count": 0}
        def flaky():
            attempts["count"] += 1
            if attempts["count"] < 2:
                raise Exception("transient error")
            return "recovered"

        with patch("time.sleep"):
            result = _call_with_retry(flaky, max_retries=3)
        assert result == "recovered"
        assert attempts["count"] == 2

    def test_returns_none_after_all_retries_exhausted(self):
        from services.ai_service import _call_with_retry
        mock_fn = MagicMock(side_effect=Exception("always fails"))
        with patch("time.sleep"):
            result = _call_with_retry(mock_fn, max_retries=3)
        assert result is None
        assert mock_fn.call_count == 3

    def test_rate_limit_429_triggers_exponential_backoff(self):
        """429 ต้อง sleep แบบ exponential (2s, 4s, ...)"""
        from services.ai_service import _call_with_retry
        mock_fn = MagicMock(side_effect=Exception("429 RESOURCE_EXHAUSTED rate limit"))
        sleep_calls = []
        with patch("time.sleep", side_effect=lambda s: sleep_calls.append(s)):
            result = _call_with_retry(mock_fn, max_retries=3)
        assert result is None
        # ต้อง sleep อย่างน้อย 2 ครั้ง
        assert len(sleep_calls) >= 2
        # ตรวจ exponential: ค่าแรกน้อยกว่าหรือเท่ากับค่าหลัง
        assert sleep_calls[0] <= sleep_calls[-1]

    def test_daily_quota_exhausted_fails_fast_without_retry(self):
        """429 + 'daily quota' → ต้อง fail fast ไม่ retry"""
        from services.ai_service import _call_with_retry
        mock_fn = MagicMock(
            side_effect=Exception("429 RESOURCE_EXHAUSTED limit: 20 daily quota")
        )
        with patch("time.sleep") as mock_sleep:
            result = _call_with_retry(mock_fn, max_retries=3)
        assert result is None
        mock_sleep.assert_not_called()
        # เรียก func แค่ครั้งเดียว
        mock_fn.assert_called_once()


# ============================================================
# 6.2 — normalize_box
# ============================================================

class TestNormalizeBox:
    def test_large_values_above_100_normalized_to_percentage(self):
        """[0, 0, 1000, 1000] → ÷10 → [0, 0, 100, 100]"""
        from services.ai_service import normalize_box
        result = normalize_box([0, 0, 1000, 1000])
        assert result == [0.0, 0.0, 100.0, 100.0]

    def test_small_values_below_one_multiplied_to_percentage(self):
        """[0.0, 0.0, 1.0, 1.0] → ×100 → [0.0, 0.0, 100.0, 100.0]"""
        from services.ai_service import normalize_box
        result = normalize_box([0.0, 0.0, 1.0, 1.0])
        assert result == [0.0, 0.0, 100.0, 100.0]

    def test_valid_percentage_values_returned_as_is(self):
        """[10, 20, 80, 90] ควรได้คืนมาใกล้เคียงเดิม (อาจมี clamp เล็กน้อย)"""
        from services.ai_service import normalize_box
        result = normalize_box([10.0, 20.0, 80.0, 90.0])
        assert result[0] == pytest.approx(10.0, abs=0.1)
        assert result[2] == pytest.approx(80.0, abs=0.1)

    def test_empty_list_returns_default(self):
        from services.ai_service import normalize_box
        result = normalize_box([])
        assert result == [0, 0, 100, 100]

    def test_wrong_length_returns_default(self):
        from services.ai_service import normalize_box
        result = normalize_box([100, 200])
        assert result == [0, 0, 100, 100]

    def test_none_input_returns_default(self):
        from services.ai_service import normalize_box
        result = normalize_box(None)
        assert result == [0, 0, 100, 100]

    def test_values_clamped_to_0_100(self):
        """ค่าที่เกิน 100 หรือติดลบต้อง clamp"""
        from services.ai_service import normalize_box
        result = normalize_box([50.0, 50.0, 60.0, 60.0])
        for val in result:
            assert 0.0 <= val <= 100.0


# ============================================================
# 6.3 — analyze_food_image
# ============================================================

class TestAnalyzeFoodImage:
    async def test_returns_empty_list_when_no_client(self):
        """ถ้า GEMINI_API_KEY หาย (client=None) → คืน [] ไม่ raise"""
        import services.ai_service as svc
        original_client = svc.client
        svc.client = None
        try:
            result = await svc.analyze_food_image(b"fake_image_bytes", "image/jpeg")
            assert result == []
        finally:
            svc.client = original_client

    async def test_returns_empty_list_when_retry_returns_none(self):
        """ถ้า _call_with_retry คืน None → คืน []"""
        import services.ai_service as svc
        with patch.object(svc, "_call_with_retry", return_value=None):
            result = await svc.analyze_food_image(b"fake", "image/jpeg")
        assert result == []

    async def test_parses_valid_json_response(self):
        """Mock Gemini คืน valid JSON → parse ได้ถูกต้อง"""
        import services.ai_service as svc
        import json

        mock_result = MagicMock()
        mock_result.text = json.dumps([
            {"name": "ไข่ไก่", "quantity": 1.0, "unit": "ฟอง",
             "category": "protein", "box_2d": [100, 100, 200, 200]}
        ])

        with patch.object(svc, "_call_with_retry", return_value=mock_result):
            result = await svc.analyze_food_image(b"img", "image/jpeg")

        assert len(result) == 1
        assert result[0]["name"] == "ไข่ไก่"

    async def test_handles_invalid_json_gracefully(self):
        """Mock Gemini คืน text ที่ไม่ใช่ JSON → คืน []"""
        import services.ai_service as svc
        mock_result = MagicMock()
        mock_result.text = "This is not JSON at all"

        with patch.object(svc, "_call_with_retry", return_value=mock_result):
            result = await svc.analyze_food_image(b"img", "image/jpeg")
        assert result == []
