import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function enforceSupremacyBoundary(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  if (
    normalized.includes("replayrepair")
    || normalized.includes("replayinference")
    || normalized.includes("topologyregeneration")
    || normalized.includes("selfpreservationbehavior")
    || normalized.includes("syntheticconstitutionalstate")
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_BOUNDARY_VIOLATION",
      message: "Replay repair, inference, topology regeneration, self-preservation, or synthetic state markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
