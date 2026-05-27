import type { DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function scoreIntentProposal(input: DecisionIntentBoundaryInput): number {
  const certificationScore = input.constitutionalCertificationResult.aggregation.aggregateScore;
  const readinessScore = input.constitutionalReadinessResult.report.readinessScore;
  return Number((((certificationScore + readinessScore) / 2) * 100).toFixed(2));
}
