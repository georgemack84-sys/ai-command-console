import type { OperatorAuthorityError, OperatorAuthorityMetrics } from "./types/operatorAuthorityTypes";
import { hashOverrideAuditValue } from "./overrideAuditHashEngine";

export function buildOperatorAuthorityMetrics(input: {
  actionType: string;
  propagationCompleted: boolean;
  errors: readonly OperatorAuthorityError[];
}): OperatorAuthorityMetrics {
  const metrics = {
    overrideLatency: input.actionType === "OVERRIDE" ? 0 : 0,
    freezePropagation: input.actionType === "FREEZE" && input.propagationCompleted ? 1 : 0,
    revokePropagation: input.actionType === "REVOKE" && input.propagationCompleted ? 1 : 0,
    killSwitchPropagation: input.actionType === "KILL_SWITCH" && input.propagationCompleted ? 1 : 0,
    authorityRestorationAttempts: input.errors.some((e) => e.code === "OPERATOR_AUTHORITY_HIDDEN_RESTORATION") ? 1 : 0,
    staleAuthorityPersistence: input.errors.some((e) => e.code === "OPERATOR_AUTHORITY_STALE_AUTHORITY") ? 1 : 0,
    propagationFailures: input.errors.some((e) => e.code === "OPERATOR_AUTHORITY_PROPAGATION_MISMATCH") ? 1 : 0,
    replayMismatches: input.errors.some((e) => e.code === "OPERATOR_AUTHORITY_REPLAY_DRIFT") ? 1 : 0,
    escalationFrequency: input.actionType === "ESCALATE" ? 1 : 0,
    operatorInterventionFrequency: 1,
    hiddenAuthorityRecoveryAttempts: input.errors.some((e) => e.code === "OPERATOR_AUTHORITY_OVERRIDE_RECOVERY_DETECTED" || e.code === "OPERATOR_AUTHORITY_HIDDEN_RESTORATION") ? 1 : 0,
    metricsHash: "",
  };
  return Object.freeze({
    ...metrics,
    metricsHash: hashOverrideAuditValue("operator-authority-metrics", metrics),
  });
}
