function normalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry, seen));
  }
  if (value && typeof value === "object") {
    if (seen.has(value as object)) {
      throw new Error("DECISION_AUDIT_EPISODE_CIRCULAR_STRUCTURE");
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
  if (typeof value === "bigint") {
    throw new Error("DECISION_AUDIT_EPISODE_UNSUPPORTED_STRUCTURE");
  }
  return value;
}

export function canonicalizeDecisionEpisodeValue<T>(value: T): T {
  return normalize(value, new WeakSet<object>()) as T;
}
