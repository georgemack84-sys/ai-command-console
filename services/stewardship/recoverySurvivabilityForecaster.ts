import type { RecoveryCertificationDecision, RecoveryVerificationResult } from "../recovery/verification/recoveryVerificationTypes";
import type { StewardshipState } from "./stewardshipStates";

export type RecoverySurvivabilityForecast = {
  survivabilityScore: number;
  collapseRisk: "low" | "moderate" | "high" | "critical";
  recommendedState: StewardshipState;
  reasoning: string[];
};

export function forecastRecoverySurvivability({
  continuityConfidence,
  replayDivergence,
  simulationOutcome,
  certificationDecision,
  governanceBlocked,
  stabilizationStatus,
  verification,
}: {
  continuityConfidence: number;
  replayDivergence: boolean;
  simulationOutcome?: string | null;
  certificationDecision: RecoveryCertificationDecision;
  governanceBlocked: boolean;
  stabilizationStatus: string;
  verification?: RecoveryVerificationResult | null;
}): RecoverySurvivabilityForecast {
  let survivabilityScore = continuityConfidence;
  const reasoning: string[] = [];

  if (replayDivergence || verification?.divergenceDetected) {
    survivabilityScore -= 0.45;
    reasoning.push("replay_divergence_detected");
  }
  if (governanceBlocked) {
    survivabilityScore -= 0.2;
    reasoning.push("governance_blocked");
  }
  if (simulationOutcome === "CONTAINMENT_REQUIRED" || simulationOutcome === "GOVERNANCE_BLOCKED") {
    survivabilityScore -= 0.2;
    reasoning.push("simulation_blocker_detected");
  }
  if (stabilizationStatus === "degrading") {
    survivabilityScore -= 0.15;
    reasoning.push("recovery_still_degrading");
  }
  if (["unstable", "looping"].includes(stabilizationStatus)) {
    survivabilityScore -= 0.3;
    reasoning.push("recovery_loop_or_instability_detected");
  }
  if (certificationDecision === "QUARANTINED" || certificationDecision === "REJECTED") {
    survivabilityScore -= 0.35;
    reasoning.push("certification_blocks_continuation");
  } else if (certificationDecision === "CERTIFIED_WITH_WARNINGS") {
    survivabilityScore -= 0.1;
    reasoning.push("certification_warnings_present");
  }

  survivabilityScore = Math.max(0, Math.min(1, survivabilityScore));

  const collapseRisk =
    survivabilityScore < 0.2 ? "critical"
      : survivabilityScore < 0.45 ? "high"
        : survivabilityScore < 0.7 ? "moderate"
          : "low";

  const recommendedState: StewardshipState =
    collapseRisk === "critical" ? "CONTAINED"
      : collapseRisk === "high" ? "ESCALATED"
        : collapseRisk === "moderate" ? "DEGRADED"
          : "VERIFIED";

  return {
    survivabilityScore,
    collapseRisk,
    recommendedState,
    reasoning,
  };
}
