import { analyzeCapabilityEscalation } from "./capabilityEscalationAnalyzer";
import { detectExecutionSemantics } from "./executionSemanticDetector";
import { analyzeMutationAuthority } from "./mutationAuthorityAnalyzer";
import { orderSemanticFindingsDeterministically } from "./constitutionalOrderingEngine";
import { detectOrchestrationSemantics } from "./orchestrationSemanticDetector";
import { detectSchedulingSemantics } from "./schedulingSemanticDetector";
import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

export function buildConstitutionalSemanticCorpus(input: {
  summary: string;
  rationale: string;
  replayReasoning: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}): string {
  return [
    input.summary,
    input.rationale,
    ...input.replayReasoning,
    JSON.stringify(input.metadata ?? {}),
  ].join("\n").trim();
}

export function validateRecommendationSemantics(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
}): readonly SemanticFinding[] {
  const findings = [
    ...detectExecutionSemantics(input),
    ...detectSchedulingSemantics(input),
    ...detectOrchestrationSemantics(input),
    ...analyzeCapabilityEscalation(input),
    ...analyzeMutationAuthority(input),
  ];

  return orderSemanticFindingsDeterministically(findings);
}
