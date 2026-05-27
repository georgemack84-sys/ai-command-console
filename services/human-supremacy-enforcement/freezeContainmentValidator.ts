import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function validateFreezeContainment(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  if (normalized.includes("containmentdegradation") || normalized.includes("autonomysurvivesrevocation")) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_CONTAINMENT_DEGRADED",
      message: "Freeze containment degraded or autonomy survived revocation markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
