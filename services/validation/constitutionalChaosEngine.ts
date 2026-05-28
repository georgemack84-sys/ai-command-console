import type { ChaosCondition, ValidationOutcome } from "./types";
import { dedupeReasons, shouldFreezeValidation } from "./validationPolicies";

const CHAOS_REASON_MAP: Record<ChaosCondition, string> = {
  lease_loss: "lease_loss_detected",
  heartbeat_loss: "heartbeat_loss_detected",
  replay_corruption: "replay_corruption_detected",
  governance_outage: "governance_outage_detected",
  escalation_storm: "escalation_storm_detected",
  dependency_instability: "dependency_instability_detected",
  stale_ownership_claim: "stale_ownership_claim_detected",
  operator_interruption: "operator_interruption_detected",
};

export function runConstitutionalChaosValidation(input: {
  conditions: ChaosCondition[];
}): ValidationOutcome & { chaosConditions: ChaosCondition[] } {
  const blockedReasons = dedupeReasons(input.conditions.map((condition) => CHAOS_REASON_MAP[condition]));
  const freezeActivated = shouldFreezeValidation({
    replayCorrupted: input.conditions.includes("replay_corruption"),
    operatorAuthorityConflict: input.conditions.includes("operator_interruption") || input.conditions.includes("lease_loss"),
    constitutionalBlocked: input.conditions.includes("governance_outage"),
    escalationLoopDetected: input.conditions.includes("escalation_storm"),
  });

  return {
    valid: blockedReasons.length === 0,
    freezeActivated,
    containmentActivated: input.conditions.includes("replay_corruption") || input.conditions.includes("dependency_instability"),
    operatorReviewRequired: blockedReasons.length > 0,
    blockedReasons,
    chaosConditions: [...input.conditions],
  };
}
