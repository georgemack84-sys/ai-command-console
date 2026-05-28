type JsonLike =
  | null
  | boolean
  | number
  | string
  | readonly JsonLike[]
  | { readonly [key: string]: JsonLike };

function normalizeString(value: string): string {
  return value.normalize("NFC");
}

export function normalizeMissionGraphValue<T extends JsonLike>(value: T): T {
  if (typeof value === "string") {
    return normalizeString(value) as T;
  }
  if (Array.isArray(value)) {
    const normalizedArray = value.map((item) => normalizeMissionGraphValue(item)).sort((left, right) => {
      const leftKey = JSON.stringify(left);
      const rightKey = JSON.stringify(right);
      return leftKey.localeCompare(rightKey);
    });
    return normalizedArray as unknown as T;
  }
  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, normalizeMissionGraphValue(entryValue)] as const);
    return Object.freeze(Object.fromEntries(sortedEntries)) as T;
  }
  return value;
}
