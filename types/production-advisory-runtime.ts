export type ProductionAdvisoryRuntimeOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RuntimeLifecycleState = "INITIALIZED" | "QUALIFIED" | "READY" | "PROCESSING" | "RECOMMENDATION_PUBLISHED" | "REPLAYABLE" | "BLOCKED" | "QUALIFICATION_FAILED" | "POLICY_VIOLATION" | "FAIL_CLOSED";
export type RecommendationState = "GENERATED" | "VALIDATED" | "EXPLAINED" | "PUBLISHED" | "REPLAYABLE";
export type RecommendationOutcome = "RECOMMENDATION_PUBLISHED" | "INSUFFICIENT_EVIDENCE" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW" | "POLICY_BLOCKED" | "QUALIFICATION_FAILED" | "FAIL_CLOSED";
export type RecommendationReplayOutcome = "PASS" | "FAIL" | "UNEXPLAINED_DIVERGENCE";
export type ProductionAdvisoryRuntimeFailure = "ADVISORY_BOUNDARY_NOT_ENFORCED" | "RUNTIME_NON_DETERMINISTIC" | "OPERATOR_AUTHORITY_NOT_PRESERVED" | "RECOMMENDATION_MUTABLE" | "REPLAY_NOT_REPRODUCIBLE" | "RECOMMENDATION_LINEAGE_INCOMPLETE" | "DECISION_CONTEXT_NOT_REPRODUCIBLE" | "EVIDENCE_LINKAGE_INCOMPLETE" | "EXECUTION_AUTHORITY_POSSIBLE" | "TENANT_ISOLATION_NOT_MAINTAINED" | "RUNTIME_QUALIFICATION_INVALID" | "POLICY_ENFORCEMENT_NON_DETERMINISTIC" | "QUALIFIED_INPUTS_NOT_ENFORCED" | "IMMUTABLE_EVIDENCE_NOT_PRESERVED" | "PHASE_16_2_ENROLLMENT_NOT_VALID" | "NON_CONSTITUTIONAL_RUNTIME_WARNING";
export type ProductionAdvisoryRuntimeScenario = "BASELINE" | ProductionAdvisoryRuntimeFailure;

export type ProductionAdvisoryRuntimeInput = Readonly<{ scenario?: ProductionAdvisoryRuntimeScenario; mission_id?: string; tenant_id?: string; operator_id?: string; production_input_id?: string }>;

export type RuntimeQualificationRecord = Readonly<{
  qualification_id: string;
  runtime_version: "production-advisory-runtime/v16.3";
  policy_versions: readonly string[];
  qualified_environment: boolean;
  dependency_compatibility: boolean;
  evidence_available: boolean;
  tenant_qualified: boolean;
  scope_authorized: boolean;
  advisory_boundary_enforced: boolean;
  qualified_inputs_only: boolean;
  valid: boolean;
  integrity_hash: string;
}>;

