import { normalizeLifecycleValue } from "./lifecycleNormalizer";

export function serializeLifecycleValue(value: unknown): string {
  return JSON.stringify(normalizeLifecycleValue(value));
}
