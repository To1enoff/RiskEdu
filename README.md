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
   - backend: `backend/.env.example`
   - frontend: `frontend/.env.example`
   - ml: `ml-service/.env.example`
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

## Auth, Roles, Security

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
- Roles: `admin`, `advisor`, `instructor`, `student`
- RBAC examples:
  - `GET /analytics/feature-importance` -> `admin`
- Security controls:
  - JWT auth guard
  - DTO validation
  - centralized error filter
  - CORS + rate limit on prediction endpoints
  - basic input sanitation

## Core APIs

### Student Risk + What-if
- `GET /students`
- `GET /students/:id`
- `POST /predict`
- `POST /whatif`
- `GET /analytics/feature-importance`

### Weighted Course Workflow (15 weeks)
- `GET /courses`
- `POST /courses`
- `POST /courses/:id/syllabus/manual`
- `POST /courses/:id/syllabus/upload`
- `GET /courses/:id/weights`
- `POST /courses/:id/exams`
- `GET /courses/:id/exams`
- `POST /courses/:id/weeks/:weekNumber/submission`
- `GET /courses/:id/weeks`
- `GET /courses/:id/risk`
- `POST /courses/:id/predict`
- `GET /courses/:id/suggestions`

## Course Risk Rules

- Course duration: exactly `15` weeks.
- Weights must sum to `100`.
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

Run backend tests:

```bash
docker compose run --rm backend npm test -- --runInBand
```

## Change Training Dataset / Oversampling

1. Add file to `data/train_validate/csv/`.
2. Set `TRAIN_DATASET=<file>.csv` in `ml-service/.env.example` (or env).
3. Rebuild/restart ML service:

```bash
docker compose build ml-service
docker compose up -d ml-service
```
