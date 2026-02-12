import {
  DISPLAY_NAME_BY_KEY,
  FEATURE_DEFINITIONS,
  FEATURE_KEY_SET,
  StudentFeatures,
} from '../constants/feature-map';

const normalizedRawKeyMap = FEATURE_DEFINITIONS.reduce(
  (accumulator, definition) => {
    accumulator[definition.key.toLowerCase()] = definition.key;
    definition.rawNames.forEach((rawName) => {
      accumulator[normalizeKey(rawName)] = definition.key;
    });
    return accumulator;
  },
  {} as Record<string, keyof StudentFeatures>,
);

export function mapRawFeaturesToInternal(input: Record<string, unknown>): StudentFeatures {
  const mapped: StudentFeatures = {};

  for (const [rawKey, rawValue] of Object.entries(input)) {
    const internalKey = normalizedRawKeyMap[normalizeKey(rawKey)];
    if (!internalKey || !FEATURE_KEY_SET.has(internalKey)) {
      continue;
    }

    const definition = FEATURE_DEFINITIONS.find((feature) => feature.key === internalKey);
    if (!definition) {
      continue;
    }

    const convertedValue = convertValue(rawValue, definition.type);
    if (convertedValue !== undefined) {
      mapped[internalKey] = convertedValue as never;
    }
  }

  return mapped;
}

export function toDisplayName(featureKey: string): string {
  return DISPLAY_NAME_BY_KEY[featureKey] ?? featureKey;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

function convertValue(value: unknown, type: 'numeric' | 'categorical'): number | string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }

    if (type === 'numeric') {
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return normalized;
  }

  if (type === 'numeric') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }

  return String(value);
}
