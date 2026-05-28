import type { DecisionIntentBoundaryInput, IntentRiskLevel } from "./decisionIntentStateTypes";

export function buildDecisionRecommendation(input: {
  intentInput: DecisionIntentBoundaryInput;
  riskLevel: IntentRiskLevel;
  proposalScore: number;
}): string {
  const intentLabel = input.intentInput.intentType.replaceAll("_", " ");
  return `Advisory ${intentLabel} retained for operator review only. Risk level: ${input.riskLevel}. Proposal score: ${input.proposalScore}.`;
}
