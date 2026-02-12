from dataclasses import dataclass
from typing import Dict, List, Literal

FeatureType = Literal["numeric", "categorical"]


@dataclass(frozen=True)
class FeatureDefinition:
    key: str
    raw_names: List[str]
    display_name: str
    feature_type: FeatureType


FEATURE_DEFINITIONS: List[FeatureDefinition] = [
    FeatureDefinition("gender", ["Gender"], "Gender", "categorical"),
    FeatureDefinition("age", ["Age"], "Age", "numeric"),
    FeatureDefinition("logins", ["Logins"], "Logins", "numeric"),
    FeatureDefinition(
        "totalHoursInModuleArea",
        ["Total Hours in Module Area"],
        "Total Hours in Module Area",
        "numeric",
    ),
    FeatureDefinition(
        "percentOfAverageHours",
        ["% of Average Hours", "Percent of Average Hours"],
        "% of Average Hours",
        "numeric",
    ),
    FeatureDefinition("presence", ["Presence"], "Presence", "numeric"),
    FeatureDefinition("absence", ["Absence"], "Absence", "numeric"),
    FeatureDefinition(
        "percentAttended",
        ["Percent Attended", "% Attended"],
        "Percent Attended",
        "numeric",
    ),
    FeatureDefinition(
        "attendingFromHome",
        ["attending from home?", "Attending from home?"],
        "Attending from Home",
        "categorical",
    ),
    FeatureDefinition(
        "distanceToUniversityKm",
        ["distance to university (km)", "Distance to university (km)"],
        "Distance to University (km)",
        "numeric",
    ),
    FeatureDefinition("polar4Quintile", ["POLAR4 Quintile"], "POLAR4 Quintile", "numeric"),
    FeatureDefinition("polar3Quintile", ["POLAR3 Quintile"], "POLAR3 Quintile", "numeric"),
    FeatureDefinition(
        "adultHe2001Quintile",
        ["Adult HE 2001 Quintile"],
        "Adult HE 2001 Quintile",
        "numeric",
    ),
    FeatureDefinition(
        "adultHe2011Quintile",
        ["Adult HE 2011 Quintile"],
        "Adult HE 2011 Quintile",
        "numeric",
    ),
    FeatureDefinition("tundraMsoaQuintile", ["TUNDRA MSOA Quintile"], "TUNDRA MSOA Quintile", "numeric"),
    FeatureDefinition("tundraLsoaQuintile", ["TUNDRA LSOA Quintile"], "TUNDRA LSOA Quintile", "numeric"),
    FeatureDefinition("gapsGcseQuintile", ["Gaps GCSE Quintile"], "Gaps GCSE Quintile", "numeric"),
    FeatureDefinition(
        "gapsGcseEthnicityQuintile",
        ["Gaps GCSE Ethnicity Quintile"],
        "Gaps GCSE Ethnicity Quintile",
        "numeric",
    ),
    FeatureDefinition(
        "uniConnectTargetWard",
        ["Uni Connect target ward"],
        "Uni Connect Target Ward",
        "categorical",
    ),
]

DISPLAY_NAME_BY_KEY: Dict[str, str] = {feature.key: feature.display_name for feature in FEATURE_DEFINITIONS}
FEATURE_TYPES_BY_KEY: Dict[str, FeatureType] = {
    feature.key: feature.feature_type for feature in FEATURE_DEFINITIONS
}
NUMERIC_FEATURES: List[str] = [f.key for f in FEATURE_DEFINITIONS if f.feature_type == "numeric"]
CATEGORICAL_FEATURES: List[str] = [f.key for f in FEATURE_DEFINITIONS if f.feature_type == "categorical"]
FEATURE_KEYS: List[str] = [f.key for f in FEATURE_DEFINITIONS]


def normalize_feature_key(name: str) -> str:
    return " ".join(name.strip().lower().split())


RAW_OR_INTERNAL_TO_KEY: Dict[str, str] = {}
for definition in FEATURE_DEFINITIONS:
    RAW_OR_INTERNAL_TO_KEY[normalize_feature_key(definition.key)] = definition.key
    for raw_name in definition.raw_names:
        RAW_OR_INTERNAL_TO_KEY[normalize_feature_key(raw_name)] = definition.key
