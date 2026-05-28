import type { ContinuityConfidenceLevel, RuntimeTelemetrySnapshot } from "./runtimeContinuityTypes";

export function deriveContinuityConfidence({
  telemetry,
  continuityRiskScore,
  survivabilityScore,
}: {
  telemetry: RuntimeTelemetrySnapshot;
  continuityRiskScore: number;
  survivabilityScore: number;
}) {
  const confidence = Math.max(
    0,
    Math.min(
      1,
      0.5
        + telemetry.workerAvailabilityScore * 0.2
        + telemetry.dependencyStabilityScore * 0.2
        + (telemetry.startupReady === true ? 0.1 : telemetry.startupReady === false ? -0.2 : -0.1)
        - continuityRiskScore / 200
        + survivabilityScore / 250,
    ),
  );

  let level: ContinuityConfidenceLevel = "MONITORED";
  if (confidence >= 0.9) {
    level = "VERIFIED";
  } else if (confidence >= 0.75) {
    level = "STABLE";
  } else if (confidence >= 0.55) {
    level = "MONITORED";
  } else if (confidence >= 0.35) {
    level = "DEGRADED";
  } else if (telemetry.replayDivergenceDetected || telemetry.disputedFailures > 0) {
    level = "DISPUTED";
  } else {
    level = "UNTRUSTED";
  }

  return { confidence, level };
}
