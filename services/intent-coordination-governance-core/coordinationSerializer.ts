import { normalizeCoordinationValue } from "./coordinationNormalizer";

export function serializeCoordinationValue(value: unknown): string {
  return JSON.stringify(normalizeCoordinationValue(value));
}
