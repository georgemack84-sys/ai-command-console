import type { RecoveryVerificationResult } from "../recovery/verification/recoveryVerificationTypes";
import type { RecoveryStabilizationResult } from "./recoveryStabilizationSupervisor";

export type RecoveryContainmentResult = {
  shouldFreeze: boolean;
  shouldContain: boolean;
  reasons: string[];
};

export function evaluateRecoveryContainment({
  verification,
  stabilization,
  conflictingRecoveries = false,
  survivabilityScore = 1,
}: {
  verification?: RecoveryVerificationResult | null;
  stabilization: RecoveryStabilizationResult;
  conflictingRecoveries?: boolean;
  survivabilityScore?: number;
}): RecoveryContainmentResult {
  const reasons: string[] = [];
  let shouldFreeze = false;
  let shouldContain = false;

  if (conflictingRecoveries) {
    shouldFreeze = true;
    reasons.push("RECOVERY_CONFLICTING_RECOVERIES");
  }

  if (
    verification?.divergenceDetected
    || verification?.reconciliationState === "DIVERGED"
    || verification?.certificationDecision === "QUARANTINED"
  ) {
    shouldContain = true;
    reasons.push("RECOVERY_REPLAY_DIVERGENCE_DETECTED");
  }

  if (verification?.status === "DISPUTED" || verification?.reconciliationState === "DISPUTED") {
    shouldFreeze = true;
    reasons.push("RECOVERY_TRUTH_DISPUTED");
  }

  if (stabilization.status === "looping" || stabilization.status === "unstable") {
    shouldContain = shouldContain || survivabilityScore < 0.5;
    shouldFreeze = shouldFreeze || survivabilityScore < 0.65;
    reasons.push("RECOVERY_STABILIZATION_UNSTABLE");
  }

  if (survivabilityScore < 0.35) {
    shouldContain = true;
    reasons.push("RECOVERY_SURVIVABILITY_TOO_LOW");
  }

  return {
    shouldFreeze,
    shouldContain,
    reasons: Array.from(new Set(reasons)),
  };
}
