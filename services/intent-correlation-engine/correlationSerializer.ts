import { normalizeCorrelationValue } from "./correlationNormalizer";

export function serializeCorrelationValue(value: unknown): string {
  return JSON.stringify(normalizeCorrelationValue(value));
}
