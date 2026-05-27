import { normalizeFreshnessValue } from "./freshnessNormalizer";

export function serializeFreshnessValue(value: unknown): string {
  return JSON.stringify(normalizeFreshnessValue(value));
}
