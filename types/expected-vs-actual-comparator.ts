import type { RecommendationEffectivenessResult } from "@/types/recommendation-effectiveness-contract";

export type ComparisonDomain = "MISSION_IMPACT" | "RISK" | "CONFIDENCE" | "OPERATOR_BEHAVIOR" | "GOVERNANCE" | "RECOMMENDATION_EFFECT";
export type VarianceCategory = "PERFECT_ALIGNMENT" | "MINOR_VARIANCE" | "MODERATE_VARIANCE" | "MAJOR_VARIANCE" | "CRITICAL_VARIANCE" | "NOT_OBSERVABLE";
export type VarianceSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ComparatorState = "EXPECTED_DEFINED" | "OBSERVED_AVAILABLE" | "ALIGNMENT_READY" | "VARIANCE_CALCULATED" | "VARIANCE_CLASSIFIED" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type ComparatorFailure =
  | "EXPECTED_VALUES_MISSING"
  | "OBSERVED_VALUES_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_REFERENCES_ABSENT"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "OBSERVED_OUTCOME_UNAVAILABLE"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "LEDGER_MUTATION_DETECTED"
  | "UNEXPLAINED_VARIANCE"
  | "FAIL_OPEN_BEHAVIOR";

export type ComparatorScenario =
  | "BASELINE"
  | "MINOR_VARIANCE"
  | "MODERATE_VARIANCE"
  | "MAJOR_VARIANCE"
  | "CRITICAL_VARIANCE"
  | "MISSING_EXPECTED"
  | "MISSING_OBSERVED"
  | "INCOMPLETE_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "OUTCOME_UNAVAILABLE"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "LEDGER_MUTATION"
  | "UNEXPLAINED_VARIANCE"
  | "FAIL_OPEN";

export type ComparisonValue = Readonly<{
  value_id: string;
  domain: ComparisonDomain;
  numeric_value: number;
  categorical_value: string;
  temporal_value: string;
  observable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeVariance = Readonly<{
  variance_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  comparison_domain: ComparisonDomain;
  expected: ComparisonValue;
  actual: ComparisonValue;
  absolute_variance: number;
  relative_variance: number;
  categorical_variance: boolean;
  behavioral_variance: boolean;
  governance_variance: boolean;
  temporal_variance_days: number;
  category: VarianceCategory;
  severity: VarianceSeverity;
  explanation: string;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeAlignment = Readonly<{
  alignment_id: string;
  tenant_id: string;
  aligned_domains: readonly ComparisonDomain[];
  partial_domains: readonly ComparisonDomain[];
  divergent_domains: readonly ComparisonDomain[];
  not_observable_domains: readonly ComparisonDomain[];
  alignment_score: number;
  explanation: string;
  integrity_hash: string;
}>;

export type ComparatorValidation = Readonly<{
  validation_id: string;
  state: ComparatorState;
  certified: boolean;
  failures: readonly ComparatorFailure[];
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  explanations_complete: boolean;
  evidence_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  replay_reconstruction_identical: boolean;
  integrity_hash: string;
}>;

export type ComparatorLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  comparison_id: string;
  variance_refs: readonly string[];
  recommendation_ref: string;
  decision_ref: string;
  observed_outcome_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type ComparatorApiSurface = Readonly<{
  api_id: string;
  compare_outcomes: "POST /expected-vs-actual-comparator/compare";
  validate_comparison: "POST /expected-vs-actual-comparator/validate";
  replay_comparison: "POST /expected-vs-actual-comparator/replay";
  calculate_variance: "POST /expected-vs-actual-comparator/variance";
  retrieve_contract: "GET /expected-vs-actual-comparator/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type ComparatorInput = Readonly<{
  effectiveness?: RecommendationEffectivenessResult;
  scenario?: ComparatorScenario;
}>;

export type ComparatorResult = Readonly<{
  expected_vs_actual_comparator_version: "expected-vs-actual-comparator/v1";
  effectiveness: RecommendationEffectivenessResult;
  api_surface: ComparatorApiSurface;
  expected_values: readonly ComparisonValue[];
  actual_values: readonly ComparisonValue[];
  variances: readonly OutcomeVariance[];
  alignment: OutcomeAlignment;
  validation: ComparatorValidation;
  ledger_record: ComparatorLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  compares_prediction_accuracy_only: true;
  modifies_outcomes: false;
  modifies_recommendations: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ComparatorFoundation = Readonly<{
  expected_vs_actual_comparator_version: "expected-vs-actual-comparator/v1";
  comparison_domains: readonly ComparisonDomain[];
  api_surface: ComparatorApiSurface;
  result: ComparatorResult;
}>;
