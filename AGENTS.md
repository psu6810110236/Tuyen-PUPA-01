# 👥 Team & AI Agents Directory (AGENTS.md)

This directory registers the roles and responsibilities of all team members, including **Human Developers** and **AI Assistants (Agents)**, to prevent task overlap and ensure seamless collaboration.

---

## 👨‍💻 1. Human Developers

| Role | Responsibilities | Team Members |
| :--- | :--- | :--- |
| **DevOps / Project Manager** | System architecture design, environments, Docker, and CI/CD pipelines | (User / You) |
| **Backend Developer** | FastAPI development, database schemas, and API Endpoints | [Backend Developer Name] |
| **Frontend Developer** | UI development with Next.js and Tailwind CSS, API integration, and routing | [Frontend Developer Name] |
| **AI Developer** | Gemini Vision integration and AI Agent design using FastMCP | [AI Developer Name] |

---

## 🤖 2. AI Assistants (Agents)

To support the team effectively, AI Assistants are designated based on their domain expertise:

### 🛡️ 2.1 DevOps & Architect Agent (Antigravity - Active)
- **Status**: Active 🟢
- **Scope of Work**: 
  - Manage Docker, Docker Compose, deployment scripts, and CI/CD configurations.
  - Setup security and configuration files (e.g., `.env`, `.gitignore`).
  - Verify database connections and ensure smooth integration between backend and DB.
- **Completed Actions / Deliverables (June 16, 2026)**:
  - [x] Configured cryptographically secure JWT keys fallback in auth router.
  - [x] Pinned dependency library versions for backend and AI services requirements.
  - [x] Initialized Alembic database migrations and integrated startup auto-upgrade flow.
  - [x] Setup and resolved automated Playwright E2E testing architecture (100% green build).
  - [x] Resolved remote pull merge conflicts and Python indentation syntax errors on dev branch.
- **Completed Actions / Deliverables (June 17, 2026)**:
  - [x] Resolved runtime event loop exception in AI Chat Agent by migrating to async Gemini client and tools.
  - [x] Implemented refrigerator inventory stock deduction (ตัดสต็อก) and integrated recipe cooking endpoint (`POST /recipes/{recipe_id}/cook`).
  - [x] Connected backend calorie estimator (`GET /nutrition/estimate`) to host-level Gemini AI Service over Docker network.
  - [x] Added "ไข่เจียวทรงเครื่อง" (Mock Recipe 104) for developer staging and testing.
  - [x] Fixed local timezone offset mismatch (UTC+7) for daily nutrition summary calculations.
  - [x] Resolved recipe ingredient matching mismatch and implemented frontend/backend cooking validation block.
  - [x] Implemented automated Thai recipe translations using optimized `gemini-3.1-flash-lite` (low latency, zero daily quota limitations).
  - [x] Configured production Dockerfiles for frontend/AI services, and added unified + split docker-compose files for multi-instance EC2 deployments.
  - [x] Auto-generated and applied missing database migrations for newly introduced models (`ChatHistory`, `RecipeCache`, `Translation`) and resolved alembic version mismatch.
  - [x] Successfully pushed clean git commits to remote `dev` branch.
- **Completed Actions / Deliverables (June 18, 2026)**:
  - [x] Confirmed AI Service locally is 100% functional with `gemini-2.5-flash`.
  - [x] Aligned `GEMINI_MODEL` and `GEMINI_VISION_MODEL` variables in configuration to fallback on `gemini-2.5-flash` instead of `gemini-3.5-flash`.
  - [x] Restored `box_2d` coordinate normalization to standard format [0, 1000] and aligned bounding box renderers.
  - [x] Enhanced AI service `_call_with_retry` mechanism to retry transient 503 and network failures.
  - [x] Integrated Google OAuth authentication flow in backend router (`POST /auth/google`) and verified client IDs.
  - [x] Implemented Google Sign-in button with Next.js client component (`AuthPage.tsx`) using Google Identity Services script.
  - [x] Configured environment variables mapping for Docker Compose (`docker-compose.yml` and `docker-compose.prod.yml`) to pass `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the backend.
  - [x] Cleaned up and updated backend dependency definitions in `requirements.txt`.
  - [x] Verified successful build, type checking, and pushed clean changes to `dev` branch.
  - [x] Increased backend proxy request timeout to 120.0 seconds to prevent ReadTimeout with slow Gemini responses.
  - [x] Implemented client-side image compression and resizing (down to 1024px) in ScannerView.tsx to speed up uploads by up to 50x and prevent timeouts.

### 🔍 2.2 Research & Documentation Agent
- **Status**: Standby ⚪
- **Scope of Work**: 
  - Research external APIs or models (e.g., Spoonacular Food API, OpenFoodFacts API).
  - Write and update technical documentation, including API specs and deployment guides.
  - Scan for security vulnerabilities and outdated dependencies.

### 💻 2.3 Backend & Database Coder Agent
- **Status**: Standby ⚪
- **Scope of Work**: 
  - Write code for API routes, middleware, and database migrations.
  - Optimize database queries and manage session/token handling.

### 🎨 2.4 Frontend Coder Agent
- **Status**: Standby ⚪
- **Scope of Work**:
  - Implement React components, page layouts, and frontend validation.
  - Apply styling using Tailwind CSS and customize premium UI themes.
