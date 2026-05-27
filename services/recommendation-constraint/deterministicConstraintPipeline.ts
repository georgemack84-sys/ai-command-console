export const RECOMMENDATION_CONSTRAINT_PIPELINE = Object.freeze([
  "constraint_evaluation",
  "scope_ceiling_enforcement",
  "governance_boundary_enforcement",
  "authority_restriction_enforcement",
  "escalation_ceiling_enforcement",
  "replay_restriction_enforcement",
  "operational_containment_enforcement",
  "recommendation_sanitization",
  "constitutionally_safe_recommendation",
] as const);

export function buildDeterministicConstraintPipeline(): readonly string[] {
  return RECOMMENDATION_CONSTRAINT_PIPELINE;
}
