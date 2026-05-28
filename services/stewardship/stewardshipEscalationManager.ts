import type { RecoveryVerificationResult } from "../recovery/verification/recoveryVerificationTypes";
import type { RecoveryContainmentResult } from "./recoveryContainmentEngine";
import type { RecoveryStabilizationResult } from "./recoveryStabilizationSupervisor";

export type StewardshipEscalationResult = {
  shouldEscalate: boolean;
  reasons: string[];
};

export function evaluateStewardshipEscalation({
  verification,
  stabilization,
  containment,
  governanceBlocked,
  recentCertificationFailures = 0,
}: {
  verification?: RecoveryVerificationResult | null;
  stabilization: RecoveryStabilizationResult;
  containment: RecoveryContainmentResult;
  governanceBlocked: boolean;
  recentCertificationFailures?: number;
}): StewardshipEscalationResult {
  const reasons: string[] = [];

  if (governanceBlocked) {
    reasons.push("RECOVERY_GOVERNANCE_CONFLICT");
  }
  if (stabilization.status === "degrading" || stabilization.status === "unstable" || stabilization.status === "looping") {
    reasons.push("RECOVERY_DEGRADATION_UNRESOLVED");
  }
  if (containment.shouldContain || containment.shouldFreeze) {
    reasons.push("RECOVERY_CONTAINMENT_TRIGGERED");
  }
  if (recentCertificationFailures >= 2) {
    reasons.push("RECOVERY_CERTIFICATION_REPEATED_FAILURE");
  }
  if (verification?.requiresOperatorReview || verification?.certificationDecision === "ESCALATED") {
    reasons.push("RECOVERY_OPERATOR_INTERVENTION_REQUIRED");
  }

  return {
    shouldEscalate: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
  };
}
