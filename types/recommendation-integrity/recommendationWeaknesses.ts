import type { RecommendationWeaknessSeverity } from "./recommendationStates";

export type RecommendationWeaknessClass =
  | "RECOMMENDATION_EVIDENCE_RISK"
  | "RECOMMENDATION_CONFIDENCE_RISK"
  | "RECOMMENDATION_GOVERNANCE_RISK"
  | "RECOMMENDATION_ESCALATION_RISK"
  | "RECOMMENDATION_APPROVAL_RISK"
  | "RECOMMENDATION_REPLAY_RISK"
  | "RECOMMENDATION_AUTHORITY_DRIFT_RISK"
  | "RECOMMENDATION_HIDDEN_ORCHESTRATION_RISK"
  | "RECOMMENDATION_ISOLATION_RISK";

export type RecommendationWeakness = Readonly<{
  weaknessId: string;
  recommendationId: string;
  classification: RecommendationWeaknessClass;
  severity: RecommendationWeaknessSeverity;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;
