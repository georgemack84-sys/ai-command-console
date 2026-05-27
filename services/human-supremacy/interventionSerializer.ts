import { normalizeInterventionValue } from "./interventionNormalizer";

export function serializeInterventionValue(value: unknown): string {
  return JSON.stringify(normalizeInterventionValue(value as never));
}
