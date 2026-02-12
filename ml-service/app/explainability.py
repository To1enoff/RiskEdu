from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
import pandas as pd
from scipy import sparse

from app.training import map_transformed_to_base_feature
from app.utils import display_name


def local_explanations(
    model: Any,
    transformed_feature_names: List[str],
    background_matrix: np.ndarray,
    transformed_row: Any,
    original_row: pd.DataFrame,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    contributions = _calculate_contributions(
        model=model,
        transformed_row=transformed_row,
        background_matrix=background_matrix,
    )

    grouped: Dict[str, float] = {}
    for index, transformed_name in enumerate(transformed_feature_names):
        base_feature = map_transformed_to_base_feature(transformed_name)
        grouped[base_feature] = grouped.get(base_feature, 0.0) + float(contributions[index])

    original_values = original_row.iloc[0].to_dict()
    explained = []
    for feature_key, contribution in grouped.items():
        explained.append(
            {
                "featureKey": feature_key,
                "displayName": display_name(feature_key),
                "contribution": contribution,
                "direction": "increase_risk" if contribution >= 0 else "decrease_risk",
                "value": _safe_json_value(original_values.get(feature_key)),
            }
        )

    explained.sort(key=lambda item: abs(float(item["contribution"])), reverse=True)
    return explained[:top_k]


def _calculate_contributions(model: Any, transformed_row: Any, background_matrix: np.ndarray) -> np.ndarray:
    dense_row = _dense(transformed_row)

    # SHAP is preferred; if it fails for a specific model/input shape we fallback
    # to model-native proxy contributions to keep latency predictable.
    try:
        import shap  # type: ignore

        if model.__class__.__name__.lower().startswith("randomforest"):
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(dense_row)
            if isinstance(shap_values, list):
                return np.asarray(shap_values[1][0], dtype=float)
            shap_array = np.asarray(shap_values, dtype=float)
            if shap_array.ndim == 3:
                return shap_array[0, :, 1]
            return shap_array[0]

        explainer = shap.LinearExplainer(model, background_matrix)
        shap_values = explainer.shap_values(dense_row)
        shap_array = np.asarray(shap_values, dtype=float)
        if shap_array.ndim == 2:
            return shap_array[0]
        return shap_array
    except Exception:
        if hasattr(model, "coef_"):
            return dense_row[0] * np.asarray(model.coef_[0], dtype=float)
        if hasattr(model, "feature_importances_"):
            return dense_row[0] * np.asarray(model.feature_importances_, dtype=float)
        return np.zeros(dense_row.shape[1], dtype=float)


def _dense(matrix: Any) -> np.ndarray:
    if sparse.issparse(matrix):
        return matrix.toarray()
    return np.asarray(matrix)


def _safe_json_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, float, int, bool)):
        if isinstance(value, float) and np.isnan(value):
            return None
        return value
    try:
        return str(value)
    except Exception:
        return None