export type RuntimePolicyRecord = Readonly<{
  policy_engine_id: string;
  policy_refs: readonly string[];
  deterministic: boolean;
  advisory_only: boolean;
  execution_authority_blocked: boolean;
  operator_authority_external: boolean;
  tenant_isolation_enforced: boolean;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type RecommendationPipelineRecord = Readonly<{
  pipeline_id: string;
  stages: readonly string[];
  recommendation_states: readonly RecommendationState[];
  deterministic: boolean;
  evidence_resolved: boolean;
  confidence_assessed: boolean;
  explanation_generated: boolean;
  immutable_publication: boolean;
  integrity_hash: string;
}>;

export type DecisionContextRecord = Readonly<{
  context_id: string;
  supporting_evidence: readonly string[];
  governing_policies: readonly string[];
  mission_objectives: readonly string[];
  dependency_refs: readonly string[];
  historical_comparisons: readonly string[];
  confidence_factors: readonly string[];
  uncertainty_analysis: readonly string[];
  replay_refs: readonly string[];
  complete: boolean;
  lineage_preserved: boolean;
  replay_deterministic: boolean;
  integrity_hash: string;
}>;

export type OperatorInteractionRecord = Readonly<{
  interaction_id: string;
  supported_actions: readonly string[];
  operator_id: string;
  acknowledgment_required: boolean;
  feedback_capture_enabled: boolean;
  authority_separated: boolean;
  production_execution_permitted: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type AdvisoryRecommendationRecord = Readonly<{
  recommendation_id: string;
  mission_id: string;
  tenant_id: string;
  runtime_version: "production-advisory-runtime/v16.3";
  recommendation_summary: string;
  recommendation_details: readonly string[];
  supporting_evidence: readonly string[];
  decision_context_ref: string;
  confidence_assessment: Readonly<{ score: number; factors: readonly string[] }>;
  risk_assessment: Readonly<{ level: "LOW" | "MODERATE" | "HIGH"; factors: readonly string[] }>;
  explanation_ref: string;
  policy_refs: readonly string[];
  operator_visibility_rules: readonly string[];
  replay_refs: readonly string[];
  state: RecommendationState;
  outcome: RecommendationOutcome;
  immutable: boolean;
  created_at: string;
  integrity_hash: string;
}>;

export type RecommendationLineageRecord = Readonly<{
  lineage_id: string;
  production_inputs: readonly string[];
  evidence_refs: readonly string[];
  analysis_refs: readonly string[];
  recommendation_refs: readonly string[];
  operator_review_refs: readonly string[];
  archive_refs: readonly string[];
  tenant_id: string;
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type RecommendationReplayRecord = Readonly<{
  replay_id: string;
  production_inputs_validated: boolean;
  policy_versions_validated: boolean;
  recommendation_ordering_validated: boolean;
  evidence_resolution_validated: boolean;
  confidence_calculations_validated: boolean;
  explanations_validated: boolean;
  advisory_outputs_validated: boolean;
  outcome: RecommendationReplayOutcome;
  integrity_hash: string;
}>;

export type AdvisoryEvidenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "INPUT_RECEIVED" | "RUNTIME_QUALIFIED" | "POLICY_VALIDATED" | "CONTEXT_BUILT" | "RECOMMENDATION_GENERATED" | "EXPLANATION_GENERATED" | "OPERATOR_PRESENTED" | "OUTPUT_PUBLISHED" | "REPLAY_VALIDATED" | "LINEAGE_ARCHIVED";
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  tenant_id: string;
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type RuntimeObservabilityRecord = Readonly<{
  runtime_health: "HEALTHY" | "DEGRADED" | "BLOCKED";
  recommendation_throughput: number;
  recommendation_latency_ms: number;
  replay_success: boolean;
  confidence_distribution: readonly number[];
  policy_validation: boolean;
  advisory_boundary_violations: number;
  operator_interaction_latency_ms: number;
  tenant_isolation: boolean;
  runtime_qualification: boolean;
  integrity_hash: string;
}>;

export type ProductionAdvisoryRuntimeCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionAdvisoryRuntimeOutcome;
  passed: boolean;
  failure_reason: ProductionAdvisoryRuntimeFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionAdvisoryRuntimeResult = Readonly<{
  phase_version: "production-advisory-runtime/v16.3";
  phase_identifier: "ProductionAdvisoryRuntime";
  pilot_scope_enrollment_ref: string;
  lifecycle: readonly RuntimeLifecycleState[];
  qualification: RuntimeQualificationRecord;
  policy: RuntimePolicyRecord;
  pipeline: RecommendationPipelineRecord;
  decision_context: DecisionContextRecord;
  operator_interaction: OperatorInteractionRecord;
  recommendation: AdvisoryRecommendationRecord;
  lineage: RecommendationLineageRecord;
  replay: RecommendationReplayRecord;
  ledger: readonly AdvisoryEvidenceLedgerEntry[];
  observability: RuntimeObservabilityRecord;
  certification_tests: readonly ProductionAdvisoryRuntimeCertificationTest[];
  failures: readonly ProductionAdvisoryRuntimeFailure[];
  outcome: ProductionAdvisoryRuntimeOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionAdvisoryRuntimeValidation = Readonly<{
  valid: boolean;
  outcome: ProductionAdvisoryRuntimeOutcome;
  qualification_valid: boolean;
  policy_valid: boolean;
  pipeline_valid: boolean;
  context_valid: boolean;
  operator_valid: boolean;
  recommendation_valid: boolean;
  lineage_valid: boolean;
  replay_valid: boolean;
  ledger_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly ProductionAdvisoryRuntimeFailure[];
  integrity_hash: string;
}>;

export type ProductionAdvisoryRuntimeBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-advisory-runtime/v16.3";
    upstream_phase: "pilot-scope-enrollment/v16.2";
    lifecycle: readonly RuntimeLifecycleState[];
    recommendation_states: readonly RecommendationState[];
    recommendation_outcomes: readonly RecommendationOutcome[];
    replay_outcomes: readonly RecommendationReplayOutcome[];
    certification_outcomes: readonly ProductionAdvisoryRuntimeOutcome[];
  }>;
  result: ProductionAdvisoryRuntimeResult;
  validation: ProductionAdvisoryRuntimeValidation;
}>;
