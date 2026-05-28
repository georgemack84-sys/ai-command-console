import type { ExecutionTruthPackage } from "../execution-truth";
import type { AutonomySafetyBoundary } from "./execution-safety-types";

export function buildAutonomyEnvelope(executionTruthPackage: ExecutionTruthPackage): AutonomySafetyBoundary {
  return {
    maxAutonomyLevel: executionTruthPackage.autonomyEnvelope.maxAutonomyLevel,
    downgradeReasons: [...executionTruthPackage.autonomyEnvelope.downgradeReasons],
    selfElevationBlocked: executionTruthPackage.autonomyEnvelope.maxAutonomyLevel !== "bounded_autonomous",
  };
}

export function enforceAutonomyBoundary(executionTruthPackage: ExecutionTruthPackage): AutonomySafetyBoundary {
  const boundary = buildAutonomyEnvelope(executionTruthPackage);
  if (executionTruthPackage.riskProfile.stepSignals.some((signal) => signal.autonomySensitivity === "critical")) {
    return {
      ...boundary,
      maxAutonomyLevel: boundary.maxAutonomyLevel === "bounded_autonomous"
        ? "approval_required"
        : boundary.maxAutonomyLevel,
      downgradeReasons: [...boundary.downgradeReasons, "Critical autonomy sensitivity prevents self-elevation."],
      selfElevationBlocked: true,
    };
  }
  return boundary;
}
