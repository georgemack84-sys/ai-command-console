import { hashSupremacyValue } from "./supremacyHashingEngine";

export function hashOverrideLineage(scope: string, value: unknown): string {
  return hashSupremacyValue(`human-supremacy-override:${scope}`, value);
}
