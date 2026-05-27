export function normalizeApprovalGraphValue<T>(value: T): T {
  if (value === undefined) {
    return null as T;
  }
  if (typeof value === "string") {
    return value.normalize("NFC") as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeApprovalGraphValue(entry)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, normalizeApprovalGraphValue((value as Record<string, unknown>)[key])]),
    ) as T;
  }
  return value;
}
