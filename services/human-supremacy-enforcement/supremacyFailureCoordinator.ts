import type {
  HumanSupremacyError,
  OperatorInterventionType,
  SupremacyEnforcementState,
} from "./supremacyStateTypes";

export function resolveSupremacyState(input: {
  interventionType: OperatorInterventionType;
  errors: readonly HumanSupremacyError[];
}): SupremacyEnforcementState {
  const codes = input.errors.map((item) => item.code);
  if (codes.some((code) => code === "HUMAN_SUPREMACY_ISOLATION_VIOLATION" || code === "HUMAN_SUPREMACY_BOUNDARY_VIOLATION")) {
    return "INVALID";
  }
  if (codes.some((code) => code === "HUMAN_SUPREMACY_GOVERNANCE_DETACHED" || code === "HUMAN_SUPREMACY_REPLAY_MISMATCH")) {
    return "DISPUTED";
  }
  if (codes.some((code) => code === "HUMAN_SUPREMACY_CONTAINMENT_DEGRADED" || code === "HUMAN_SUPREMACY_OVERRIDE_SUPPRESSED" || code === "HUMAN_SUPREMACY_FREEZE_PROPAGATION_FAILED")) {
    return "FROZEN";
  }
  if (codes.length > 0) {
    return "REVOKED";
  }
  if (input.interventionType === "kill_switch") {
    return "SHUTDOWN";
  }
  if (input.interventionType === "freeze") {
    return "FROZEN";
  }
  if (input.interventionType === "revoke_authority" || input.interventionType === "revoke_escalation") {
    return "REVOKED";
  }
  return "ENFORCED";
}
