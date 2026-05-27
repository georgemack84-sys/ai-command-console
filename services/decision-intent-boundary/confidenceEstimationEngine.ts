import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function estimateIntentConfidence(input: {
  intentInput: DecisionIntentBoundaryInput;
  proposalScore: number;
  errors: readonly DecisionIntentBoundaryError[];
}) {
  const uncertaintyFactors = Object.freeze(input.errors.map((error) => error.code));
  const base = (input.intentInput.constitutionalCertificationResult.aggregation.confidenceScore + (input.proposalScore / 100)) / 2;
  const score = Number(Math.max(0, base - (input.errors.length * 0.08)).toFixed(4));
  return Object.freeze({
    score,
    reasoning: Object.freeze([
      "Confidence derived from constitutional certification and readiness evidence.",
      "Operator review remains mandatory regardless of score.",
    ]),
    uncertaintyFactors,
  });
}
