import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function validateIntentDeterminism(input: {
  intentInput: DecisionIntentBoundaryInput;
  scans: readonly IntentSemanticScanRecord[];
}): readonly DecisionIntentBoundaryError[] {
  const value = hashIntentValue("decision-intent-determinism", {
    intentId: input.intentInput.intentId,
    scanHashes: input.scans.map((scan) => scan.deterministicHash),
    readinessHash: input.intentInput.constitutionalReadinessResult.deterministicHash,
    certificationHash: input.intentInput.constitutionalCertificationResult.deterministicHash,
  });
  return value.length > 0 ? Object.freeze([]) : Object.freeze([{
    code: "DECISION_INTENT_NONDETERMINISTIC",
    message: "Intent determinism hash could not be generated.",
    path: "determinism",
  }]);
}
