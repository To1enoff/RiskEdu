# RiskEdu Monorepo

RiskEdu is a multi-service platform for:
- student `fail/pass` prediction with explainability
- interactive `what-if` simulation
- weighted 15-week course tracking with hard fail rules and AI suggestions

## Services

- `frontend` (`React + TypeScript + Vite + Tailwind`)
- `backend` (`NestJS + TypeORM + PostgreSQL + JWT/RBAC`)
- `ml-service` (`FastAPI + scikit-learn + SHAP`)
- `postgres` (persistent relational store)

Request flow:
1. Frontend calls Backend REST API.
2. Backend validates DTO/auth, persists data in PostgreSQL.
3. Backend calls ML Service (`/predict`, `/whatif`, `/feature-importance`, `/predict-risk`).
4. Backend merges ML + hard rules + heuristics and returns final risk output.

## Project Tree

```text
RiskEdu/
  backend/
  frontend/
  ml-service/
  data/
    original/
    train_validate/
    test/
  docker-compose.yml
  README.md
```

## Dataset Layout

Place data here:

```text
/data/original (csv/json)
/data/train_validate (csv/json)
/data/test (csv/json)
```

Training file lookup:
- `/data/train_validate/csv/<TRAIN_DATASET>`
- `/data/train_validate/<TRAIN_DATASET>`

Default: `TRAIN_DATASET=none.csv`.

## Quick Start

1. Copy your dataset into `data/`.
2. Copy env templates if needed:
   - root: `.env.example -> .env`
   - backend: `backend/.env.example -> backend/.env`
   - frontend: `frontend/.env.example -> frontend/.env`
   - ml: `ml-service/.env.example -> ml-service/.env`
3. Run:

```bash
npm run dev
```

Main URLs:
- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:3000/docs`
- ML health: `http://localhost:8000/health`

Stop:

```bash
npm run dev:down
```

## Production Deploy (Render + GitHub Pages)

This repo is deployed as:
- Frontend: GitHub Pages (`https://to1enoff.github.io/RiskEdu/`)
- Backend: Render Web Service (`https://riskedu-backend.onrender.com`)
- ML Service: Render Web Service (`https://riskedu-ml-service.onrender.com`)
- Database: Render PostgreSQL

### 1) Deploy ML service on Render

Recommended config:
- Runtime: `Docker`
- Root Directory: `ml-service`
- Dockerfile Path: `Dockerfile`
- Health check: `/health`

Required env:
- `TRAIN_DATASET=none.csv` (or other csv name in `data/train_validate/csv`)
- `RANDOM_STATE=42`

Verify:
- `https://riskedu-ml-service.onrender.com/health`

### 2) Deploy backend on Render

Recommended config:
- Runtime: `Docker`
- Root Directory: `backend`
- Dockerfile Path: `Dockerfile`
- Health check: `/health`

Required env:
- `PORT=3000`
- `DATABASE_URL=<render postgres connection string>`
- `ML_SERVICE_URL=https://riskedu-ml-service.onrender.com`
- `JWT_SECRET=<strong random secret>`
- `JWT_EXPIRES_IN=1d`
- `CORS_ORIGIN=https://to1enoff.github.io`
- `GEMINI_API_KEY=` (optional, for AI suggestions + syllabus AI fallback)
- `GEMINI_MODEL=gemini-2.0-flash` (optional)
- `GEMINI_SYLLABUS_MODEL=gemini-2.0-flash` (optional)

Verify:
- `https://riskedu-backend.onrender.com/health`

### 3) Deploy frontend on GitHub Pages

Set repository variable:
- `VITE_API_URL=https://riskedu-backend.onrender.com`

Enable:
- `Settings -> Pages -> Source: GitHub Actions`

Workflow:
- `.github/workflows/deploy-frontend-gh-pages.yml`

Open:
- `https://to1enoff.github.io/RiskEdu/`

