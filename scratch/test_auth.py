import requests
import time

def test():
    # 1. Register a random user
    username = f"testuser_{int(time.time())}"
    password = "password123"
    
    r_reg = requests.post("http://localhost:8000/auth/register", json={"username": username, "password": password})
    print(f"Register: {r_reg.status_code}")
    
    # 2. Login
    r_login = requests.post("http://localhost:8000/auth/login", data={"username": username, "password": password})
    print(f"Login: {r_login.status_code}")
    
    if r_login.status_code != 200:
        return
        
    token = r_login.json()["access_token"]
    print(f"Token received")
    
    # 3. Hit /nutrition/today
    r_nut = requests.get("http://localhost:8000/nutrition/today", headers={"Authorization": f"Bearer {token}"})
    print(f"Nutrition: {r_nut.status_code}")

if __name__ == "__main__":
    test()
