import type { DecisionIntentBoundaryInput, IntentEvidence } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function generateIntentEvidence(input: {
  intentInput: DecisionIntentBoundaryInput;
  reasons: readonly string[];
}): IntentEvidence {
  const evidenceRefs = Object.freeze([
    input.intentInput.constitutionalCertificationResult.evidence.evidenceId,
    input.intentInput.constitutionalReadinessResult.evidence.evidenceId,
    input.intentInput.constitutionalReplayResult.evidence.evidenceId,
    input.intentInput.humanSupremacyResult.evidence.evidenceId,
    input.intentInput.escalationDeterminismResult.evidence.evidenceId,
    input.intentInput.antiEmergenceResult.evidence.evidenceId,
    input.intentInput.runtimeAdmissibilityResult.evidence.evidenceId,
    input.intentInput.constitutionalTelemetryResult.evidence.evidenceId,
    input.intentInput.constitutionalRuntimeSimulationResult.evidence.evidenceId,
  ]);
  return Object.freeze({
    evidenceId: hashIntentValue("decision-intent-evidence-id", {
      intentId: input.intentInput.intentId,
      evidenceRefs,
    }),
    intentId: input.intentInput.intentId,
    evidenceRefs,
    reasons: input.reasons,
    evidenceHash: hashIntentValue("decision-intent-evidence", {
      intentId: input.intentInput.intentId,
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}
