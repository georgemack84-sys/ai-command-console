function normalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item, seen));
  }
  if (value && typeof value === "object") {
    if (seen.has(value as object)) {
      throw new Error("HIDDEN_EXECUTION_CIRCULAR_STRUCTURE");
    }
    seen.add(value as object);
    const normalized = Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, normalize((value as Record<string, unknown>)[key], seen)]),
    );
    seen.delete(value as object);
    return normalized;
  }
  return value;
}

export function canonicalizeHiddenExecutionValue<T>(value: T): T {
  return normalize(value, new WeakSet<object>()) as T;
}

export function canonicalizeHiddenExecutionToString(value: unknown): string {
  return JSON.stringify(canonicalizeHiddenExecutionValue(value));
}
