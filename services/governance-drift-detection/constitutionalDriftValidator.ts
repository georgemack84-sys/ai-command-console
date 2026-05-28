import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

export function validateConstitutionalDrift(input: GovernanceDriftInput): readonly GovernanceDriftError[] {
  const errors: GovernanceDriftError[] = [];
  if (!input.validatorVersionId) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_VALIDATOR_MISMATCH",
      message: "Validator version is required for deterministic drift comparison.",
      path: "validatorVersionId",
    }));
  }
  if (!input.replayAttackResult.lineage.entries.length) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_REPLAY_MISMATCH",
      message: "Replay attack lineage must exist before governance drift can be reconstructed.",
      path: "replayAttackResult.lineage.entries",
    }));
  }
  return Object.freeze(errors);
}
