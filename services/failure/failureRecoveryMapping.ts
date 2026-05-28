import { FAILURE_SEVERITY, isAutomaticRecoveryBlockedForSeverity } from "./failureSeverity";
import type { FailureClassification } from "./failureClassifier";

export type FailureRecoveryMapping = {
  blocked: boolean;
  disputed: boolean;
  retryAllowed: boolean;
  replayAllowed: boolean;
  reassignmentAllowed: boolean;
  rollbackRequired: boolean;
  quarantineRequired: boolean;
  terminationRequired: boolean;
  operatorInterventionRequired: boolean;
  approvalRequired: boolean;
  escalationRequired: boolean;
  reason: string;
};

export function mapFailureClassificationToRecovery(classification: FailureClassification): FailureRecoveryMapping {
  const catastrophic = isAutomaticRecoveryBlockedForSeverity(classification.severity as any);
  const critical = classification.severity === FAILURE_SEVERITY.CRITICAL;
  const disputed = classification.category === "evidence inconsistency" || classification.confidence < 0.5;

  if (classification.category === "governance denial") {
    return {
      blocked: true,
      disputed: false,
      retryAllowed: false,
      replayAllowed: false,
      reassignmentAllowed: false,
      rollbackRequired: false,
      quarantineRequired: false,
      terminationRequired: false,
      operatorInterventionRequired: true,
      approvalRequired: classification.requiresApproval,
      escalationRequired: true,
      reason: "FAILURE_RECOVERY_GOVERNANCE_DENIAL_NOT_RETRYABLE",
    };
  }

  if (classification.category === "replay divergence") {
    return {
      blocked: true,
      disputed: true,
      retryAllowed: false,
      replayAllowed: false,
      reassignmentAllowed: false,
      rollbackRequired: false,
      quarantineRequired: true,
      terminationRequired: false,
      operatorInterventionRequired: true,
      approvalRequired: true,
      escalationRequired: true,
      reason: "FAILURE_RECOVERY_REPLAY_DIVERGENCE_BLOCKED",
    };
  }

  if (catastrophic) {
    return {
      blocked: true,
      disputed: true,
      retryAllowed: false,
      replayAllowed: false,
      reassignmentAllowed: false,
      rollbackRequired: false,
      quarantineRequired: true,
      terminationRequired: false,
      operatorInterventionRequired: true,
      approvalRequired: true,
      escalationRequired: true,
      reason: "FAILURE_RECOVERY_CATASTROPHIC_BLOCKED",
    };
  }

  if (classification.category === "database unavailable") {
    return {
      blocked: true,
      disputed: false,
      retryAllowed: false,
      replayAllowed: false,
      reassignmentAllowed: false,
      rollbackRequired: false,
      quarantineRequired: false,
      terminationRequired: false,
      operatorInterventionRequired: true,
      approvalRequired: true,
      escalationRequired: true,
      reason: "FAILURE_RECOVERY_MAPPING_BLOCKED",
    };
  }

  if (classification.category === "approval expiration") {
    return {
      blocked: false,
      disputed: false,
      retryAllowed: false,
      replayAllowed: false,
      reassignmentAllowed: false,
      rollbackRequired: false,
      quarantineRequired: false,
      terminationRequired: false,
      operatorInterventionRequired: true,
      approvalRequired: true,
      escalationRequired: classification.requiresEscalation,
      reason: "APPROVAL_RENEWAL_REQUIRED",
    };
  }

  return {
    blocked: critical || classification.requiresEscalation || disputed,
    disputed,
    retryAllowed: classification.recoverable && classification.severity !== FAILURE_SEVERITY.HIGH,
    replayAllowed: classification.recoverable && !critical && !disputed,
    reassignmentAllowed: classification.category === "timeout" || classification.category === "heartbeat loss",
    rollbackRequired: classification.category === "invalid state transition",
    quarantineRequired: critical && disputed,
    terminationRequired: false,
    operatorInterventionRequired: critical || classification.requiresApproval || classification.requiresEscalation,
    approvalRequired: classification.requiresApproval,
    escalationRequired: classification.requiresEscalation,
    reason: disputed ? "FAILURE_RECOVERY_MAPPING_BLOCKED" : "RECOVERY_ALLOWED",
  };
}
