import { createHash } from "node:crypto";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`);
  return `{${entries.join(",")}}`;
}

export function hashRecommendationLineageValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(stableSerialize(value));
  return hash.digest("hex");
}

export function serializeRecommendationLineageValue(value: unknown): string {
  return stableSerialize(value);
}
