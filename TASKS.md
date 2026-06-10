# 📋 Project Tasks & Backlog (TASKS.md)

Task board for dividing responsibilities among team members and tracking development progress.

---

## 🛠️ 1. DevOps & Infrastructure Tasks (User / DevOps Agent)

| Task ID | Description | Assigned To | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **DO-01** | Fix missing packages in `requirements.txt` | DevOps Agent | `DONE` 🟢 | Added `PyJWT` and `bcrypt`. |
| **DO-02** | Move and configure root-level Docker Compose | DevOps Agent | `DONE` 🟢 | Set up health checks and volume mounts. |
| **DO-03** | Create documentation guides (`skill.md`, `AGENTS.md`, `MEMORY.md`) | DevOps Agent | `DONE` 🟢 | Completed. |
| **DO-04** | Configure `.env` and test local docker-compose run | User | `TODO` 🟡 | Awaiting API keys setup. |
| **DO-05** | Setup CI/CD pipelines with GitHub Actions | User / DevOps | `TODO` 🟡 | Start when core code stabilizes. |
| **DO-06** | Deploy the project stack to AWS EC2 | User / DevOps | `TODO` 🟡 | Set up before project wrap-up. |

---

## 💻 2. Backend & API Tasks (Backend Developer / Backend Agent)

| Task ID | Description | Assigned To | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **BE-01** | Develop authentication APIs (Register, Login, Logout) | Backend Dev | `DONE` 🟢 | Basic auth system complete. |
| **BE-02** | Develop food and nutrition query APIs | Backend Dev | `TODO` 🟡 | Connect to OpenFoodFacts / Spoonacular. |
| **BE-03** | Implement API endpoint to receive image uploads for AI detection | Backend Dev | `TODO` 🟡 | Coordinate payload format with AI Dev. |
| **BE-04** | Review database performance and optimize query indices | Backend Dev | `TODO` 🟡 | Index high-frequency lookup fields. |

---

## 🎨 3. Frontend & UI Tasks (Frontend Developer / Frontend Agent)

| Task ID | Description | Assigned To | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **FE-01** | Initialize React + Vite + TS in `/frontend` directory | Frontend Dev | `DONE` 🟢 | Bootstrapped with Next.js 16 App Router + Tailwind v4 + TypeScript. |
| **FE-02** | Design Auth UI (Login/Register) using Tailwind CSS | Frontend Dev | `TODO` 🟡 | Focus on premium aesthetics. |
| **FE-03** | Integrate Register/Login APIs with frontend state | Frontend Dev | `TODO` 🟡 | Store JWT token in local storage/memory. |
| **FE-04** | Build Dashboard UI for nutrition analysis and visualizations | Frontend Dev | `TODO` 🟡 | Integrate Recharts for graphing. |

---

## 🧠 4. AI & Computer Vision Tasks (AI Developer / Research Agent)

| Task ID | Description | Assigned To | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **AI-01** | Set up YOLOv8 model for food classification | AI Dev | `TODO` 🟡 | Preparing datasets / pre-trained model. |
| **AI-02** | Configure Gemini API integration for personalized advice | AI Dev | `TODO` 🟡 | Structure system prompts and conversation flows. |
| **AI-03** | Integrate YOLOv8 detection logic into main backend service | AI Dev / Backend | `TODO` 🟡 | Package prediction code as helper module. |
