from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    features: Dict[str, Any] = Field(default_factory=dict)


class WhatIfRequest(BaseModel):
    baselineFeatures: Dict[str, Any] = Field(default_factory=dict)
    overrides: Dict[str, Any] = Field(default_factory=dict)


class ExplanationItem(BaseModel):
    featureKey: str
    displayName: str
    contribution: float
    direction: str
    value: Any | None = None


class PredictResponse(BaseModel):
    probability: float
    label: int
    bucket: str
    explanations: List[ExplanationItem]


class WhatIfResponse(BaseModel):
    baselineProbability: float
    newProbability: float
    delta: float
    bucket: str
    changedFeatures: List[Dict[str, Any]]
    explanations: List[ExplanationItem]


class CourseRiskPredictRequest(BaseModel):
    features: Dict[str, float] = Field(default_factory=dict)


class CourseRiskPredictResponse(BaseModel):
    probabilityFail: float
