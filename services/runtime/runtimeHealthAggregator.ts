import type { RuntimeContinuityState, RuntimeState, RuntimeTelemetrySnapshot } from "./runtimeContinuityTypes";
import { computeContinuityRisk } from "./continuityRiskEngine";
import { deriveContinuityConfidence } from "./continuityConfidenceEngine";
import { computeSurvivabilityScore } from "./survivabilityScoring";

export function aggregateRuntimeHealth(telemetry: RuntimeTelemetrySnapshot): RuntimeContinuityState {
  const continuityRiskScore = computeContinuityRisk(telemetry);
  const survivabilityScore = computeSurvivabilityScore({
    continuityRiskScore,
    workerAvailabilityScore: telemetry.workerAvailabilityScore,
    dependencyStabilityScore: telemetry.dependencyStabilityScore,
    replayDivergenceDetected: telemetry.replayDivergenceDetected,
  });
  const confidence = deriveContinuityConfidence({
    telemetry,
    continuityRiskScore,
    survivabilityScore,
  });

  let runtimeState: RuntimeState = "HEALTHY";
  if (telemetry.replayDivergenceDetected || telemetry.criticalFailures > 0) {
    runtimeState = "QUARANTINED";
  } else if (continuityRiskScore >= 80 || survivabilityScore < 25) {
    runtimeState = "FAILED";
  } else if (telemetry.recoveryInProgress) {
    runtimeState = "RECOVERING";
  } else if (telemetry.staleLocks > 0 && telemetry.activeExecutions > 0) {
    runtimeState = "STALLED";
  } else if (continuityRiskScore >= 60) {
    runtimeState = "CONTINUITY_RISK";
  } else if (telemetry.degradedSubsystems >= 2) {
    runtimeState = "PARTIALLY_OPERATIONAL";
  } else if (telemetry.degradedSubsystems >= 1 || continuityRiskScore >= 25) {
    runtimeState = "DEGRADED";
  }

  return {
    runtimeState,
    continuityConfidence: confidence.confidence,
    recoveryEligible:
      runtimeState !== "FAILED"
      && runtimeState !== "QUARANTINED"
      && telemetry.replayDivergenceDetected === false
      && confidence.confidence >= 0.4,
    recoveryReadiness: Math.max(0, Math.min(1, survivabilityScore / 100)),
    degradedDependencies: [...telemetry.degradedDependencies],
    activeExecutions: telemetry.activeExecutions,
    staleLocks: telemetry.staleLocks,
    replayDivergenceDetected: telemetry.replayDivergenceDetected,
    dependencyStabilityScore: telemetry.dependencyStabilityScore,
    workerAvailabilityScore: telemetry.workerAvailabilityScore,
    survivabilityScore,
    updatedAt: telemetry.timestamp,
  };
}
