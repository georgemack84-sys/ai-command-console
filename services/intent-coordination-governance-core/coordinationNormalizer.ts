export function normalizeCoordinationValue<T>(value: T): T {
  return normalize(value) as T;
}

function normalize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = normalize((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }
  return value;
}
