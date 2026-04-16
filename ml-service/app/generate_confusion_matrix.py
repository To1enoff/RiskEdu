from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix
from sklearn.model_selection import train_test_split

from app.config import settings
from app.data_loader import load_training_data, resolve_train_dataset_path
from app.training import build_preprocessor
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score


def generate_confusion_matrix() -> Path:
    dataset_path = resolve_train_dataset_path(settings.data_root, settings.train_dataset)
    dataframe, labels = load_training_data(dataset_path)

    x_train, x_val, y_train, y_val = train_test_split(
        dataframe,
        labels,
        test_size=0.2,
        random_state=settings.random_state,
        stratify=labels,
    )

    preprocessor = build_preprocessor()
    x_train_transformed = preprocessor.fit_transform(x_train)
    x_val_transformed = preprocessor.transform(x_val)

    candidates = {
        "logistic_regression": LogisticRegression(
            max_iter=1500,
            class_weight="balanced",
            random_state=settings.random_state,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=350,
            class_weight="balanced_subsample",
            random_state=settings.random_state,
            n_jobs=-1,
        ),
    }

    best_model = None
    best_model_name = ""
    best_f1 = -1.0

    for name, model in candidates.items():
        model.fit(x_train_transformed, y_train)
        predictions = model.predict(x_val_transformed)
        score = float(f1_score(y_val, predictions, zero_division=0))
        if score > best_f1:
            best_f1 = score
            best_model = model
            best_model_name = name

    if best_model is None:
        raise RuntimeError("Unable to train a model for confusion matrix generation.")

    final_predictions = best_model.predict(x_val_transformed)
    matrix = confusion_matrix(y_val, final_predictions, labels=[0, 1])

    artifact_dir = Path(settings.artifact_dir)
    artifact_dir.mkdir(parents=True, exist_ok=True)
    output_path = artifact_dir / "confusion_matrix.png"

    fig, ax = plt.subplots(figsize=(6, 6))
    display = ConfusionMatrixDisplay(confusion_matrix=matrix, display_labels=["Pass", "Fail"])
    display.plot(ax=ax, cmap="Blues", colorbar=False, values_format="d")
    ax.set_title(f"Confusion Matrix ({best_model_name}, F1={best_f1:.3f})")
    fig.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)

    return output_path


if __name__ == "__main__":
    saved = generate_confusion_matrix()
    print(saved)
