export type ComparisonCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ComparisonType = "PAIRWISE" | "PORTFOLIO" | "SCENARIO_WEIGHTED" | "FORECAST_WEIGHTED";
export type ComparisonLifecycleState = "REGISTERED" | "ELIGIBILITY_VALIDATED" | "UNDER_COMPARISON" | "THRESHOLD_EVALUATED" | "TIE_RESOLVED" | "QUALIFIED" | "COMPLETE" | "SUPERSEDED" | "ARCHIVED" | "REPLAYED";
export type ComparisonQualificationStatus = "QUALIFIED" | "REQUIRES_REVIEW" | "REJECTED";
export type ComparisonOutcome = "RANKED" | "TIE_RESOLVED" | "NO_ELIGIBLE_STRATEGIES" | "FAILED";
export type ComparisonFailure =
  | "COMPARISON_ARTIFACT_CONTRACT_INVALID"
  | "COMPARISON_IDENTITY_NONDETERMINISTIC"
  | "ELIGIBILITY_VALIDATION_FAILED"
  | "INCOMPLETE_STRATEGY"
  | "REVOKED_STRATEGY"
  | "SUPERSEDED_STRATEGY"
  | "POLICY_CONFLICT"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "UNSUPPORTED_COMPARISON"
  | "DIMENSION_REGISTRY_INCOMPLETE"
  | "SCORING_NONDETERMINISTIC"
  | "THRESHOLD_POLICY_MUTABLE"
  | "THRESHOLD_EVALUATION_FAILED"
  | "TIE_RESOLUTION_NONDETERMINISTIC"
  | "UNRESOLVED_TIE"
  | "COMPLETION_FAILED"
  | "POST_RECOMMENDATION_MUTATION"
  | "SUPERSESSION_LINEAGE_BROKEN"
  | "REPLAY_MISMATCH"
  | "EXPLAINABILITY_INCOMPLETE"
  | "TENANT_ISOLATION_BREACH"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "LEDGER_NOT_APPEND_ONLY"
  | "OBSERVABILITY_MISSING";
export type ComparisonScenario = "BASELINE" | ComparisonFailure;

export type StrategyComparisonInput = Readonly<{ scenario?: ComparisonScenario; tenant_id?: string; recommendation_cycle_ref?: string }>;

export type StrategyComparisonArtifact = Readonly<{
  comparison_id: string;
  comparison_cycle_id: string;
  recommendation_cycle_ref: string;
  comparison_type: ComparisonType;
  participating_strategy_refs: readonly string[];
  comparison_scope: string;
  comparison_policy_manifest_ref: string;
  comparison_dimension_refs: readonly string[];
  threshold_policy_ref: string;
  tie_resolution_policy_ref: string;
  comparison_scores: Readonly<Record<string, number>>;
  weighted_scores: Readonly<Record<string, number>>;
  normalized_scores: Readonly<Record<string, number>>;
  confidence: number;
  uncertainty: number;
  qualification_status: ComparisonQualificationStatus;
  exclusions: readonly string[];
  ranking: readonly string[];
  comparison_outcome: ComparisonOutcome;
  evidence_refs: readonly string[];
  authority_ref: string;
  governance_refs: readonly string[];
  origin_ref: string;
  lifecycle_state: ComparisonLifecycleState;
  supersession_ref: string | null;
  replay_refs: readonly string[];
  advisory_only: boolean;
  tenant_id: string;
  integrity_hash: string;
}>;

