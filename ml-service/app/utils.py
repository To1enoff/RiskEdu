from __future__ import annotations

from typing import Any, Dict

import numpy as np

from app.feature_map import DISPLAY_NAME_BY_KEY, FEATURE_KEYS, FEATURE_TYPES_BY_KEY, RAW_OR_INTERNAL_TO_KEY, normalize_feature_key


def risk_bucket(probability: float) -> str:
    # Product-level threshold contract shared with frontend/backend.
    if probability < 0.33:
        return "green"
    if probability < 0.66:
        return "yellow"
    return "red"


def normalize_features(input_features: Dict[str, Any]) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {}

    for raw_key, raw_value in input_features.items():
        key = RAW_OR_INTERNAL_TO_KEY.get(normalize_feature_key(str(raw_key)))
        if key is None:
            continue
        converted = convert_value(raw_value, FEATURE_TYPES_BY_KEY[key])
        if converted is not None:
            normalized[key] = converted

    return normalized


def convert_value(value: Any, feature_type: str) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return None
        if feature_type == "numeric":
            try:
                return float(stripped)
            except ValueError:
                return None
        return stripped

    if feature_type == "numeric":
        try:
            casted = float(value)
            if np.isfinite(casted):
                return casted
            return None
        except (TypeError, ValueError):
            return None

    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def ensure_feature_frame_dict(input_features: Dict[str, Any]) -> Dict[str, Any]:
    # We always produce every feature column so the preprocessor sees a stable schema.
    normalized = normalize_features(input_features)
    result: Dict[str, Any] = {}
    for key in FEATURE_KEYS:
        result[key] = normalized.get(key, np.nan)
    return result


def display_name(feature_key: str) -> str:
    return DISPLAY_NAME_BY_KEY.get(feature_key, feature_key)
