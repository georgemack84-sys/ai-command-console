import { normalizeReadinessValue } from "./readinessNormalizer";

export function serializeReadinessValue(value: unknown): string {
  return JSON.stringify(normalizeReadinessValue(value));
}
