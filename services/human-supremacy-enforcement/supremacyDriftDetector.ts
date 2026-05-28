import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function detectSupremacyDrift(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  if (
    normalized.includes("overridelineagecorruption")
    || normalized.includes("interventionlineagecorruption")
    || normalized.includes("staleauthoritycontinuation")
    || normalized.includes("replayhashmismatch")
    || normalized.includes("deterministicreplaymismatch")
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_DRIFT_DETECTED",
      message: "Supremacy drift, stale authority continuation, or replay mismatch markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
