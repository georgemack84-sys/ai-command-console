import { normalizeContainmentValue } from "./containmentNormalizer";

export function serializeContainmentValue(value: unknown): string {
  return JSON.stringify(normalizeContainmentValue(value));
}
