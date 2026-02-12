export interface StudentFeatures {
  gender?: string;
  age?: number;
  logins?: number;
  totalHoursInModuleArea?: number;
  percentOfAverageHours?: number;
  presence?: number;
  absence?: number;
  percentAttended?: number;
  attendingFromHome?: string;
  distanceToUniversityKm?: number;
  polar4Quintile?: number;
  polar3Quintile?: number;
  adultHe2001Quintile?: number;
  adultHe2011Quintile?: number;
  tundraMsoaQuintile?: number;
  tundraLsoaQuintile?: number;
  gapsGcseQuintile?: number;
  gapsGcseEthnicityQuintile?: number;
  uniConnectTargetWard?: string;
}

export type FeatureType = 'numeric' | 'categorical';

export interface FeatureDefinition {
  key: keyof StudentFeatures;
  rawNames: string[];
  displayName: string;
  type: FeatureType;
}

// This mapping is the single source of truth for:
// raw CSV/JSON headers -> internal camelCase key -> UI label.
export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  { key: 'gender', rawNames: ['Gender'], displayName: 'Gender', type: 'categorical' },
  { key: 'age', rawNames: ['Age'], displayName: 'Age', type: 'numeric' },
  { key: 'logins', rawNames: ['Logins'], displayName: 'Logins', type: 'numeric' },
  {
    key: 'totalHoursInModuleArea',
    rawNames: ['Total Hours in Module Area'],
    displayName: 'Total Hours in Module Area',
    type: 'numeric',
  },
  {
    key: 'percentOfAverageHours',
    rawNames: ['% of Average Hours', 'Percent of Average Hours'],
    displayName: '% of Average Hours',
    type: 'numeric',
  },
  { key: 'presence', rawNames: ['Presence'], displayName: 'Presence', type: 'numeric' },
  { key: 'absence', rawNames: ['Absence'], displayName: 'Absence', type: 'numeric' },
  {
    key: 'percentAttended',
    rawNames: ['Percent Attended', '% Attended'],
    displayName: 'Percent Attended',
    type: 'numeric',
  },
  {
    key: 'attendingFromHome',
    rawNames: ['attending from home?', 'Attending from home?'],
    displayName: 'Attending from Home',
    type: 'categorical',
  },
  {
    key: 'distanceToUniversityKm',
    rawNames: ['distance to university (km)', 'Distance to university (km)'],
    displayName: 'Distance to University (km)',
    type: 'numeric',
  },
  {
    key: 'polar4Quintile',
    rawNames: ['POLAR4 Quintile'],
    displayName: 'POLAR4 Quintile',
    type: 'numeric',
  },
  {
    key: 'polar3Quintile',
    rawNames: ['POLAR3 Quintile'],
    displayName: 'POLAR3 Quintile',
    type: 'numeric',
  },
  {
    key: 'adultHe2001Quintile',
    rawNames: ['Adult HE 2001 Quintile'],
    displayName: 'Adult HE 2001 Quintile',
    type: 'numeric',
  },
  {
    key: 'adultHe2011Quintile',
    rawNames: ['Adult HE 2011 Quintile'],
    displayName: 'Adult HE 2011 Quintile',
    type: 'numeric',
  },
  {
    key: 'tundraMsoaQuintile',
    rawNames: ['TUNDRA MSOA Quintile'],
    displayName: 'TUNDRA MSOA Quintile',
    type: 'numeric',
  },
  {
    key: 'tundraLsoaQuintile',
    rawNames: ['TUNDRA LSOA Quintile'],
    displayName: 'TUNDRA LSOA Quintile',
    type: 'numeric',
  },
  {
    key: 'gapsGcseQuintile',
    rawNames: ['Gaps GCSE Quintile'],
    displayName: 'Gaps GCSE Quintile',
    type: 'numeric',
  },
  {
    key: 'gapsGcseEthnicityQuintile',
    rawNames: ['Gaps GCSE Ethnicity Quintile'],
    displayName: 'Gaps GCSE Ethnicity Quintile',
    type: 'numeric',
  },
  {
    key: 'uniConnectTargetWard',
    rawNames: ['Uni Connect target ward'],
    displayName: 'Uni Connect Target Ward',
    type: 'categorical',
  },
];

export const FEATURE_KEY_SET = new Set(FEATURE_DEFINITIONS.map((feature) => feature.key));

export const DISPLAY_NAME_BY_KEY: Record<string, string> = FEATURE_DEFINITIONS.reduce(
  (accumulator, feature) => {
    accumulator[feature.key] = feature.displayName;
    return accumulator;
  },
  {} as Record<string, string>,
);
