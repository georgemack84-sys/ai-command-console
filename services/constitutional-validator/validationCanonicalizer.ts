function normalize(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, normalize((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

export function canonicalizeValidationValue<T>(value: T): T {
  return normalize(value) as T;
}
