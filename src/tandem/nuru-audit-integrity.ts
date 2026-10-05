/** Stable JSON serialization for audit evidence: object keys are lexical and arrays retain their recorded order. */
export function canonicalizeNuruAuditPayload(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toJSON());
  if (Array.isArray(value)) return `[${value.map(canonicalizeNuruAuditPayload).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalizeNuruAuditPayload(record[key])}`).join(",")}}`;
}
