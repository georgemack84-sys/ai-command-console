import { normalizeEscalationValue } from "./escalationNormalizer";

export function serializeEscalationValue(value: unknown): string {
  return JSON.stringify(normalizeEscalationValue(value));
}
