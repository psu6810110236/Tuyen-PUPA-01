from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # กำหนดค่าตัวแปรและประเภทข้อมูล ถ้าไม่มีใน .env จะดึงค่า default มาใช้
    DATABASE_URL: str = "postgresql+psycopg2://myuser:mypassword@127.0.0.1:5432/mydatabase"

    # บอกให้ Pydantic ไปอ่านค่าจากไฟล์ .env
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()