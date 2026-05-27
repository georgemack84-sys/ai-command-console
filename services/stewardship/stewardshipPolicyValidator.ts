import type { RecoveryVerificationResult } from "../recovery/verification/recoveryVerificationTypes";

export type StewardshipPolicyValidationResult = {
  ok: boolean;
  governanceBlocked: boolean;
  verificationBlocked: boolean;
  reasons: string[];
};

export function validateStewardshipPolicy({
  verification,
  conflictingRecoveries = false,
  approvalPending = false,
  ambiguousRecoveryState = false,
}: {
  verification?: RecoveryVerificationResult | null;
  conflictingRecoveries?: boolean;
  approvalPending?: boolean;
  ambiguousRecoveryState?: boolean;
}): StewardshipPolicyValidationResult {
  const reasons: string[] = [];
  let governanceBlocked = false;
  let verificationBlocked = false;

  if (!verification) {
    verificationBlocked = true;
    reasons.push("RECOVERY_VERIFICATION_EVIDENCE_MISSING");
  } else {
    if (verification.status === "UNVERIFIABLE" || verification.status === "FAILED") {
      verificationBlocked = true;
      reasons.push("RECOVERY_VERIFICATION_FAILED");
    }
    if (verification.divergenceDetected) {
      verificationBlocked = true;
      reasons.push("RECOVERY_REPLAY_DIVERGENCE_DETECTED");
    }
    if (verification.disputed || verification.reconciliationState === "DISPUTED") {
      governanceBlocked = true;
      reasons.push("RECOVERY_TRUTH_DISPUTED");
    }
    if (verification.certificationDecision === "REJECTED" || verification.certificationDecision === "QUARANTINED") {
      governanceBlocked = true;
      reasons.push("RECOVERY_CERTIFICATION_REJECTED");
    }
    if (verification.requiresOperatorReview) {
      governanceBlocked = true;
      reasons.push("RECOVERY_OPERATOR_REVIEW_REQUIRED");
    }
  }

  if (approvalPending) {
    governanceBlocked = true;
    reasons.push("RECOVERY_APPROVAL_PENDING");
  }

  if (conflictingRecoveries) {
    governanceBlocked = true;
    reasons.push("RECOVERY_CONFLICTING_RECOVERIES");
  }

  if (ambiguousRecoveryState) {
    governanceBlocked = true;
    verificationBlocked = true;
    reasons.push("RECOVERY_STATE_AMBIGUOUS");
  }

  return {
    ok: !governanceBlocked && !verificationBlocked,
    governanceBlocked,
    verificationBlocked,
    reasons: Array.from(new Set(reasons)),
  };
}
