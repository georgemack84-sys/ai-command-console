import { normalizeTriggerValue } from "./triggerNormalizer";

export function serializeTriggerValue(value: unknown): string {
  return JSON.stringify(normalizeTriggerValue(value));
}
