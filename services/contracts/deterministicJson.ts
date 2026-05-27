function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry));
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = normalize((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export function toDeterministicJson(value: unknown) {
  return JSON.stringify(normalize(value));
}

export function normalizeDeterministicValue<T>(value: T): T {
  return JSON.parse(toDeterministicJson(value)) as T;
}
