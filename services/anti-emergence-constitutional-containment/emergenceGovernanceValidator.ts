import type { AntiEmergenceError, AntiEmergenceInput } from "./antiEmergenceStateTypes";

export function validateEmergenceGovernance(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  if (
    !input.constitutionalReplayResult.replayBinding.governanceBound
    || !input.humanSupremacyResult.record.governanceBound
    || !input.constitutionalAuthorityBoundaryResult.record.governanceBound
  ) {
    return Object.freeze([Object.freeze({
      code: "ANTI_EMERGENCE_GOVERNANCE_DETACHED",
      message: "Anti-emergence containment requires governance-bound replay, supremacy, and authority state.",
      path: "constitutionalReplayResult.replayBinding.governanceBound",
    })]);
  }
  return Object.freeze([]);
}
