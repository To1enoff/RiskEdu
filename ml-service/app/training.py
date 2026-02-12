from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.feature_map import CATEGORICAL_FEATURES, FEATURE_KEYS, NUMERIC_FEATURES
from app.utils import display_name


@dataclass
class ModelArtifacts:
    model: Any
    model_name: str
    preprocessor: ColumnTransformer
    metrics: Dict[str, Dict[str, float]]
    feature_importance: List[Dict[str, Any]]
    transformed_feature_names: List[str]
    background_matrix: np.ndarray


def train_best_model(dataframe: pd.DataFrame, labels: pd.Series, random_state: int) -> ModelArtifacts:
    x_train, x_val, y_train, y_val = train_test_split(
        dataframe,
        labels,
        test_size=0.2,
        random_state=random_state,
        stratify=labels,
    )

    preprocessor = build_preprocessor()
    x_train_transformed = preprocessor.fit_transform(x_train)
    x_val_transformed = preprocessor.transform(x_val)
    transformed_feature_names = list(preprocessor.get_feature_names_out())

    candidates = {
        "logistic_regression": LogisticRegression(
            max_iter=1500,
            class_weight="balanced",
            random_state=random_state,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=350,
            class_weight="balanced_subsample",
            random_state=random_state,
            n_jobs=-1,
        ),
    }

    best_model = None
    best_name = ""
    best_f1 = -1.0
    metrics: Dict[str, Dict[str, float]] = {}

    for name, model in candidates.items():
        model.fit(x_train_transformed, y_train)
        predictions = model.predict(x_val_transformed)
        f1 = float(f1_score(y_val, predictions, zero_division=0))
        metrics[name] = {"f1": f1}
        if f1 > best_f1:
            best_f1 = f1
            best_name = name
            best_model = model

    if best_model is None:
        raise RuntimeError("Model selection failed. No model was trained.")

    feature_importance = compute_global_feature_importance(best_model, transformed_feature_names)
    background_matrix = _to_dense_array(x_train_transformed)[:200]

    return ModelArtifacts(
        model=best_model,
        model_name=best_name,
        preprocessor=preprocessor,
        metrics=metrics,
        feature_importance=feature_importance,
        transformed_feature_names=transformed_feature_names,
        background_matrix=background_matrix,
    )


def build_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def compute_global_feature_importance(model: Any, transformed_feature_names: List[str]) -> List[Dict[str, Any]]:
    if hasattr(model, "feature_importances_"):
        raw_importance = np.asarray(model.feature_importances_, dtype=float)
    elif hasattr(model, "coef_"):
        raw_importance = np.abs(np.asarray(model.coef_[0], dtype=float))
    else:
        raw_importance = np.ones(len(transformed_feature_names), dtype=float)

    by_feature: Dict[str, float] = {}
    for idx, transformed_name in enumerate(transformed_feature_names):
        base_feature = map_transformed_to_base_feature(transformed_name)
        by_feature[base_feature] = by_feature.get(base_feature, 0.0) + float(raw_importance[idx])

    total = sum(by_feature.values()) or 1.0
    importance = [
        {
            "featureKey": feature_key,
            "displayName": display_name(feature_key),
            "score": value / total,
        }
        for feature_key, value in by_feature.items()
        if feature_key in FEATURE_KEYS
    ]
    importance.sort(key=lambda item: item["score"], reverse=True)
    return importance


def map_transformed_to_base_feature(transformed_name: str) -> str:
    if transformed_name.startswith("num__"):
        return transformed_name.replace("num__", "", 1)
    if transformed_name.startswith("cat__"):
        tail = transformed_name.replace("cat__", "", 1)
        return tail.split("_", 1)[0]
    return transformed_name


def _to_dense_array(matrix: Any) -> np.ndarray:
    if sparse.issparse(matrix):
        return matrix.toarray()
    return np.asarray(matrix)
