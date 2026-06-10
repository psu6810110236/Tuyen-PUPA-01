# 💾 Project Memory & Decisions Log (MEMORY.md)

This log tracks architectural design decisions, the current project state, and the upcoming roadmap. It helps both human developers and AI assistants maintain context across work sessions.

---

## 📌 1. Current Project State

- **Backend**: FastAPI app with basic authentication, recipe suggestions, and daily nutrition logs. Supports SQLite for local non-docker testing.
- **Frontend**: The `/frontend` directory contains Next.js App Router setup with shadcn/ui components (ChatView, HomeView, RecipeView, ScannerView) added by team members.
- **Database**: PostgreSQL 15 setup in Docker Compose. SQLite database (`test.db`) used for local developer staging.
- **DevOps**: Centralized root Docker orchestration with health checks, local python venv setup, and `.gitignore` updated to prevent database file exposure.

---

## 🛠️ 2. Key Decisions & Resolved Issues

| Date | Topic / Resolved Issue | Details & Rationale |
| :--- | :--- | :--- |
| **Jun 09, 2026** | **Centralized Docker Compose** | Moved Docker Compose configurations to the root directory to run database and backend via a single command: `docker compose up --build`. |
| **Jun 09, 2026** | **Hot-Reloading in Docker** | Added volume mounting for backend (`./backend:/app`) allowing python changes to trigger instant updates without rebuilding containers. |
| **Jun 09, 2026** | **Backend Dependency Fixes** | Added missing packages `PyJWT` and `bcrypt` to [backend/requirements.txt](file:///E:/PUPA-Tuyen/backend/requirements.txt) to fix import crashes in [auth.py](file:///E:/PUPA-Tuyen/backend/Routers/auth.py). |
| **Jun 09, 2026** | **Created AI Guidelines (skill.md)** | Established [skill.md](file:///E:/PUPA-Tuyen/skill.md) to standardize code writing and AI assistant behaviors across the project. |
| **Jun 10, 2026** | **Swagger UI OAuth2 Fix** | Modified `/auth/login` endpoint parameter to accept `OAuth2PasswordRequestForm` instead of JSON schema, enabling Swagger UI's "Authorize" password flow to work cleanly. |
| **Jun 10, 2026** | **SQLite Local Testing** | Defaulted `DATABASE_URL` in `.env` to SQLite (`sqlite:///./test.db`) for fast non-docker development and local testing. Added `*.db` and `*.sqlite3` to `.gitignore`. |
| **Jun 10, 2026** | **Grocery MCP Integration** | Implemented `check_missing_ingredients_tool` in [recipe_mcp.py](file:///E:/PUPA-Tuyen/backend/mcp_Servers/recipe_mcp.py) and appended `lotus_search_url` to ingredient details in [recipe_service.py](file:///E:/PUPA-Tuyen/backend/services/recipe_service.py) to enable automated Lotus's online shopping link generation. |
| **Jun 10, 2026** | **Swagger Mock Test Route** | Added `GET /recipes/test-mock/{recipe_id}` to allow instant visual testing of ingredient comparison and Lotus's link generation directly in Swagger UI. |

---

## 🛣️ 3. Project Roadmap

### 🟩 Short-Term (Immediate Tasks)
- [x] Scaffold the frontend boilerplate (React + Vite + TS) in `/frontend` (Done by Frontend Developer using Next.js).
- [ ] Add credentials and API keys to the root `.env` file (e.g., Gemini and Spoonacular keys).
- [ ] Run `docker compose up --build` to test local PostgreSQL database and API connection.
- [ ] Integrate the new Lotus's shopping list link into the frontend pages (`RecipeView.tsx`).

### 🟨 Medium-Term (Feature Development)
- [x] Design Spoonacular/OpenFoodFacts API connections for food nutrition queries (API integrated in backend recipe/nutrition services).
- [ ] Create frontend login/register pages with premium styling using Tailwind CSS.
- [ ] Integrate Gemini API into the backend for smart nutrition chatting and photo recognition.

### 🟦 Long-Term (Deployment & Production)
- [ ] Setup CI/CD pipelines via GitHub Actions.
- [ ] Secure production configurations and deploy the stack to AWS EC2.
