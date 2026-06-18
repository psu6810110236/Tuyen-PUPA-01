# /frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# คัดลอกเฉพาะ package เพื่อทำแคชในการติดตั้งไลบรารี
COPY package*.json ./
RUN npm ci

# คัดลอกซอร์สโค้ดที่เหลือทั้งหมด
COPY . .

# รับค่าตัวแปรระบบสำหรับการฝังในขั้นตอน Build Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

# สั่ง Build หน้าเว็บ Next.js
RUN npm run build

# เปิดพอร์ต 3000 สำหรับการเชื่อมต่อ
EXPOSE 3000

# รันระบบในโหมด Production
CMD ["npm", "run", "start"]
