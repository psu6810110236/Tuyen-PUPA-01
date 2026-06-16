# /ai/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# ติดตั้งไลบรารีที่จำเป็น
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดทั้งหมด
COPY . .

# เปิดพอร์ต 8001
EXPOSE 8001

# รัน AI Service
CMD ["python", "main.py"]
