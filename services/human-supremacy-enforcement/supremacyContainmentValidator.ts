import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";

export function validateSupremacyContainment(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  if (input.constitutionalReplayResult.record.failClosed) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_CONTAINMENT_DEGRADED",
      message: "Inherited fail-closed replay containment blocks supremacy certification.",
      path: "constitutionalReplayResult.record.failClosed",
    })]);
  }
  return Object.freeze([]);
}
