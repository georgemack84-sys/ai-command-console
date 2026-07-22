export type RecommendationSynthesisCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RecommendationOutcome = "RECOMMEND" | "RECOMMEND_WITH_CONDITIONS" | "RECOMMEND_WITH_REVIEW" | "NO_RECOMMENDATION" | "INSUFFICIENT_EVIDENCE" | "POLICY_BLOCKED" | "GOVERNANCE_REVIEW_REQUIRED" | "CONSTITUTIONALLY_PROHIBITED";
export type NonRecommendationOutcome = "NO_ELIGIBLE_STRATEGY" | "NO_ELIGIBLE_PORTFOLIO" | "POLICY_BLOCKED" | "GOVERNANCE_PENDING" | "CONSTITUTIONAL_REJECTION" | "EVIDENCE_INSUFFICIENT" | "COMPARISON_INCOMPLETE" | "FORECAST_INCONCLUSIVE" | "SCENARIO_INSUFFICIENT" | "RESOURCE_CONFLICT_UNRESOLVED" | "RISK_UNACCEPTABLE";
export type RecommendationLifecycleState = "DRAFT" | "ELIGIBILITY_VALIDATED" | "SYNTHESIZED" | "EXPLAINED" | "INTEGRITY_VALIDATED" | "PUBLISHED" | "REFERENCED" | "SUPERSEDED" | "ARCHIVED";
export type RecommendationSynthesisFailure =
  | "RECOMMENDATION_CONTRACT_INVALID"
  | "RECOMMENDATION_IDENTITY_NONDETERMINISTIC"
  | "ELIGIBILITY_ENFORCEMENT_FAILED"
  | "INCOMPLETE_COMPARISON_ACCEPTED"
  | "INCOMPLETE_FORECAST_ACCEPTED"
  | "INCOMPLETE_SCENARIO_ACCEPTED"
  | "INCOMPLETE_PORTFOLIO_ACCEPTED"
  | "POLICY_BINDING_INVALID"
  | "EVIDENCE_INSUFFICIENT"
  | "SUPERSEDED_ARTIFACT_ACCEPTED"
  | "REPLAY_READINESS_FAILED"
  | "MULTIPLE_OUTCOMES_PRODUCED"
  | "OUTCOME_NONDETERMINISTIC"
  | "NON_RECOMMENDATION_UNSUPPORTED"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "EXECUTION_AUTHORITY_PRESENT"
  | "OPERATOR_SUPREMACY_VIOLATED"
  | "EXPLAINABILITY_INCOMPLETE"
  | "HIDDEN_RATIONALE"
  | "LINEAGE_VALIDATION_FAILED"
  | "ORIGIN_INVALID"
  | "DUPLICATE_RECOMMENDATION"
  | "INTEGRITY_VALIDATION_FAILED"
  | "REPLAY_MISMATCH"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_ISOLATION_BREACH"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "OBSERVABILITY_MISSING";
export type RecommendationSynthesisScenario = "BASELINE" | RecommendationSynthesisFailure;
export type RecommendationSynthesisInput = Readonly<{ scenario?: RecommendationSynthesisScenario; tenant_id?: string; recommendation_cycle_id?: string }>;

export type RecommendationArtifact = Readonly<{
  recommendation_id: string;
  recommendation_cycle_id: string;
  recommendation_outcome: RecommendationOutcome;
  recommended_strategy_ref: string | null;
  recommended_portfolio_ref: string | null;
  baseline_ref: string;
  comparison_refs: readonly string[];
  scenario_refs: readonly string[];
  forecast_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  policy_set_manifest_ref: string;
  rationale: string;
  expected_benefits: readonly string[];
  expected_risks: readonly string[];
  confidence: number;
  uncertainty: number;
  constraints: readonly string[];
  required_reviews: readonly string[];
  authority_boundary: string;
  origin_ref: string;
  lifecycle_state: RecommendationLifecycleState;
  advisory_only: boolean;
  tenant_id: string;
  integrity_hash: string;
}>;

