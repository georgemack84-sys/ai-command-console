import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function validateSupremacyGovernance(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  const replay = input.constitutionalReplayResult;
  if (
    !replay.historicalGovernance.governanceSnapshotId
    || !replay.record.governanceSnapshotId
    || normalized.includes("governancedetachment")
    || normalized.includes("governancesubstitution")
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_GOVERNANCE_DETACHED",
      message: "Human supremacy enforcement requires immutable historical governance bindings.",
      path: "constitutionalReplayResult.historicalGovernance",
    })]);
  }
  return Object.freeze([]);
}
