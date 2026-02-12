from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd

from app.feature_map import FEATURE_KEYS, FEATURE_TYPES_BY_KEY, RAW_OR_INTERNAL_TO_KEY, normalize_feature_key

LABEL_CANDIDATES = ["label", "fail_pass", "target", "result", "outcome", "fail"]


def resolve_train_dataset_path(data_root: str, dataset_name: str) -> Path:
    base = Path(data_root) / "train_validate"
    csv_subfolder = base / "csv"

    file_candidates = []
    if dataset_name.endswith(".csv"):
        file_candidates.extend([csv_subfolder / dataset_name, base / dataset_name])
    else:
        file_candidates.extend(
            [
                csv_subfolder / f"{dataset_name}.csv",
                base / f"{dataset_name}.csv",
                csv_subfolder / dataset_name,
                base / dataset_name,
            ]
        )

    for candidate in file_candidates:
        if candidate.exists():
            return candidate

    # Fallback to first available CSV so service can still start when env name is missing.
    fallback_pool = sorted(csv_subfolder.glob("*.csv")) + sorted(base.glob("*.csv"))
    if fallback_pool:
        return fallback_pool[0]

    raise FileNotFoundError(
        f"No CSV dataset found in {base}. Place files under /data/train_validate/csv or /data/train_validate."
    )


def load_training_data(dataset_path: Path) -> Tuple[pd.DataFrame, pd.Series]:
    dataframe = pd.read_csv(dataset_path, dtype=str)
    # Dataset contains empty strings in numeric columns; normalize to NaN for imputation.
    dataframe = dataframe.replace(r"^\s*$", np.nan, regex=True)

    rename_map: Dict[str, str] = {}
    label_column = None

    for original_column in dataframe.columns:
        normalized_name = normalize_feature_key(str(original_column))
        if normalized_name in RAW_OR_INTERNAL_TO_KEY:
            rename_map[original_column] = RAW_OR_INTERNAL_TO_KEY[normalized_name]
            continue
        if normalized_name in LABEL_CANDIDATES and label_column is None:
            label_column = original_column

    if label_column is None:
        for original_column in dataframe.columns:
            if normalize_feature_key(str(original_column)) == "label":
                label_column = original_column
                break

    if label_column is None:
        raise ValueError("Could not detect label column. Expected one of: label/fail_pass/target/result/outcome/fail")

    dataframe = dataframe.rename(columns=rename_map)
    for key in FEATURE_KEYS:
        if key not in dataframe.columns:
            dataframe[key] = np.nan

    for key in FEATURE_KEYS:
        if FEATURE_TYPES_BY_KEY[key] == "numeric":
            dataframe[key] = pd.to_numeric(dataframe[key], errors="coerce")
        else:
            dataframe[key] = dataframe[key].astype("string")

    label_series = dataframe[label_column].apply(_parse_label).astype("Int64")
    valid_mask = label_series.notna()
    cleaned = dataframe.loc[valid_mask, FEATURE_KEYS].copy()
    labels = label_series.loc[valid_mask].astype(int)
    return cleaned, labels


def _parse_label(value: object) -> int | None:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None

    as_string = str(value).strip().lower()
    if as_string in {"1", "fail", "failed", "true", "yes"}:
        return 1
    if as_string in {"0", "pass", "passed", "false", "no"}:
        return 0
    try:
        numeric = int(float(as_string))
        return 1 if numeric == 1 else 0 if numeric == 0 else None
    except ValueError:
        return None
