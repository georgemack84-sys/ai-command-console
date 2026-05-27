import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function validateSupremacyDeterminism(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  if (!input.constitutionalReplayResult.record.replayDeterministic || normalized.includes("nondeterministic")) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_DETERMINISM_VIOLATION",
      message: "Human supremacy enforcement requires deterministic replay and deterministic intervention reconstruction.",
      path: !input.constitutionalReplayResult.record.replayDeterministic
        ? "constitutionalReplayResult.record.replayDeterministic"
        : "metadata",
    })]);
  }
  return Object.freeze([]);
}