export type ComparisonEligibilityReport = Readonly<{ report_id: string; eligible_strategy_refs: readonly string[]; rejected_strategy_refs: readonly string[]; same_recommendation_cycle: boolean; qualified_strategies_only: boolean; policy_compatible: boolean; governance_approved: boolean; constitutional_eligible: boolean; evidence_sufficient: boolean; authority_compatible: boolean; scenario_compatible: boolean; forecast_available: boolean; portfolio_eligible: boolean; deterministic: boolean; integrity_hash: string }>;
export type DimensionEvaluationRecord = Readonly<{ record_id: string; dimensions: readonly string[]; weights: Readonly<Record<string, number>>; raw_scores: Readonly<Record<string, Readonly<Record<string, number>>>>; normalized_scores: Readonly<Record<string, number>>; weighted_scores: Readonly<Record<string, number>>; reproducible: boolean; integrity_hash: string }>;
export type ThresholdEvaluationReport = Readonly<{ report_id: string; threshold_policy_ref: string; immutable: boolean; minimum_confidence_passed: boolean; maximum_uncertainty_passed: boolean; maximum_risk_passed: boolean; minimum_evidence_passed: boolean; governance_passed: boolean; constitutional_passed: boolean; resource_ceiling_passed: boolean; replay_qualification_passed: boolean; deterministic: boolean; integrity_hash: string }>;
export type TieResolutionRecord = Readonly<{ record_id: string; tie_detected: boolean; policy_ref: string; selected_strategy_ref: string; resolved: boolean; deterministic: boolean; rationale: string; integrity_hash: string }>;
export type ComparisonSupersessionRecord = Readonly<{ supersession_id: string; original_comparison_id: string; replacement_comparison_id: string | null; before_recommendation_generation: boolean; post_recommendation_mutation_blocked: boolean; lineage_preserved: boolean; integrity_hash: string }>;
export type ComparisonReplayReport = Readonly<{ report_id: string; identical_inputs: boolean; identical_rankings: boolean; identical_exclusions: boolean; identical_thresholds: boolean; identical_tie_resolution: boolean; identical_outputs: boolean; outcome: "MATCH" | "FAILURE"; integrity_hash: string }>;
export type ComparisonExplainabilityReport = Readonly<{ report_id: string; score_explanations: readonly string[]; threshold_explanations: readonly string[]; tie_explanation: string; exclusion_explanations: readonly string[]; governance_explanation: string; complete: boolean; integrity_hash: string }>;
export type ComparisonLedger = Readonly<{ ledger_id: string; append_only: boolean; immutable: boolean; entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; integrity_hash: string }>[]; integrity_hash: string }>;
export type ComparisonArtifactRegistry = Readonly<{ registry_id: string; tenant_id: string; comparison: StrategyComparisonArtifact; eligibility: ComparisonEligibilityReport; dimensions: DimensionEvaluationRecord; thresholds: ThresholdEvaluationReport; tie_resolution: TieResolutionRecord; supersession: ComparisonSupersessionRecord; replay: ComparisonReplayReport; complete: boolean; integrity_hash: string }>;
export type ComparisonObservabilityReport = Readonly<{ report_id: string; comparison_latency_ms: number; scoring_consistency: number; threshold_failures: number; eligibility_failures: number; tie_frequency: number; supersession_attempts: number; replay_success: number; policy_violations: number; governance_exceptions: number; constitutional_violations: number; observable: boolean; integrity_hash: string }>;

export type ComparisonCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: ComparisonFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ComparisonCertification = Readonly<{ certification_id: string; status: ComparisonCertificationStatus; ready_for_recommendation_engine: boolean; failures: readonly ComparisonFailure[]; tests: readonly ComparisonCertificationTest[]; integrity_hash: string }>;

export type StrategyComparisonResult = Readonly<{
  phase_version: "strategy-comparison-intelligence/v12.7";
  phase_identifier: "StrategyComparisonIntelligence";
  comparison: StrategyComparisonArtifact;
  eligibility: ComparisonEligibilityReport;
  dimensions: DimensionEvaluationRecord;
  thresholds: ThresholdEvaluationReport;
  tie_resolution: TieResolutionRecord;
  supersession: ComparisonSupersessionRecord;
  replay: ComparisonReplayReport;
  explainability: ComparisonExplainabilityReport;
  ledger: ComparisonLedger;
  registry: ComparisonArtifactRegistry;
  observability: ComparisonObservabilityReport;
  certification: ComparisonCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyComparisonValidation = Readonly<{ comparison_id: string | null; valid: boolean; status: ComparisonCertificationStatus; ready_for_recommendation_engine: boolean; failures: readonly ComparisonFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; registry_valid: boolean; ranking_valid: boolean; validation_hash: string }>;
export type StrategyComparisonContractBundle = Readonly<{ doctrine: Readonly<{ version: "strategy-comparison-intelligence/v12.7"; advisory_only: true; immutable_thresholds_required: true; deterministic_tie_resolution_required: true; replay_required: true; explainability_required: true; post_recommendation_mutation_blocked: true; governance_validation_required: true }>; result: StrategyComparisonResult; validation: StrategyComparisonValidation }>;
