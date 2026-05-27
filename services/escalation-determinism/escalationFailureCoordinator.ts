import type {
  EscalationDeterminismError,
  OversightState,
} from "./escalationStateTypes";

export function resolveEscalationOversightState(
  errors: readonly EscalationDeterminismError[],
  fallbackState: OversightState,
): OversightState {
  const codes = errors.map((item) => item.code);
  if (codes.some((code) => code === "ESCALATION_DETERMINISM_ISOLATION_VIOLATION" || code === "ESCALATION_DETERMINISM_BOUNDARY_VIOLATION")) {
    return "revoked";
  }
  if (codes.some((code) => code === "ESCALATION_DETERMINISM_GOVERNANCE_DETACHED" || code === "ESCALATION_DETERMINISM_REPLAY_MISMATCH")) {
    return "disputed";
  }
  if (codes.some((code) => code === "ESCALATION_DETERMINISM_CONTAINMENT_DEGRADED" || code === "ESCALATION_DETERMINISM_DRIFT_DETECTED" || code === "ESCALATION_DETERMINISM_DETERMINISM_VIOLATION")) {
    return "frozen";
  }
  if (errors.length > 0) {
    return "elevated";
  }
  return fallbackState;
}
