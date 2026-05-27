import type { RuntimeTelemetrySnapshot } from "./runtimeContinuityTypes";

export function computeContinuityRisk(telemetry: RuntimeTelemetrySnapshot) {
  let risk = 0;
  risk += Math.min(35, telemetry.staleLocks * 12);
  risk += Math.min(20, telemetry.recoveryBacklog * 6);
  risk += Math.min(25, (1 - telemetry.workerAvailabilityScore) * 30);
  risk += Math.min(25, (1 - telemetry.dependencyStabilityScore) * 30);
  risk += telemetry.replayDivergenceDetected ? 40 : 0;
  risk += Math.min(20, telemetry.criticalFailures * 8);
  risk += Math.min(15, telemetry.disputedFailures * 5);
  if (telemetry.startupReady === false) {
    risk += 20;
  } else if (telemetry.startupReady == null) {
    risk += 10;
  }
  return Math.max(0, Math.min(100, risk));
}
