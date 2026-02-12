import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    data_root: str = os.getenv("DATA_ROOT", "/app/data")
    artifact_dir: str = os.getenv("ARTIFACT_DIR", "/app/artifacts")
    train_dataset: str = os.getenv("TRAIN_DATASET", "none.csv")
    random_state: int = int(os.getenv("RANDOM_STATE", "42"))


settings = Settings()
