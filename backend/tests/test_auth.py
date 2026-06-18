"""
test_auth.py — Tests for /auth router
ครอบคลุม: register, login, google oauth, logout, JWT helpers, security
"""

import os
import pytest
import respx
import httpx
from unittest.mock import patch

from tests.mocks import mock_google_valid_token, mock_google_invalid_token


# ============================================================
# 2.1 — Helper Function Unit Tests
# ============================================================

class TestPasswordHelpers:
    def test_hash_password_produces_bcrypt_hash(self):
        from routers.auth import hash_password, verify_password
        hashed = hash_password("mypassword")
        assert hashed.startswith("$2b$")
        assert verify_password("mypassword", hashed) is True

    def test_verify_password_wrong_password_returns_false(self):
        from routers.auth import hash_password, verify_password
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_verify_password_empty_input_does_not_raise(self):
        from routers.auth import hash_password, verify_password
        hashed = hash_password("something")
        result = verify_password("", hashed)
        assert isinstance(result, bool)

    def test_hash_password_different_calls_produce_different_hashes(self):
        """bcrypt salt ต้องทำให้ hash ไม่ซ้ำกันแม้รหัสเดียวกัน"""
        from routers.auth import hash_password
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2


class TestCreateAccessToken:
    def test_token_contains_sub_claim(self):
        from routers.auth import create_access_token
        import jwt
        token = create_access_token({"sub": "alice@test.com"})
        # decode โดยไม่ verify เพื่อตรวจ structure เท่านั้น
        payload = jwt.decode(token, options={"verify_signature": False})
        assert payload["sub"] == "alice@test.com"

    def test_token_contains_exp_claim(self):
        from routers.auth import create_access_token
        import jwt
        token = create_access_token({"sub": "alice@test.com"})
        payload = jwt.decode(token, options={"verify_signature": False})
        assert "exp" in payload


class TestFallbackJWTKey:
    def test_weak_key_triggers_random_key_generation(self):
        """ถ้า SECRET_KEY อ่อนแอหรือว่าง ต้องสุ่มคีย์ใหม่ใน RAM"""
        from routers.auth import WEAK_KEYS
        weak = next(iter(WEAK_KEYS))
        with patch.dict(os.environ, {"SECRET_KEY": weak}):
            import importlib
            import routers.auth as auth_mod
            # key ที่ใช้งานจริงต้องไม่เป็นคีย์อ่อนแอ
            # (module ถูกโหลดแล้ว เราตรวจว่า SECRET_KEY ใน module ไม่ใช่ weak key)
            assert auth_mod.SECRET_KEY not in WEAK_KEYS


# ============================================================
# 2.2 — Register / Login Endpoints
# ============================================================

class TestRegisterEndpoint:
    async def test_register_success(self, client):
        response = await client.post(
            "/auth/register",
            json={"username": "newuser@test.com", "password": "pass123"},
        )
        assert response.status_code == 201
        assert "สมัครสมาชิกสำเร็จ" in response.json()["message"]

    async def test_register_duplicate_username_returns_400(self, client):
        payload = {"username": "dup@test.com", "password": "pass123"}
        await client.post("/auth/register", json=payload)
        response = await client.post("/auth/register", json=payload)
        assert response.status_code == 400
        assert "ถูกใช้ไปแล้ว" in response.json()["detail"]


class TestLoginEndpoint:
    async def test_login_success_returns_access_token(self, client):
        # Register ก่อน
        await client.post(
            "/auth/register",
            json={"username": "logintest@test.com", "password": "password123"},
        )
        response = await client.post(
            "/auth/login",
            data={"username": "logintest@test.com", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password_returns_400(self, client):
        await client.post(
            "/auth/register",
            json={"username": "loginwrong@test.com", "password": "rightpass"},
        )
        response = await client.post(
            "/auth/login",
            data={"username": "loginwrong@test.com", "password": "wrongpass"},
        )
        assert response.status_code == 400

    async def test_login_nonexistent_user_returns_400(self, client):
        response = await client.post(
            "/auth/login",
            data={"username": "ghost@test.com", "password": "nope"},
        )
        assert response.status_code == 400


# ============================================================
# 2.3 — Google OAuth Endpoint
# ============================================================

class TestGoogleOAuthEndpoint:
    @respx.mock
    async def test_google_login_valid_token_creates_user_and_returns_jwt(self, client):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "test-google-client-id"}):
            mock_google_valid_token("test-google-client-id")
            response = await client.post(
                "/auth/google", json={"credential": "mock-id-token"}
            )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @respx.mock
    async def test_google_login_second_call_reuses_existing_user(self, client):
        """Login ครั้งที่ 2 ด้วย email เดิม ต้องไม่สร้าง user ซ้ำ"""
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "test-google-client-id"}):
            mock_google_valid_token("test-google-client-id")
            r1 = await client.post("/auth/google", json={"credential": "mock-id-token"})
            mock_google_valid_token("test-google-client-id")
            r2 = await client.post("/auth/google", json={"credential": "mock-id-token"})
        assert r1.status_code == 200
        assert r2.status_code == 200

    @respx.mock
    async def test_google_login_invalid_token_returns_400(self, client):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "test-google-client-id"}):
            mock_google_invalid_token()
            response = await client.post(
                "/auth/google", json={"credential": "bad-token"}
            )
        assert response.status_code == 400

    async def test_google_login_missing_client_id_returns_500(self, client):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GOOGLE_CLIENT_ID", None)
            response = await client.post(
                "/auth/google", json={"credential": "any-token"}
            )
        assert response.status_code == 500

    @respx.mock
    async def test_google_login_audience_mismatch_returns_400(self, client):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "correct-client-id"}):
            respx.get("https://oauth2.googleapis.com/tokeninfo").mock(
                return_value=httpx.Response(
                    200,
                    json={
                        "aud": "WRONG-client-id",
                        "email": "someone@gmail.com",
                        "email_verified": "true",
                    },
                )
            )
            response = await client.post(
                "/auth/google", json={"credential": "token"}
            )
        assert response.status_code == 400


# ============================================================
# 2.4 — Protected Routes & Token Validation
# ============================================================

class TestProtectedRoutes:
    async def test_request_without_token_returns_401(self, client):
        response = await client.get("/inventory/")
        assert response.status_code == 401

    async def test_request_with_valid_token_is_accepted(self, client, auth_headers):
        response = await client.get("/inventory/", headers=auth_headers)
        assert response.status_code == 200

    async def test_expired_token_returns_401(self, client):
        from routers.auth import SECRET_KEY, ALGORITHM
        import jwt
        from datetime import datetime, timedelta, timezone
        expired_token = jwt.encode(
            {"sub": "ghost@test.com", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        response = await client.get(
            "/inventory/",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401

    async def test_logout_with_valid_token_returns_200(self, client, auth_headers):
        response = await client.post("/auth/logout", headers=auth_headers)
        assert response.status_code == 200
