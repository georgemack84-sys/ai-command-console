import { evaluateRecoveryConstraints } from "./recoveryConstraints";
import { getRequiredRecoveryApproval } from "./recoveryApprovalRules";
import { appendRecoveryGovernanceAuditEvent } from "./recoveryAuditPolicy";

export function evaluateRecoveryGovernance({
  action,
  replayVerified,
  verificationDisputed,
  approvalState,
  conflictingActions = [],
}: {
  action: string;
  replayVerified: boolean;
  verificationDisputed: boolean;
  approvalState: "approved" | "missing" | "expired";
  conflictingActions?: string[];
}) {
  const constraints = evaluateRecoveryConstraints({
    verificationDisputed,
    conflictingActions,
  });
  if (!constraints.ok) {
    return constraints;
  }

  const approval = getRequiredRecoveryApproval(action);
  if (approval.required && approvalState !== "approved") {
    appendRecoveryGovernanceAuditEvent({
      type: "recovery.governance.blocked",
      executionId: "unknown",
      payload: {
        action,
        reason: "RECOVERY_APPROVAL_REQUIRED",
      },
    });
    return {
      ok: false as const,
      error: {
        code: "RECOVERY_APPROVAL_REQUIRED",
        message: "Recovery approval is required before the action may proceed.",
        details: {
          action,
          approvalState,
        },
      },
    };
  }

  if (!replayVerified && action !== "quarantine") {
    return {
      ok: false as const,
      error: {
        code: "RECOVERY_VERIFICATION_UNRESOLVED",
        message: "Recovery mutation is blocked until replay verification succeeds.",
        details: {
          action,
        },
      },
    };
  }

  return {
    ok: true as const,
    data: {
      approved: true,
      action,
      approval,
    },
  };
}
