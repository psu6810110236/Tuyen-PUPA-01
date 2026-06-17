import requests
import json

# 1. Login to get token
login_url = "http://localhost:8000/auth/login"
res_login = requests.post(login_url, data={"username": "devopstest", "password": "testpass"})
if res_login.status_code != 200:
    # If user doesn't exist, register first
    print("User devopstest not found. Registering...")
    reg_url = "http://localhost:8000/auth/register"
    requests.post(reg_url, json={"username": "devopstest", "password": "testpass", "full_name": "DevOps Test User"})
    res_login = requests.post(login_url, data={"username": "devopstest", "password": "testpass"})

token = res_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Clear current refrigerator items
inv_url = "http://localhost:8000/inventory"
res_inv = requests.get(inv_url, headers=headers)
for item in res_inv.json():
    item_id = item["id"]
    requests.delete(f"{inv_url}/{item_id}", headers=headers)
print("✅ Cleared old inventory.")

# 3. Add ingredients for Omelet (ไข่เจียว)
# Omelet requires: 2 eggs (ไข่) and 1 soy sauce (ซีอิ๊วขาว)
requests.post(f"{inv_url}/manual", headers=headers, json={"name": "ไข่ไก่", "quantity": 10.0, "unit": "ฟอง", "category": "protein"})
requests.post(f"{inv_url}/manual", headers=headers, json={"name": "ซีอิ๊วขาว", "quantity": 5.0, "unit": "ช้อนโต๊ะ", "category": "sauce"})
print("✅ Added 10 Eggs and 5 Soy Sauce to refrigerator.")

# 4. Check Omelet Recipe detail comparison (ID: 104)
recipe_url = "http://localhost:8000/recipes/104"
res_recipe = requests.get(recipe_url, headers=headers)
recipe_data = res_recipe.json()
print(f"\n🍳 Recipe Detail: {recipe_data['title']}")
print(f"Available ingredients: {[i['name'] for i in recipe_data['available_ingredients']]}")
print(f"Missing ingredients: {[i['name'] for i in recipe_data['missing_ingredients']]}")

# 5. Cook Omelet (ID: 104) -> Deduct stock and log calories
cook_url = "http://localhost:8000/recipes/104/cook"
print("\n🔥 Cooking Omelet (Deducting stock + Logging calories)...")
res_cook = requests.post(cook_url, headers=headers)
print(json.dumps(res_cook.json(), indent=2, ensure_ascii=False))

# 6. Verify refrigerator items remaining
res_inv = requests.get(inv_url, headers=headers)
print("\n📦 Remaining Inventory in refrigerator:")
try:
    inv_data = res_inv.json()
    if isinstance(inv_data, list):
        for item in inv_data:
            print(f"- {item['name']}: {item['quantity']} {item['unit']}")
    else:
        print(f"⚠️ Failed to load inventory as list (status code {res_inv.status_code}): {res_inv.text}")
except Exception as e:
    print(f"⚠️ Exception decoding inventory: {e}, Raw response: {res_inv.text}")

# 7. Check Daily Calorie & Nutrition Summary
summary_url = "http://localhost:8000/nutrition/today"
res_summary = requests.get(summary_url, headers=headers)
print("\n📊 Today's Nutrition Summary:")
print(json.dumps(res_summary.json(), indent=2, ensure_ascii=False))

# 8. Test Calorie Estimation using Gemini AI
estimate_url = "http://localhost:8000/nutrition/estimate"
print("\n🔮 Requesting Gemini AI Calorie Estimation for 'กะเพราไก่ไข่ดาว'...")
res_estimate = requests.get(estimate_url, headers=headers, params={"food_name": "กะเพราไก่ไข่ดาว"})
print(json.dumps(res_estimate.json(), indent=2, ensure_ascii=False))

# 9. Test Searching Recipe for "ไข่เจียว"
search_url = "http://localhost:8000/recipes/search"
print("\n🔍 Searching for recipe 'ไข่เจียว'...")
res_search = requests.get(search_url, headers=headers, params={"q": "ไข่เจียว"})
print(json.dumps(res_search.json(), indent=2, ensure_ascii=False))

