function normalizeString(value: string): string {
  return value.normalize("NFC");
}

export function normalizeContainmentValue<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeContainmentValue(entry)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [normalizeString(key), normalizeContainmentValue(entry)]);
    return Object.freeze(Object.fromEntries(entries)) as T;
  }

  return value;
}
