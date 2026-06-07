from sqlalchemy import Column, Integer, String
from database import Base  # ดึงมาจาก database.py ตัวนอกตรงๆ

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)