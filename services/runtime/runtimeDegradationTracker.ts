import type { ContinuitySnapshot, RuntimeDegradationAssessment } from "./runtimeContinuityTypes";

export function evaluateRuntimeDegradation(snapshots: ContinuitySnapshot[]): RuntimeDegradationAssessment {
  const ordered = [...snapshots].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  if (ordered.length < 2) {
    return {
      status: "stable",
      degraded: false,
      cascadingFailures: false,
      chronicRuntimeDecay: false,
      recoveryLoopDetected: false,
      evidence: [],
    };
  }

  const latest = ordered[ordered.length - 1];
  const previous = ordered[ordered.length - 2];
  const riskIncreasing = latest.continuityRiskScore > previous.continuityRiskScore;
  const survivabilityDropping = latest.survivabilityScore < previous.survivabilityScore;
  const chronicRuntimeDecay = ordered.slice(-3).every((snapshot, index, values) =>
    index === 0 || snapshot.survivabilityScore <= values[index - 1].survivabilityScore,
  );
  const recoveryLoopDetected = ordered.slice(-3).filter((snapshot) => snapshot.recoveryInProgress).length >= 2;
  const cascadingFailures = latest.staleLocks > previous.staleLocks && latest.degradedDependencies.length > previous.degradedDependencies.length;

  return {
    status:
      chronicRuntimeDecay ? "chronic"
      : cascadingFailures ? "cascading"
      : riskIncreasing || survivabilityDropping ? "degrading"
      : "stable",
    degraded: riskIncreasing || survivabilityDropping || cascadingFailures || chronicRuntimeDecay,
    cascadingFailures,
    chronicRuntimeDecay,
    recoveryLoopDetected,
    evidence: [
      riskIncreasing ? "continuity_risk_increasing" : "",
      survivabilityDropping ? "survivability_dropping" : "",
      cascadingFailures ? "cascading_failures" : "",
      chronicRuntimeDecay ? "chronic_runtime_decay" : "",
      recoveryLoopDetected ? "recovery_loop_detected" : "",
    ].filter(Boolean),
  };
}
