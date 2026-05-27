export function normalizeLifecycleValue<T>(value: T): T {
  if (typeof value === "string") {
    return value.normalize("NFC") as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeLifecycleValue(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeLifecycleValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {}) as T;
  }
  return value;
}
