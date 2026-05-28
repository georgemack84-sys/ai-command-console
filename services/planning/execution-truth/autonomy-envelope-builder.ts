import type { AutonomyEnvelope, DeterministicRiskProfile, GovernanceEnvelope } from "./execution-truth-types";

export function buildAutonomyEnvelope(
  riskProfile: DeterministicRiskProfile,
  governanceEnvelope: GovernanceEnvelope,
): AutonomyEnvelope {
  const downgradeReasons: string[] = [];

  if (!governanceEnvelope.allowed || riskProfile.overallRisk === "R6_FORBIDDEN" || riskProfile.failClosed) {
    downgradeReasons.push("Governance or fail-closed risk state blocks autonomous execution.");
    return {
      maxAutonomyLevel: "none",
      downgradeReasons,
    };
  }

  if (riskProfile.stepSignals.some((signal) => signal.targetEnvironment === "production" && signal.destructive)) {
    downgradeReasons.push("Production destructive action limits autonomy to manual_only.");
    return {
      maxAutonomyLevel: "manual_only",
      downgradeReasons,
    };
  }

  if (riskProfile.stepSignals.some((signal) => signal.autonomySensitivity === "critical")) {
    downgradeReasons.push("Critical autonomy sensitivity requires approval.");
    return {
      maxAutonomyLevel: "approval_required",
      downgradeReasons,
    };
  }

  switch (riskProfile.overallRisk) {
    case "R0_SAFE":
    case "R1_LOW":
      return { maxAutonomyLevel: "bounded_autonomous", downgradeReasons };
    case "R2_MODERATE":
      downgradeReasons.push("Moderate risk limits autonomy to supervised.");
      return { maxAutonomyLevel: "supervised", downgradeReasons };
    case "R3_ELEVATED":
      downgradeReasons.push("Elevated risk requires explicit approval.");
      return { maxAutonomyLevel: "approval_required", downgradeReasons };
    case "R4_HIGH":
    case "R5_CRITICAL":
      downgradeReasons.push("High risk limits autonomy to manual_only.");
      return { maxAutonomyLevel: "manual_only", downgradeReasons };
    default:
      downgradeReasons.push("Unknown risk state collapses autonomy to none.");
      return { maxAutonomyLevel: "none", downgradeReasons };
  }
}
