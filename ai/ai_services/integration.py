import httpx
from ai_services.config import BACKEND_URL


async def get_fridge_items(token: str) -> list:
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{BACKEND_URL}/inventory/",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if res.status_code == 200:
                return res.json()
            return []
        except Exception:
            return []


async def get_recipe_suggestions(token: str) -> list:
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{BACKEND_URL}/recipes/suggest",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if res.status_code == 200:
                return res.json()
            return []
        except Exception:
            return []


async def get_recipe_detail(recipe_id: int, token: str) -> dict:
    """
    ดึงข้อมูลสูตรอาหารจาก backend ของภู
    """
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{BACKEND_URL}/recipes/{recipe_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if res.status_code == 200:
                return res.json()
            return {}
        except Exception:
            return {}


async def check_missing_ingredients(token: str, recipe_id: int) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{BACKEND_URL}/recipes/{recipe_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if res.status_code == 200:
                return res.json()
            return {}
        except Exception:
            return {}
