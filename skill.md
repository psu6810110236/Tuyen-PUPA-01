# 🧠 SmartFood AI - AI Coding Guidelines & Developer Standards

This guideline (`skill.md`) is designed to instruct all AI coding assistants and team members to adhere strictly to the project's coding standards and architecture.

---

## 📂 1. Project Architecture

The project uses a Monorepo structure:
- **`/backend`**: FastAPI application (Python)
- **`/frontend`**: Next.js application (TypeScript)
- **Root Directory**: Orchestration files, environment settings, and configurations (`.env`, `docker-compose.yml`)

---

## 💻 2. Backend Standards (FastAPI & Python)

- **Python Version**: `3.10`
- **Folder Directory Structure**:
  - `backend/main.py`: Application entrypoint, middleware, and router registrations.
  - `backend/models/`: SQLAlchemy database tables (inheriting from `Base` in `database.py`).
  - `backend/Routers/`: Domain-specific API routers (e.g., `auth.py` for Authentication).
- **Database & ORM**:
  - Use **SQLAlchemy ORM** exclusively. Writing raw SQL queries is prohibited.
  - Always request DB sessions using the dependency helper `get_db` to ensure secure session closure.
- **Security & Authentication**:
  - Password encryption: Use `bcrypt` (encode strings to bytes using `.encode('utf-8')` before hashing/checking).
  - Authentication: Use **JWT Token** (via `PyJWT`).
  - Route protection: Secure endpoints using the dependency `Depends(get_current_user)`.
- **Validation**:
  - Always use **Pydantic Schemas** for validating request bodies and response models.

---

## 🎨 3. Frontend Standards (Next.js + Tailwind CSS)

- **Language**: TypeScript (`.ts`, `.tsx`)
- **Styling and UI**:
  - Use **Tailwind CSS** and **shadcn/ui** for the user interface.
  - Avoid using raw inline styles unless absolutely necessary.
- **API Communication**:
  - Point API requests to the FastAPI backend URL (`http://localhost:8000`).
  - Store tokens in LocalStorage or memory, and attach them in the `Authorization: Bearer <token>` header for all authenticated requests.

---

## 🐳 4. DevOps & Docker Standards

- **Local Development**:
  - Control and spin up the system using the root [docker-compose.yml](file:///E:/PUPA-Tuyen/docker-compose.yml).
  - Do not remove or alter `healthcheck` and `depends_on: postgres_db (service_healthy)` configurations. They are critical to prevent the Backend from starting before the DB is ready.
  - Never hardcode passwords or secrets. Use the `${VARIABLE:-default_value}` format in compose files.
- **Configuration Management**:
  - When introducing a new environment variable, ensure it is added to [docker-compose.yml](file:///E:/PUPA-Tuyen/docker-compose.yml), [backend/config.py](file:///E:/PUPA-Tuyen/backend/config.py), and [.env.example](file:///E:/PUPA-Tuyen/.env.example).

---

## 🤖 5. AI Assistant Guidelines (AI Behavior Rules)

- **Communication**: Communicate and explain responses in **Thai** or English as requested by the user. Maintain a polite and professional tone.
- **Information Integrity**:
  - Whenever updating or adding Python files, ensure any new dependencies are added to [backend/requirements.txt](file:///E:/PUPA-Tuyen/backend/requirements.txt).
  - Preserve all existing comments, docstrings, and documentation within modified files unless explicitly instructed otherwise (Documentation Integrity).
- **File References**:
  - Always refer to files or code symbols using GitHub-style links like `[filename](file:///path/to/file)`.
