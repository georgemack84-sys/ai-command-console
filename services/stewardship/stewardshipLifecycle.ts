import type {
  RecoveryCertificationDecision,
  RecoveryVerificationStatus,
  TruthReconciliationState,
} from "../recovery/verification/recoveryVerificationTypes";
import { validateStewardshipTransition, type StewardshipState } from "./stewardshipStates";

export type StewardshipLifecycleInput = {
  previousState?: StewardshipState;
  verificationStatus: RecoveryVerificationStatus;
  reconciliationState: TruthReconciliationState;
  certificationDecision: RecoveryCertificationDecision;
  continuityState: string;
  shouldFreeze: boolean;
  shouldContain: boolean;
  shouldEscalate: boolean;
  governanceBlocked: boolean;
  verificationBlocked: boolean;
  conflictingRecoveries: boolean;
  stabilizationStatus: string;
  survivabilityScore: number;
};

export type StewardshipLifecycleResult = {
  state: StewardshipState;
  reasoning: string[];
  transitionValid: boolean;
};

export function evaluateStewardshipLifecycle(input: StewardshipLifecycleInput): StewardshipLifecycleResult {
  const reasoning: string[] = [];
  let candidate: StewardshipState = "MONITORING";

  if (input.reconciliationState === "DIVERGED" || input.shouldContain) {
    candidate = "CONTAINED";
    reasoning.push("replay_or_truth_divergence_detected");
  } else if (input.shouldFreeze || input.conflictingRecoveries) {
    candidate = "FROZEN";
    reasoning.push("recovery_chain_frozen");
  } else if (
    input.reconciliationState === "DISPUTED"
    || input.verificationStatus === "DISPUTED"
    || input.verificationBlocked
  ) {
    candidate = "DISPUTED";
    reasoning.push("verified_truth_disputed");
  } else if (input.governanceBlocked || input.shouldEscalate) {
    candidate = "ESCALATED";
    reasoning.push("governance_or_escalation_required");
  } else if (
    input.certificationDecision === "CERTIFIED"
    && input.reconciliationState === "RECONCILED"
    && input.stabilizationStatus === "stable"
    && input.survivabilityScore >= 0.8
  ) {
    candidate = "VERIFIED";
    reasoning.push("certified_and_stable");
  } else if (
    input.stabilizationStatus === "stabilizing"
    || input.continuityState === "RECOVERING"
  ) {
    candidate = "STABILIZING";
    reasoning.push("recovery_still_stabilizing");
  } else if (
    ["DEGRADED", "CONTINUITY_RISK", "PARTIALLY_OPERATIONAL", "STALLED", "FAILED", "QUARANTINED"].includes(input.continuityState)
    || ["degrading", "unstable", "looping"].includes(input.stabilizationStatus)
  ) {
    candidate = "DEGRADED";
    reasoning.push("continuity_degradation_detected");
  } else if (
    input.verificationStatus === "PARTIALLY_VERIFIED"
    || input.certificationDecision === "CERTIFIED_WITH_WARNINGS"
  ) {
    candidate = "SUPERVISING";
    reasoning.push("recovery_requires_supervision");
  }

  const transition = validateStewardshipTransition(input.previousState, candidate);
  if (!transition.ok) {
    return {
      state: "DISPUTED",
      reasoning: [...reasoning, String(transition.code)],
      transitionValid: false,
    };
  }

  return {
    state: candidate,
    reasoning,
    transitionValid: true,
  };
}
