from __future__ import annotations

from fastapi import FastAPI, HTTPException

from app.schemas import (
    CourseRiskPredictRequest,
    CourseRiskPredictResponse,
    PredictRequest,
    PredictResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.service import ModelManager

app = FastAPI(
    title="RiskEdu ML Service",
    version="1.0.0",
    description="FastAPI service for fail/pass risk inference, explainability, and what-if simulation.",
)

model_manager = ModelManager()


@app.on_event("startup")
def startup_event() -> None:
    model_manager.ensure_ready()


@app.get("/health")
def health() -> dict:
    return model_manager.health()


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> dict:
    if not payload.features:
        raise HTTPException(status_code=400, detail="features must not be empty")
    return model_manager.predict(payload.features)


@app.post("/whatif", response_model=WhatIfResponse)
def what_if(payload: WhatIfRequest) -> dict:
    if not payload.baselineFeatures:
        raise HTTPException(status_code=400, detail="baselineFeatures must not be empty")
    return model_manager.what_if(payload.baselineFeatures, payload.overrides)


@app.get("/feature-importance")
def feature_importance() -> dict:
    return model_manager.feature_importance()


@app.post("/predict-risk", response_model=CourseRiskPredictResponse)
def predict_course_risk(payload: CourseRiskPredictRequest) -> dict:
    if not payload.features:
        raise HTTPException(status_code=400, detail="features must not be empty")
    return model_manager.predict_course_risk(payload.features)
