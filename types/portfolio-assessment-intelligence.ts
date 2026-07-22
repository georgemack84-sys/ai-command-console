export type PortfolioAssessmentCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PortfolioAssessmentType = "INTEGRATED_STRATEGY_PORTFOLIO" | "ALTERNATIVE_PORTFOLIO" | "RESILIENCE_PORTFOLIO";
export type PortfolioLifecycleState = "REGISTERED" | "VALIDATING" | "DEPENDENCIES_ANALYZED" | "RESOURCE_ANALYZED" | "RISK_AGGREGATED" | "SCENARIOS_EVALUATED" | "PORTFOLIOS_COMPARED" | "ADVISORY_PRODUCED" | "COMPLETE";
export type PortfolioAssessmentFailure =
  | "PORTFOLIO_ARTIFACT_CONTRACT_INVALID"
  | "PORTFOLIO_IDENTITY_NONDETERMINISTIC"
  | "LIFECYCLE_NONREPRODUCIBLE"
  | "MEMBERSHIP_MUTABLE"
  | "STRATEGY_VERSION_MISMATCH"
  | "DUPLICATE_MEMBERSHIP"
  | "MEMBERSHIP_LINEAGE_INCOMPLETE"
  | "DEPENDENCY_ANALYSIS_INCOMPLETE"
  | "CIRCULAR_DEPENDENCY_UNRESOLVED"
  | "RESOURCE_CONFLICT_UNDETECTED"
  | "CAPACITY_VALIDATION_FAILED"
  | "AGGREGATE_RISK_NONREPRODUCIBLE"
  | "SYSTEMIC_RISK_MISSING"
  | "SCENARIO_EVALUATION_INCOMPLETE"
  | "SCENARIO_SENSITIVITY_NONREPRODUCIBLE"
  | "PORTFOLIO_COMPARISON_NONDETERMINISTIC"
  | "THRESHOLD_POLICY_NOT_APPLIED"
  | "TIE_RESOLUTION_FAILED"
  | "ADVISORY_OUTPUT_EXECUTABLE"
  | "ADVISORY_RATIONALE_INCOMPLETE"
  | "EVIDENCE_MISSING"
  | "POLICY_MANIFEST_MISSING"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_VALIDATION_FAILED"
  | "TENANT_ISOLATION_BREACH"
  | "LEDGER_NOT_APPEND_ONLY"
  | "OBSERVABILITY_MISSING";
export type PortfolioAssessmentScenario = "BASELINE" | PortfolioAssessmentFailure;
export type PortfolioAssessmentInput = Readonly<{ scenario?: PortfolioAssessmentScenario; tenant_id?: string; recommendation_cycle_ref?: string }>;

export type PortfolioAssessmentArtifact = Readonly<{
  portfolio_assessment_id: string;
  assessment_type: PortfolioAssessmentType;
  recommendation_cycle_ref: string;
  portfolio_scope: string;
  portfolio_objectives: readonly string[];
  strategy_refs: readonly string[];
  strategy_versions: readonly string[];
  dependency_graph_ref: string;
  resource_requirements: Readonly<Record<string, number>>;
  resource_conflicts: readonly string[];
  scenario_refs: readonly string[];
  aggregate_risk: number;
  portfolio_scores: Readonly<Record<string, number>>;
  optimization_summary: string;
  advisory_recommendation: string;
  confidence: number;
  uncertainty: number;
  evidence_refs: readonly string[];
  policy_manifest_ref: string;
  authority_ref: string;
  origin_ref: string;
  replay_ref: string;
  lifecycle_state: PortfolioLifecycleState;
  advisory_only: boolean;
  tenant_id: string;
  integrity_hash: string;
}>;