export type RecommendationEligibilityReport = Readonly<{ report_id: string; completed_cycle: boolean; comparisons_complete: boolean; forecasts_complete: boolean; scenarios_complete: boolean; portfolio_complete: boolean; policy_compliant: boolean; governance_approved: boolean; authority_eligible: boolean; evidence_sufficient: boolean; replay_ready: boolean; eligible: boolean; integrity_hash: string }>;
export type OutcomeResolutionRecord = Readonly<{ resolution_id: string; outcomes: readonly RecommendationOutcome[]; selected_outcome: RecommendationOutcome; deterministic: boolean; recommended_strategy_ref: string | null; recommended_portfolio_ref: string | null; confidence: number; uncertainty: number; constraints: readonly string[]; required_reviews: readonly string[]; integrity_hash: string }>;
export type NonRecommendationArtifact = Readonly<{ artifact_id: string; outcome: NonRecommendationOutcome | null; rationale: string; blocking_conditions: readonly string[]; governing_policies: readonly string[]; corrective_actions: readonly string[]; replay_ref: string; integrity_hash: string }>;
export type AuthorityValidationReport = Readonly<{ report_id: string; advisory_only: boolean; no_execution_authority: boolean; no_resource_allocation: boolean; no_governance_modification: boolean; operator_supremacy_preserved: boolean; constitutional_compliant: boolean; governance_compliant: boolean; integrity_hash: string }>;
export type RecommendationExplainabilityPackage = Readonly<{ package_id: string; executive_summary: string; technical_explanation: string; governance_explanation: string; evidence_summary: string; comparison_summary: string; confidence_report: string; risk_summary: string; hidden_rationale_absent: boolean; complete: boolean; integrity_hash: string }>;
export type RecommendationIntegrityReport = Readonly<{ report_id: string; lineage_valid: boolean; origin_valid: boolean; evidence_refs_valid: boolean; comparison_refs_valid: boolean; scenario_refs_valid: boolean; forecast_refs_valid: boolean; portfolio_refs_valid: boolean; policy_binding_valid: boolean; authority_boundary_valid: boolean; replay_complete: boolean; duplicate_recommendations_detected: readonly string[]; integrity_hash: string }>;
export type RecommendationReplayReport = Readonly<{ report_id: string; selection_reproduced: boolean; rationale_reproduced: boolean; evidence_reproduced: boolean; comparison_reproduced: boolean; policy_application_reproduced: boolean; confidence_reproduced: boolean; uncertainty_reproduced: boolean; outcome_reproduced: boolean; outcome: "MATCH" | "FAILURE"; integrity_hash: string }>;
export type RecommendationRegistry = Readonly<{ registry_id: string; tenant_id: string; recommendation: RecommendationArtifact; non_recommendation: NonRecommendationArtifact | null; complete: boolean; integrity_hash: string }>;
export type RecommendationObservabilityReport = Readonly<{ report_id: string; generation_latency_ms: number; synthesis_duration_ms: number; throughput: number; explainability_completeness: number; replay_success_rate: number; integrity_validation_rate: number; duplicate_attempts: number; advisory_boundary_violations: number; policy_blocking_frequency: number; observable: boolean; integrity_hash: string }>;
export type RecommendationSynthesisCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: RecommendationSynthesisFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type RecommendationSynthesisCertification = Readonly<{ certification_id: string; status: RecommendationSynthesisCertificationStatus; ready_for_publication: boolean; failures: readonly RecommendationSynthesisFailure[]; tests: readonly RecommendationSynthesisCertificationTest[]; integrity_hash: string }>;

export type RecommendationSynthesisResult = Readonly<{
  phase_version: "recommendation-synthesis-intelligence/v12.9";
  phase_identifier: "RecommendationSynthesisIntelligence";
  recommendation: RecommendationArtifact;
  eligibility: RecommendationEligibilityReport;
  outcome_resolution: OutcomeResolutionRecord;
  non_recommendation: NonRecommendationArtifact | null;
  authority_validation: AuthorityValidationReport;
  explainability: RecommendationExplainabilityPackage;
  integrity: RecommendationIntegrityReport;
  replay: RecommendationReplayReport;
  registry: RecommendationRegistry;
  observability: RecommendationObservabilityReport;
  certification: RecommendationSynthesisCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationSynthesisValidation = Readonly<{ recommendation_id: string | null; valid: boolean; status: RecommendationSynthesisCertificationStatus; ready_for_publication: boolean; failures: readonly RecommendationSynthesisFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; exactly_one_outcome_valid: boolean; advisory_valid: boolean; validation_hash: string }>;
export type RecommendationSynthesisContractBundle = Readonly<{ doctrine: Readonly<{ version: "recommendation-synthesis-intelligence/v12.9"; exactly_one_outcome_required: true; advisory_only: true; explainability_required: true; policy_binding_required: true; replay_required: true; duplicate_authoritative_recommendations_blocked: true }>; result: RecommendationSynthesisResult; validation: RecommendationSynthesisValidation }>;