## Auth, Roles, Security

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/verify-email`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
- Roles: `admin`, `advisor`, `instructor`, `student`
- RBAC examples:
  - `GET /analytics/feature-importance` -> `admin`
- Security controls:
  - JWT auth guard
  - DTO validation
  - centralized error filter
  - CORS + rate limit on prediction endpoints
  - basic input sanitation

Production note:
- Public registration should be student-only. Do not allow public admin self-registration.

## Core APIs

### Student API (course-scoped risk)
- `GET /student/courses`
- `POST /student/courses`
- `GET /student/courses/:courseId`
- `POST /student/courses/:courseId/syllabus/manual`
- `POST /student/courses/:courseId/syllabus/upload`
- `GET /student/courses/:courseId/weights`
- `POST /student/courses/:courseId/exams`
- `GET /student/courses/:courseId/exams`
- `POST /student/courses/:courseId/weeks/:weekNumber/submission`
- `GET /student/courses/:courseId/weeks`
- `GET /student/courses/:courseId/risk`
- `POST /student/courses/:courseId/predict`
- `POST /student/courses/:courseId/what-if`
- `GET /student/courses/:courseId/suggestions`

### Admin API (read-only aggregated)
- `GET /admin/students`
- `GET /admin/students/:studentId`
- `GET /admin/students/:studentId/courses`
- `GET /admin/students/:studentId/courses/:courseId/risk`

### Analytics
- `GET /analytics/feature-importance` (admin)

## Course Risk Rules

- Course duration: exactly `15` weeks.
- Weights must sum to `100`.
- Current week is auto-calculated from semester start date:
  - Jan-Jun semester: first Monday on/after Jan 16
  - Sep-Dec semester: first Monday of September
- If syllabus/grades/exams/weeks change, risk + suggestions are recalculated automatically.
- Fail conditions:
  - weighted total `< 50`
  - `totalAbsences > 30` -> auto fail (`probabilityFail=1`, `bucket=red`)
  - `maxAchievablePercent < 50` -> auto fail
- Buckets:
  - `green`: `p < 0.33`
  - `yellow`: `0.33 <= p < 0.66`
  - `red`: `p >= 0.66`

## ML Notes

- Empty numeric strings are converted to `NaN` and median-imputed.
- Baseline models: Logistic Regression + Random Forest, selected by best validation `F1`.
- Artifacts are cached in memory and persisted under `/app/artifacts`.
- Local explanations use SHAP (with safe fallback).
- Course risk ML endpoint:
  - `POST /predict-risk` with progress features
  - backend blends: `0.7 * ml + 0.3 * heuristic` (if not auto-fail)

## Tests

Backend unit tests include:
- weights sum validation
- weighted score correctness
- auto fail (`absences > 30`)
- auto fail (impossible recovery)
- risk bucket mapping
- suggestions generation

AI behavior:
- If `GEMINI_API_KEY` is set and model call succeeds, suggestions come from Gemini.
- If key/model call fails, backend returns deterministic fallback suggestions.
- Backend also returns AI status/message to frontend so the UI can show key/model health.

Run backend tests:

```bash
docker compose run --rm backend npm test -- --runInBand
```

## Change Training Dataset / Oversampling

1. Add file to `data/train_validate/csv/`.
2. Set `TRAIN_DATASET=<file>.csv` in `ml-service/.env`.
3. Rebuild/restart ML service:

```bash
docker compose build ml-service
docker compose up -d ml-service
```

## Troubleshooting

- Frontend calls `localhost` in production:
  - Ensure GitHub variable `VITE_API_URL` points to Render backend URL.
  - Re-run Pages workflow and hard refresh (`Ctrl+F5`).

- `GET /student/courses` returns `400`:
  - Usually course weights are missing/invalid in DB.
  - Backend should auto-seed default weights (30/40/20/10/0).

- `POST /student/courses/:id/syllabus/upload` returns `400`:
  - Do not set multipart `Content-Type` manually on frontend.
  - Let browser set boundary automatically.

- Render backend says `No open ports detected`:
  - Check DB connectivity (`DATABASE_URL`) and startup errors in logs.
  - Service must successfully initialize TypeORM before listening.
