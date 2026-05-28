import type { RuntimeContinuityState } from "../runtime/runtimeContinuityTypes";
import type { RecoverySimulationResult } from "../recovery/simulation/recoverySimulationTypes";
import type { RecoveryVerificationResult, StoredSimulationSummary } from "../recovery/verification/recoveryVerificationTypes";

export type RecoveryStabilizationStatus = "stable" | "stabilizing" | "degrading" | "unstable" | "looping";

export type RecoveryStabilizationResult = {
  status: RecoveryStabilizationStatus;
  confidence: number;
  degradationIndicators: string[];
  reasoning: string[];
};

export function superviseRecoveryStabilization({
  continuityState,
  verification,
  simulation,
  activeRecoveryCount = 0,
  blockedEventCount = 0,
  quarantineEventCount = 0,
}: {
  continuityState?: (RuntimeContinuityState & { degradation?: { status?: string; evidence?: string[] } }) | null;
  verification?: RecoveryVerificationResult | null;
  simulation?: RecoverySimulationResult | StoredSimulationSummary | null;
  activeRecoveryCount?: number;
  blockedEventCount?: number;
  quarantineEventCount?: number;
}): RecoveryStabilizationResult {
  const degradationIndicators = Array.from(new Set([
    ...((continuityState?.degradation?.evidence || []) as string[]),
    ...(simulation?.warnings || []),
    ...(simulation?.disputes || []),
  ]));
  const reasoning: string[] = [];
  let status: RecoveryStabilizationStatus = "stable";
  let confidence = continuityState?.continuityConfidence ?? 0;

  if (!continuityState || !verification) {
    return {
      status: "unstable",
      confidence: 0,
      degradationIndicators: ["stewardship_inputs_missing"],
      reasoning: ["stewardship_inputs_missing"],
    };
  }

  if (blockedEventCount >= 2 || quarantineEventCount >= 1) {
    status = "looping";
    confidence = Math.min(confidence, 0.3);
    reasoning.push("persistent_recovery_loop_detected");
  } else if (
    simulation?.outcome === "REPLAY_DIVERGENCE_DETECTED"
    || verification.divergenceDetected
    || continuityState.runtimeState === "QUARANTINED"
    || continuityState.runtimeState === "FAILED"
  ) {
    status = "unstable";
    confidence = Math.min(confidence, 0.25);
    reasoning.push("runtime_not_stable_for_recovery");
  } else if (
    ["DEGRADED", "CONTINUITY_RISK", "PARTIALLY_OPERATIONAL", "STALLED"].includes(continuityState.runtimeState)
    || continuityState.degradation?.status === "degrading"
    || continuityState.degradation?.status === "cascading"
    || continuityState.degradation?.status === "chronic"
  ) {
    status = "degrading";
    confidence = Math.min(confidence, 0.55);
    reasoning.push("continuity_degradation_persists");
  } else if (
    continuityState.runtimeState === "RECOVERING"
    || activeRecoveryCount > 0
    || verification.status === "PARTIALLY_VERIFIED"
  ) {
    status = "stabilizing";
    confidence = Math.min(0.8, Math.max(confidence, 0.55));
    reasoning.push("recovery_path_is_still_stabilizing");
  } else {
    confidence = Math.max(confidence, 0.85);
    reasoning.push("runtime_stable_under_verified_truth");
  }

  return {
    status,
    confidence: Math.max(0, Math.min(1, confidence)),
    degradationIndicators,
    reasoning,
  };
}
