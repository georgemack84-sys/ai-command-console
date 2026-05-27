import type { RecoveryVerificationResult } from "../recovery/verification/recoveryVerificationTypes";
import { evaluateStewardshipLifecycle, type StewardshipLifecycleResult } from "./stewardshipLifecycle";
import type { StewardshipPolicyValidationResult } from "./stewardshipPolicyValidator";
import type { RecoveryStabilizationResult } from "./recoveryStabilizationSupervisor";
import type { RecoveryContainmentResult } from "./recoveryContainmentEngine";
import type { StewardshipEscalationResult } from "./stewardshipEscalationManager";
import type { RecoverySurvivabilityForecast } from "./recoverySurvivabilityForecaster";
import type { StewardshipState } from "./stewardshipStates";

export type StewardshipEvaluationResult = {
  state: StewardshipState;
  previousState?: StewardshipState;
  confidence: number;
  shouldFreeze: boolean;
  shouldContain: boolean;
  shouldEscalate: boolean;
  governanceBlocked: boolean;
  verificationBlocked: boolean;
  stabilizationStatus: string;
  survivabilityScore: number;
  reasoning: string[];
  evidence: string[];
  auditAppended: boolean;
};

export function coordinateStewardshipEvaluation({
  previousState,
  verification,
  policy,
  stabilization,
  containment,
  escalation,
  survivability,
}: {
  previousState?: StewardshipState;
  verification: RecoveryVerificationResult;
  policy: StewardshipPolicyValidationResult;
  stabilization: RecoveryStabilizationResult;
  containment: RecoveryContainmentResult;
  escalation: StewardshipEscalationResult;
  survivability: RecoverySurvivabilityForecast;
}): StewardshipEvaluationResult {
  const lifecycle: StewardshipLifecycleResult = evaluateStewardshipLifecycle({
    previousState,
    verificationStatus: verification.status,
    reconciliationState: verification.reconciliationState,
    certificationDecision: verification.certificationDecision,
    continuityState: verification.reconciliationState === "RECONCILED" ? "HEALTHY" : "DEGRADED",
    shouldFreeze: containment.shouldFreeze,
    shouldContain: containment.shouldContain,
    shouldEscalate: escalation.shouldEscalate,
    governanceBlocked: policy.governanceBlocked,
    verificationBlocked: policy.verificationBlocked,
    conflictingRecoveries: policy.reasons.includes("RECOVERY_CONFLICTING_RECOVERIES"),
    stabilizationStatus: stabilization.status,
    survivabilityScore: survivability.survivabilityScore,
  });

  return {
    state: lifecycle.state,
    previousState,
    confidence: Math.max(
      0,
      Math.min(
        1,
        (stabilization.confidence + survivability.survivabilityScore + (verification.verified ? 1 : 0)) / 3,
      ),
    ),
    shouldFreeze: containment.shouldFreeze,
    shouldContain: containment.shouldContain,
    shouldEscalate: escalation.shouldEscalate,
    governanceBlocked: policy.governanceBlocked,
    verificationBlocked: policy.verificationBlocked,
    stabilizationStatus: stabilization.status,
    survivabilityScore: survivability.survivabilityScore,
    reasoning: Array.from(new Set([
      ...lifecycle.reasoning,
      ...policy.reasons,
      ...stabilization.reasoning,
      ...containment.reasons,
      ...escalation.reasons,
      ...survivability.reasoning,
    ])),
    evidence: verification.evidence,
    auditAppended: false,
  };
}
