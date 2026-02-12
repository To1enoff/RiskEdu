export function sanitizeInput<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, innerValue] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeInput(innerValue);
    }
    return sanitized as T;
  }

  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '').trim() as T;
  }

  return value;
}
