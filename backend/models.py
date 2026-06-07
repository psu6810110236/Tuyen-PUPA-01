from sqlalchemy import Column,Integer,String,ForeignKey
from database import Base  # นำเข้า Base ที่เราสร้างไว้ใน database.py เพื่อใช้เป็นคลาสหลักในการสร้างตาราง
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)