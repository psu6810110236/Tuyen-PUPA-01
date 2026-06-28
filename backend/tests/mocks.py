"""
mocks.py — Mock utilities สำหรับ External Services

ใช้ respx เพื่อ intercept HTTP requests แทน:
- Google OAuth tokeninfo endpoint
- Spoonacular API
- AI Service HTTP proxy
"""

import respx
import httpx


# -------------------------------------------------
# 1. Google OAuth Mock
# -------------------------------------------------
def mock_google_valid_token(client_id: str = "test-google-client-id"):
    """Mock Google tokeninfo endpoint ที่ส่งคืน valid response"""
    return respx.get("https://oauth2.googleapis.com/tokeninfo").mock(
        return_value=httpx.Response(
            200,
            json={
                "aud": client_id,
                "email": "mockuser@gmail.com",
                "email_verified": "true",
                "sub": "google-uid-12345",
                "name": "Mock User",
            },
        )
    )


def mock_google_invalid_token():
    """Mock Google tokeninfo endpoint ที่ส่งคืน invalid response"""
    return respx.get("https://oauth2.googleapis.com/tokeninfo").mock(
        return_value=httpx.Response(400, json={"error": "invalid_token"})
    )


# -------------------------------------------------
# 2. Spoonacular API Mock
# -------------------------------------------------
MOCK_SPOONACULAR_SEARCH = {
    "results": [
        {"id": 999, "title": "Test Recipe", "image": "https://example.com/img.jpg", "readyInMinutes": 20, "servings": 2}
    ]
}

MOCK_SPOONACULAR_DETAIL = {
    "id": 999,
    "title": "Test Recipe",
    "readyInMinutes": 20,
    "servings": 2,
    "instructions": "Mix and cook.",
    "extendedIngredients": [
        {"name": "chicken", "amount": 100.0, "unit": "g"},
        {"name": "salt", "amount": 1.0, "unit": "tsp"},
    ],
}


# -------------------------------------------------
# 3. AI Service Mock Responses
# -------------------------------------------------
MOCK_SCAN_RESPONSE = {
    "ingredients": [
        {"name": "ไข่ไก่", "quantity": 1.0, "unit": "ฟอง", "category": "protein", "box_2d": [100, 100, 300, 300]},
        {"name": "นมสด", "quantity": 1.0, "unit": "กล่อง", "category": "dairy", "box_2d": [400, 100, 600, 300]},
    ]
}

MOCK_NUTRITION_RESPONSE = {
    "food_name": "ข้าวผัด",
    "calories": 350.0,
    "protein": 12.0,
    "carbs": 55.0,
    "fat": 8.0,
    "summary": "ประมาณการโดย Gemini AI",
}
