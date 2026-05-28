import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentDrift(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  const driftDetected =
    input.constitutionalTelemetryResult.events.some((event) => event.domain === "coordination_drift" && event.triggered)
    || !input.constitutionalCertificationResult.driftResistanceCertification.resistant;
  return driftDetected ? Object.freeze([{
    code: "DECISION_INTENT_DRIFT_DETECTED",
    message: "Intent drift pressure was detected.",
    path: "drift",
  }]) : Object.freeze([]);
}
