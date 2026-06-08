# 💾 Project Memory & Decisions Log (MEMORY.md)

This log tracks architectural design decisions, the current project state, and the upcoming roadmap. It helps both human developers and AI assistants maintain context across work sessions.

---

## 📌 1. Current Project State

- **Backend**: FastAPI app with basic authentication (register, login, logout) connected to PostgreSQL.
- **Frontend**: The `/frontend` directory is initialized and ready for React + Vite onboarding.
- **Database**: PostgreSQL 15 setup in Docker Compose.
- **DevOps**: Centralized root Docker orchestration with health checks and volume-mounted hot-reloading for local development.

---

## 🛠️ 2. Key Decisions & Resolved Issues

| Date | Topic / Resolved Issue | Details & Rationale |
| :--- | :--- | :--- |
| **Jun 09, 2026** | **Centralized Docker Compose** | Moved Docker Compose configurations to the root directory to run database and backend via a single command: `docker compose up --build`. |
| **Jun 09, 2026** | **Hot-Reloading in Docker** | Added volume mounting for backend (`./backend:/app`) allowing python changes to trigger instant updates without rebuilding containers. |
| **Jun 09, 2026** | **Backend Dependency Fixes** | Added missing packages `PyJWT` and `bcrypt` to [backend/requirements.txt](file:///E:/PUPA-Tuyen/backend/requirements.txt) to fix import crashes in [auth.py](file:///E:/PUPA-Tuyen/backend/Routers/auth.py). |
| **Jun 09, 2026** | **Created AI Guidelines (skill.md)** | Established [skill.md](file:///E:/PUPA-Tuyen/skill.md) to standardize code writing and AI assistant behaviors across the project. |

---

## 🛣️ 3. Project Roadmap

### 🟩 Short-Term (Immediate Tasks)
- [ ] Add credentials and API keys to the root `.env` file.
- [ ] Run `docker compose up --build` to test local database and API connection.
- [ ] Scaffold the frontend boilerplate (React + Vite + TS) in `/frontend`.

### 🟨 Medium-Term (Feature Development)
- [ ] Design Spoonacular/OpenFoodFacts API connections for food nutrition queries.
- [ ] Create frontend login/register pages with premium styling using Tailwind CSS.
- [ ] Integrate Gemini API into the backend for smart nutrition chatting and photo recognition.

### 🟦 Long-Term (Deployment & Production)
- [ ] Setup CI/CD pipelines via GitHub Actions.
- [ ] Secure production configurations and deploy the stack to AWS EC2.
