import { normalizeOverrideValue } from "./overrideNormalizer";

export function serializeOverrideValue(value: unknown): string {
  return JSON.stringify(normalizeOverrideValue(value));
}
