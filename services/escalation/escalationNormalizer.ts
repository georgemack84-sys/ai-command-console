export function normalizeEscalationValue<T>(value: T): T {
  if (typeof value === "string") {
    return value.normalize("NFC") as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeEscalationValue(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeEscalationValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {}) as T;
  }
  return value;
}