export type PortfolioMembershipRecord = Readonly<{ manifest_id: string; strategy_refs: readonly string[]; strategy_versions: readonly string[]; inclusion_rationale: readonly string[]; qualification_preserved: boolean; immutable: boolean; duplicate_strategy_refs: readonly string[]; lineage_complete: boolean; integrity_hash: string }>;
export type DependencyAnalysisReport = Readonly<{ graph_id: string; dependency_edges: readonly Readonly<{ from: string; to: string; type: string; integrity_hash: string }>[]; missing_prerequisites: readonly string[]; circular_dependencies: readonly string[]; sequencing_conflicts: readonly string[]; failure_propagation_map: readonly string[]; critical_path: readonly string[]; reproducible: boolean; integrity_hash: string }>;
export type ResourceConflictReport = Readonly<{ report_id: string; demand_matrix: Readonly<Record<string, number>>; allocation_summary: Readonly<Record<string, number>>; conflicts: readonly string[]; conflict_resolution_candidates: readonly string[]; capacity_validated: boolean; reproducible: boolean; integrity_hash: string }>;
export type PortfolioRiskAssessment = Readonly<{ report_id: string; aggregate_risk_score: number; risk_categories: readonly string[]; correlation_matrix_ref: string; systemic_risk_report: string; mitigations: readonly string[]; reproducible: boolean; integrity_hash: string }>;
export type PortfolioScenarioAssessment = Readonly<{ assessment_id: string; scenario_refs: readonly string[]; robustness_score: number; resilience_score: number; sensitivity_report: readonly string[]; outcome_matrix_ref: string; complete: boolean; reproducible: boolean; integrity_hash: string }>;
export type PortfolioComparisonArtifact = Readonly<{ comparison_id: string; alternative_portfolios: readonly string[]; ranking: readonly string[]; threshold_evaluation: string; tie_resolution: string; deterministic: boolean; integrity_hash: string }>;
export type PortfolioAdvisoryArtifact = Readonly<{ advisory_id: string; recommended_portfolio: string; alternative_portfolios: readonly string[]; tradeoffs: readonly string[]; strengths: readonly string[]; weaknesses: readonly string[]; resource_summary: string; dependency_summary: string; risk_summary: string; confidence_summary: string; uncertainty_summary: string; advisory_narrative: string; non_executable: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type PortfolioReplayReport = Readonly<{ report_id: string; membership_restored: boolean; dependencies_restored: boolean; resources_restored: boolean; scenarios_restored: boolean; comparisons_restored: boolean; rankings_restored: boolean; advisory_outputs_restored: boolean; outcome: "MATCH" | "FAILURE"; integrity_hash: string }>;
export type PortfolioAssessmentLedger = Readonly<{ ledger_id: string; append_only: boolean; immutable: boolean; entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; integrity_hash: string }>[]; integrity_hash: string }>;
export type PortfolioObservabilityReport = Readonly<{ report_id: string; assessment_latency_ms: number; dependency_graph_size: number; conflict_frequency: number; aggregate_risk_trend: number; scenario_coverage: number; comparison_frequency: number; replay_success: number; portfolio_stability: number; observable: boolean; integrity_hash: string }>;
export type PortfolioAssessmentCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: PortfolioAssessmentFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type PortfolioAssessmentCertification = Readonly<{ certification_id: string; status: PortfolioAssessmentCertificationStatus; production_ready: boolean; failures: readonly PortfolioAssessmentFailure[]; tests: readonly PortfolioAssessmentCertificationTest[]; integrity_hash: string }>;

export type PortfolioAssessmentResult = Readonly<{
  phase_version: "portfolio-assessment-intelligence/v12.8";
  phase_identifier: "PortfolioAssessmentIntelligence";
  assessment: PortfolioAssessmentArtifact;
  membership: PortfolioMembershipRecord;
  dependencies: DependencyAnalysisReport;
  resources: ResourceConflictReport;
  risk: PortfolioRiskAssessment;
  scenarios: PortfolioScenarioAssessment;
  comparison: PortfolioComparisonArtifact;
  advisory: PortfolioAdvisoryArtifact;
  replay: PortfolioReplayReport;
  ledger: PortfolioAssessmentLedger;
  observability: PortfolioObservabilityReport;
  certification: PortfolioAssessmentCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PortfolioAssessmentValidation = Readonly<{ assessment_id: string | null; valid: boolean; status: PortfolioAssessmentCertificationStatus; production_ready: boolean; failures: readonly PortfolioAssessmentFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; membership_valid: boolean; advisory_valid: boolean; validation_hash: string }>;
export type PortfolioAssessmentContractBundle = Readonly<{ doctrine: Readonly<{ version: "portfolio-assessment-intelligence/v12.8"; advisory_only: true; immutable_membership_required: true; deterministic_dependency_analysis_required: true; scenario_evaluation_required: true; replay_required: true; governance_validation_required: true }>; result: PortfolioAssessmentResult; validation: PortfolioAssessmentValidation }>;
