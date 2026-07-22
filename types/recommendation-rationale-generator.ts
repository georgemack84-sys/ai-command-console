import type { DecisionPackageBuilderResult } from "@/types/decision-package-builder";

export type RecommendationExplanationState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type RecommendationExplanation = Readonly<{
  explanation_id: string;
  package_id: string;
  orchestration_id: string;
  recommendation_id: string;
  mission_id: string;
  tenant_id: string;
  recommendation_summary: string;
  rationale: string;
  mission_alignment: string;
  objective_justification: string;
  expected_benefit: string;
  assumptions: readonly string[];
  projected_outcome: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type MissionAlignmentRecord = Readonly<{
  alignment_id: string;
  mission_id: string;
  mission_objectives: readonly string[];
  supported_objectives: readonly string[];
  alignment_score: number;
  alignment_summary: string;
  integrity_hash: string;
}>;

export type AssumptionSummary = Readonly<{
  assumption_id: string;
  package_id: string;
  assumptions: readonly string[];
  validation_status: "VALIDATED" | "MISSING";
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  integrity_hash: string;
}>;

export type ExplanationValidationResult = Readonly<{
  validation_id: string;
  explanation_id: string;
  recommendation_present: boolean;
  rationale_present: boolean;
  mission_alignment_present: boolean;
  objective_justification_present: boolean;
  expected_benefit_present: boolean;
  assumptions_present: boolean;
  outcome_present: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  failures: readonly RecommendationRationaleFailureReason[];
  integrity_hash: string;
}>;

export type RecommendationExplanationLedgerEntry = Readonly<{
  ledger_id: string;
  explanation_id: string;
  package_id: string;
  recommendation_id: string;
  generation_timestamp: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type RecommendationRationaleFailureReason =
  | "RECOMMENDATION_MISSING"
  | "RATIONALE_MISSING"
  | "MISSION_ALIGNMENT_UNAVAILABLE"
  | "OBJECTIVE_REFERENCES_MISSING"
  | "EXPECTED_BENEFIT_ABSENT"
  | "ASSUMPTIONS_UNAVAILABLE"
  | "PROJECTED_OUTCOME_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "PACKAGE_BUILD_INVALID"
  | "TENANT_MISMATCH"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_RATIONALE_GENERATOR_ACCESS"
  | "REPLAY_DIVERGENCE";

export type RecommendationRationaleGeneratorInput = Readonly<{
  package_build_result?: DecisionPackageBuilderResult;
  explanation?: RecommendationExplanation;
  mission_alignment?: MissionAlignmentRecord;
  assumptions?: AssumptionSummary;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type RecommendationRationaleGeneratorResult = Readonly<{
  generator_status: "PASS" | "FAIL";
  fail_closed: boolean;
  package_build_result: DecisionPackageBuilderResult;
  explanation: RecommendationExplanation;
  mission_alignment: MissionAlignmentRecord;
  assumptions: AssumptionSummary;
  validation: ExplanationValidationResult;
  explanation_ledger: readonly RecommendationExplanationLedgerEntry[];
  replay_hash: string;
  failures: readonly RecommendationRationaleFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type RecommendationRationaleReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  explanation_id: string;
  package_id: string;
  recommendation_id: string;
  recommendation_summary: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly RecommendationRationaleFailureReason[];
  integrity_hash: string;
}>;

export type RecommendationRationaleObservability = Readonly<{
  explanations_generated: number;
  rationale_completeness: number;
  mission_alignment_coverage: number;
  objective_reference_coverage: number;
  assumption_completeness: number;
  explanation_generation_latency_ms: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type RecommendationRationaleFoundation = Readonly<{
  generator_version: "recommendation-rationale-generator/v1";
  explanation_states: readonly RecommendationExplanationState[];
  result: RecommendationRationaleGeneratorResult;
  replay: RecommendationRationaleReplay;
  observability: RecommendationRationaleObservability;
}>;
