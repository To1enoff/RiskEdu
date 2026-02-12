from __future__ import annotations

import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd

from app.config import settings
from app.data_loader import load_training_data, resolve_train_dataset_path
from app.explainability import local_explanations
from app.feature_map import FEATURE_KEYS
from app.training import ModelArtifacts, train_best_model
from app.utils import display_name, ensure_feature_frame_dict, normalize_features, risk_bucket


class ModelManager:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._bundle: Dict[str, Any] | None = None
        self._artifact_path = Path(settings.artifact_dir) / "model.joblib"
        self._artifact_path.parent.mkdir(parents=True, exist_ok=True)

    def ensure_ready(self) -> None:
        if self._bundle is not None:
            return
        with self._lock:
            if self._bundle is not None:
                return
            self._bundle = self._load_or_train()

    def health(self) -> Dict[str, Any]:
        self.ensure_ready()
        assert self._bundle is not None
        return {
            "status": "ok",
            "modelName": self._bundle["modelName"],
            "trainedAt": self._bundle["trainedAt"],
            "datasetPath": self._bundle["datasetPath"],
        }

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        self.ensure_ready()
        assert self._bundle is not None

        row_dict = ensure_feature_frame_dict(features)
        row_df = pd.DataFrame([row_dict], columns=FEATURE_KEYS)

        prediction = self._predict_from_df(row_df)
        return prediction

    def what_if(self, baseline_features: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
        self.ensure_ready()
        assert self._bundle is not None

        baseline_row = ensure_feature_frame_dict(baseline_features)
        normalized_overrides = normalize_features(overrides)

        baseline_df = pd.DataFrame([baseline_row], columns=FEATURE_KEYS)
        baseline_prediction = self._predict_from_df(baseline_df)

        # Partial overrides only replace fields provided by the caller.
        updated_row = dict(baseline_row)
        changed_features: List[Dict[str, Any]] = []
        for key, new_value in normalized_overrides.items():
            old_value = updated_row.get(key)
            if old_value == new_value:
                continue
            updated_row[key] = new_value
            changed_features.append(
                {
                    "featureKey": key,
                    "displayName": display_name(key),
                    "oldValue": _safe_json(old_value),
                    "newValue": _safe_json(new_value),
                }
            )

        updated_df = pd.DataFrame([updated_row], columns=FEATURE_KEYS)
        updated_prediction = self._predict_from_df(updated_df)
        delta = updated_prediction["probability"] - baseline_prediction["probability"]

        return {
            "baselineProbability": baseline_prediction["probability"],
            "newProbability": updated_prediction["probability"],
            "delta": delta,
            "bucket": updated_prediction["bucket"],
            "changedFeatures": changed_features,
            "explanations": updated_prediction["explanations"],
        }

    def feature_importance(self) -> Dict[str, Any]:
        self.ensure_ready()
        assert self._bundle is not None
        return {"features": self._bundle["featureImportance"]}

    def _predict_from_df(self, row_df: pd.DataFrame) -> Dict[str, Any]:
        assert self._bundle is not None
        preprocessor = self._bundle["preprocessor"]
        model = self._bundle["model"]
        transformed_feature_names = self._bundle["transformedFeatureNames"]
        background_matrix = self._bundle["backgroundMatrix"]

        transformed = preprocessor.transform(row_df)
        probabilities = model.predict_proba(transformed)
        probability_fail = float(probabilities[0][1])
        label = 1 if probability_fail >= 0.5 else 0
        bucket = risk_bucket(probability_fail)

        explanations = local_explanations(
            model=model,
            transformed_feature_names=transformed_feature_names,
            background_matrix=background_matrix,
            transformed_row=transformed,
            original_row=row_df,
            top_k=5,
        )

        return {
            "probability": probability_fail,
            "label": label,
            "bucket": bucket,
            "explanations": explanations,
        }

    def _load_or_train(self) -> Dict[str, Any]:
        if self._artifact_path.exists():
            try:
                return joblib.load(self._artifact_path)
            except Exception:
                pass

        trained_bundle = self._train_fresh_bundle()
        joblib.dump(trained_bundle, self._artifact_path)
        return trained_bundle

    def _train_fresh_bundle(self) -> Dict[str, Any]:
        try:
            dataset_path = resolve_train_dataset_path(settings.data_root, settings.train_dataset)
            features_df, labels = load_training_data(dataset_path)
            if labels.nunique() < 2:
                raise ValueError("Dataset label contains only one class")
            artifacts: ModelArtifacts = train_best_model(features_df, labels, settings.random_state)
        except Exception:
            features_df, labels, dataset_path = self._fallback_dataset()
            artifacts = train_best_model(features_df, labels, settings.random_state)
        return {
            "model": artifacts.model,
            "modelName": artifacts.model_name,
            "preprocessor": artifacts.preprocessor,
            "metrics": artifacts.metrics,
            "featureImportance": artifacts.feature_importance,
            "transformedFeatureNames": artifacts.transformed_feature_names,
            "backgroundMatrix": artifacts.background_matrix,
            "trainedAt": datetime.now(timezone.utc).isoformat(),
            "datasetPath": str(dataset_path),
        }

    def _fallback_dataset(self) -> Tuple[pd.DataFrame, pd.Series, Path]:
        rng = np.random.default_rng(settings.random_state)
        n = 200
        fallback = pd.DataFrame(
            {
                "gender": rng.choice(["male", "female"], size=n),
                "age": rng.normal(24, 4, size=n),
                "logins": rng.integers(1, 120, size=n),
                "totalHoursInModuleArea": rng.normal(35, 15, size=n),
                "percentOfAverageHours": rng.normal(100, 25, size=n),
                "presence": rng.normal(60, 15, size=n),
                "absence": rng.normal(40, 12, size=n),
                "percentAttended": rng.normal(72, 15, size=n),
                "attendingFromHome": rng.choice(["yes", "no"], size=n),
                "distanceToUniversityKm": rng.normal(12, 8, size=n),
                "polar4Quintile": rng.integers(1, 6, size=n),
                "polar3Quintile": rng.integers(1, 6, size=n),
                "adultHe2001Quintile": rng.integers(1, 6, size=n),
                "adultHe2011Quintile": rng.integers(1, 6, size=n),
                "tundraMsoaQuintile": rng.integers(1, 6, size=n),
                "tundraLsoaQuintile": rng.integers(1, 6, size=n),
                "gapsGcseQuintile": rng.integers(1, 6, size=n),
                "gapsGcseEthnicityQuintile": rng.integers(1, 6, size=n),
                "uniConnectTargetWard": rng.choice(["yes", "no"], size=n),
            }
        )
        risk_signal = (
            (fallback["absence"] > 50).astype(int)
            + (fallback["logins"] < 15).astype(int)
            + (fallback["percentAttended"] < 60).astype(int)
        )
        labels = pd.Series((risk_signal >= 2).astype(int))
        return fallback[FEATURE_KEYS], labels, Path("synthetic-fallback")


def _safe_json(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and np.isnan(value):
        return None
    return value
