# RiskEdu Monorepo

Production-ready multi-service system for student `fail/pass` risk prediction with:
- Explainable AI (top local factors for each student risk)
- What-if simulator (partial metric overrides with immediate risk delta)

## Architecture

- `frontend` (React + TypeScript + Vite): advisor/instructor/admin UI.
- `backend` (NestJS + PostgreSQL): auth (JWT + RBAC), students API, prediction orchestration.
- `ml-service` (FastAPI + scikit-learn + SHAP): model training/inference/explainability.
- `postgres`: persistence for users, profiles, predictions.

Service communication:
1. Frontend calls Backend REST API.
2. Backend validates/authorizes requests, stores state in Postgres.
3. Backend calls ML Service (`/predict`, `/whatif`, `/feature-importance`) over HTTP.
4. ML Service returns probability + bucket + explanations.

## Project Tree

```text
RiskEdu/
  backend/
    src/
      analytics/
      auth/
      common/
      ml/
      predictions/
      students/
      users/
      app.controller.ts
      app.module.ts
      app.service.ts
      main.ts
    Dockerfile
    package.json
  frontend/
    src/
      api/
      components/
      hooks/
      pages/
      types/
      utils/
      App.tsx
      main.tsx
      styles.css
    Dockerfile
    package.json
  ml-service/
    app/
      config.py
      data_loader.py
      explainability.py
      feature_map.py
      main.py
      schemas.py
      service.py
      training.py
      utils.py
    Dockerfile
    requirements.txt
  data/
    original/
    train_validate/
    test/
  docker-compose.yml
  package.json
  README.md
```

## Dataset Layout

Put your files in:

```text
/data/original
/data/train_validate
/data/test
```

Supported train dataset resolution:
- `/data/train_validate/csv/<TRAIN_DATASET>`
- `/data/train_validate/<TRAIN_DATASET>`

Default: `TRAIN_DATASET=none.csv` (imbalanced baseline).  
To switch to SMOTE/ADASYN variant, change `TRAIN_DATASET` env in `ml-service/.env.example` or runtime env.

## Quick Start (Docker Compose)

1. Copy your dataset into `data/` folders.
2. Optional: copy `.env.example` to `.env` and edit values.
3. Run:

```bash
npm run dev
```

Endpoints:
- Frontend: `http://localhost:5173`
- Backend Swagger: `http://localhost:3000/docs`
- ML Health: `http://localhost:8000/health`

Stop:

```bash
npm run dev:down
```

## Auth and Roles

- Register: `POST /auth/register`
- Login: `POST /auth/login`
- Roles: `admin`, `advisor`, `instructor`
- RBAC:
  - `GET /analytics/feature-importance`: admin only
  - `POST /predict`, `POST /whatif`: admin/advisor/instructor

## API Surface

- `GET /students`  
  pagination + filter by bucket + sort by risk desc.
- `GET /students/:id`  
  student details + latest prediction + explanations.
- `POST /predict`  
  input features -> `probability`, `label`, `bucket`, explanations.
- `POST /whatif`  
  baseline + partial overrides -> baseline/new probability + delta + changedFeatures.
- `GET /analytics/feature-importance`  
  aggregated importance (department-aware when available).

## Risk Buckets

- `green`: `p < 0.33`
- `yellow`: `0.33 <= p < 0.66`
- `red`: `p >= 0.66`

## Key Implementation Notes

- Raw feature names with spaces/symbols are preserved in mapping and normalized to internal camelCase.
- Empty strings (`""`) in numeric fields are converted to `NaN`, then median-imputed in preprocessing.
- Training uses Logistic Regression + Random Forest; best model selected by validation `F1`.
- Model artifacts are cached in memory and persisted (`joblib`) in `/app/artifacts`.
- SHAP is used for local explanations with robust fallback if SHAP fails for a given model/input shape.
- Predict/what-if endpoints are rate-limited and input-sanitized at backend level.

## Add New Dataset / Oversampling Variant

1. Place new CSV into `data/train_validate/csv/`.
2. Set `TRAIN_DATASET=<your-file>.csv` in `ml-service/.env.example` (or container env).
3. Restart ML service (or full compose) to retrain and refresh artifacts.
