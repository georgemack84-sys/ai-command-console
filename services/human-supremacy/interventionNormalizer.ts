type JsonLike =
  | null
  | boolean
  | number
  | string
  | readonly JsonLike[]
  | { readonly [key: string]: JsonLike };

export function normalizeInterventionValue<T extends JsonLike>(value: T): T {
  if (typeof value === "string") {
    return value.normalize("NFC") as T;
  }
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => normalizeInterventionValue(entry)).sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)));
    return normalized as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.freeze(Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeInterventionValue(entry as JsonLike)]),
    )) as T;
  }
  return value;
}
