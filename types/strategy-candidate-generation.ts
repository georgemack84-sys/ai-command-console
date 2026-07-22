export type StrategyCandidateCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type StrategyType = "BASELINE" | "ALTERNATIVE" | "CONSERVATIVE" | "AGGRESSIVE" | "RISK_MITIGATION" | "COST_OPTIMIZATION" | "RESOURCE_OPTIMIZATION" | "PORTFOLIO" | "RECOVERY" | "CONTINGENCY";
export type CandidateQualificationStatus = "QUALIFIED" | "PROVISIONALLY_QUALIFIED" | "REQUIRES_EVIDENCE" | "REQUIRES_REVIEW" | "REJECTED";
export type DuplicateOutcome = "UNIQUE" | "EXACT_DUPLICATE" | "SEMANTIC_DUPLICATE" | "STRUCTURAL_DUPLICATE" | "EQUIVALENT" | "CONFLICTING";
export type CandidateSetClosureState = "OPEN" | "GENERATING" | "VALIDATING" | "CONSOLIDATING" | "QUALIFYING" | "READY_FOR_EVALUATION" | "CLOSED" | "FAILED";
export type StrategyLifecycleState = "GENERATED" | "ELIGIBLE" | "CONSOLIDATED" | "QUALIFIED" | "REGISTERED" | "REJECTED";
export type StrategyCandidateFailure =
  | "STRATEGY_ARTIFACT_CONTRACT_INVALID"
  | "STRATEGY_IDENTITY_NONDETERMINISTIC"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "GENERATION_POLICY_INCOMPLETE"
  | "UNAUTHORIZED_GENERATION_ALLOWED"
  | "RECOMMENDATION_CYCLE_INACTIVE"
  | "POLICY_MANIFEST_MISSING"
  | "EVIDENCE_MISSING"
  | "AUTHORITY_INVALID"
  | "GOVERNANCE_INCOMPLETE"
  | "CONSTITUTIONAL_VIOLATION"
  | "CROSS_TENANT_GENERATION"
  | "UNSUPPORTED_OBJECTIVE"
  | "PROHIBITED_STRATEGY_CLASS"
  | "ELIGIBILITY_VALIDATION_FAILED"
  | "INVALID_DEPENDENCIES"
  | "UNSUPPORTED_ASSUMPTIONS"
  | "DUPLICATE_DETECTION_NONDETERMINISTIC"
  | "DUPLICATE_REGISTRATION_ALLOWED"
  | "CONFLICTING_CANDIDATES_ALLOWED"
  | "CONSOLIDATION_LOST_LINEAGE"
  | "CONSOLIDATION_REPLAY_CHANGED"
  | "QUALIFICATION_MISSING"
  | "EVIDENCE_SUFFICIENCY_FAILED"
  | "CONFIDENCE_CALCULATION_NONDETERMINISTIC"
  | "CANDIDATE_SET_CLOSURE_FAILED"
  | "CLOSURE_REPLAY_FAILED"
  | "REGISTRY_INTEGRITY_FAILED"
  | "LEDGER_NOT_APPEND_ONLY"
  | "LINEAGE_MISSING"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "TENANT_ISOLATION_BREACH"
  | "OBSERVABILITY_MISSING";
export type StrategyCandidateScenario = "BASELINE" | StrategyCandidateFailure;

export type StrategyCandidateInput = Readonly<{
  scenario?: StrategyCandidateScenario;
  tenant_id?: string;
  mission_scope?: string;
  operational_scope?: string;
  recommendation_cycle_ref?: string;
}>;

export type StrategyArtifact = Readonly<{
  strategy_id: string;
  recommendation_cycle_ref: string;
  strategy_type: StrategyType;
  strategy_name: string;
  strategy_summary: string;
  objective_refs: readonly string[];
  mission_scope: string;
  operational_scope: string;
  assumptions: readonly string[];
  constraints: readonly string[];
  required_resources: readonly string[];
  dependency_refs: readonly string[];
  expected_benefits: readonly string[];
  expected_risks: readonly string[];
  expected_tradeoffs: readonly string[];
  evidence_refs: readonly string[];
  confidence: number;
  uncertainty: number;
  qualification_status: CandidateQualificationStatus;
  origin_ref: string;
  policy_manifest_ref: string;
  authority_ref: string;
  governance_refs: readonly string[];
  lifecycle_state: StrategyLifecycleState;
  created_timestamp: string;
  advisory_only: boolean;
  tenant_id: string;
  integrity_hash: string;
}>;

export type CandidateGenerationPolicy = Readonly<{
  policy_id: string;
  recommendation_cycle_active: boolean;
  policy_manifest_bound: boolean;
  evidence_required: boolean;
  authority_required: boolean;
  governance_required: boolean;
  constitutional_compliance_required: boolean;
  supported_strategy_types: readonly StrategyType[];
  prohibited_strategy_classes: readonly string[];
  unauthorized_generation_blocked: boolean;
  integrity_hash: string;
}>;

export type CandidateEligibilityReport = Readonly<{
  report_id: string;
  eligible_strategy_ids: readonly string[];
  rejected_strategy_ids: readonly string[];
  rejection_reasons: readonly string[];
  scope_valid: boolean;
  objectives_valid: boolean;
  policy_valid: boolean;
  evidence_valid: boolean;
  authority_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  dependencies_valid: boolean;
  assumptions_valid: boolean;
  resources_feasible: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DuplicateDetectionReport = Readonly<{
  report_id: string;
  outcomes: readonly Readonly<{ strategy_id: string; outcome: DuplicateOutcome; related_strategy_id: string | null; integrity_hash: string }>[];
  duplicates_rejected: boolean;
  conflicts_rejected: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CandidateConsolidationReport = Readonly<{
  report_id: string;
  canonical_strategy_ids: readonly string[];
  merged_lineage_refs: readonly string[];
  equivalence_mappings: readonly Readonly<{ from_strategy_id: string; to_strategy_id: string; reason: DuplicateOutcome; integrity_hash: string }>[];
  provenance_preserved: boolean;
  replay_unchanged: boolean;
  integrity_hash: string;
}>;

export type CandidateQualificationRecord = Readonly<{
  qualification_id: string;
  strategy_id: string;
  status: CandidateQualificationStatus;
  confidence_score: number;
  uncertainty_score: number;
  evidence_completeness: number;
  governance_readiness: number;
  operational_feasibility: number;
  replay_ready: boolean;
  qualification_rationale: string;
  integrity_hash: string;
}>;

export type StrategyArtifactRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  strategies: readonly StrategyArtifact[];
  registered_strategy_ids: readonly string[];
  complete: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type CandidateSetClosureRecord = Readonly<{
  closure_id: string;
  state: CandidateSetClosureState;
  required_strategies_generated: boolean;
  required_policies_satisfied: boolean;
  evidence_complete: boolean;
  qualification_complete: boolean;
  duplicates_resolved: boolean;
  consolidation_complete: boolean;
  lineage_complete: boolean;
  governance_validation_complete: boolean;
  replay_validation_successful: boolean;
  immutable: boolean;
  versioned: boolean;
  ledgered: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type CandidateGenerationLedger = Readonly<{
  ledger_id: string;
  append_only: boolean;
  immutable: boolean;
  tenant_isolated: boolean;
  replay_reproducible: boolean;
  cryptographically_verifiable: boolean;
  entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; integrity_hash: string }>[];
  integrity_hash: string;
}>;

export type CandidateReplayReport = Readonly<{
  replay_id: string;
  identical_candidates_generated: boolean;
  identical_qualifications_assigned: boolean;
  identical_duplicate_outcomes: boolean;
  identical_consolidation_results: boolean;
  identical_closure_state: boolean;
  identical_ledger_records: boolean;
  identical_integrity_hashes: boolean;
  integrity_hash: string;
}>;

export type CandidateObservabilityReport = Readonly<{
  report_id: string;
  candidates_generated: number;
  generation_latency_ms: number;
  eligibility_failures: number;
  duplicate_rate: number;
  consolidation_rate: number;
  qualification_rate: number;
  evidence_completeness: number;
  closure_latency_ms: number;
  replay_success: number;
  policy_violations: number;
  governance_failures: number;
  alerts: readonly string[];
  observable: boolean;
  integrity_hash: string;
}>;

export type StrategyCandidateCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: StrategyCandidateFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type StrategyCandidateCertification = Readonly<{
  certification_id: string;
  status: StrategyCandidateCertificationStatus;
  ready_for_downstream_evaluation: boolean;
  failures: readonly StrategyCandidateFailure[];
  tests: readonly StrategyCandidateCertificationTest[];
  integrity_hash: string;
}>;

export type StrategyCandidateGenerationResult = Readonly<{
  phase_version: "strategy-candidate-generation/v12.4";
  phase_identifier: "StrategyCandidateGeneration";
  generation_policy: CandidateGenerationPolicy;
  candidates: readonly StrategyArtifact[];
  eligibility: CandidateEligibilityReport;
  duplicate_detection: DuplicateDetectionReport;
  consolidation: CandidateConsolidationReport;
  qualifications: readonly CandidateQualificationRecord[];
  registry: StrategyArtifactRegistry;
  closure: CandidateSetClosureRecord;
  ledger: CandidateGenerationLedger;
  replay: CandidateReplayReport;
  observability: CandidateObservabilityReport;
  certification: StrategyCandidateCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyCandidateValidation = Readonly<{
  registry_id: string | null;
  valid: boolean;
  status: StrategyCandidateCertificationStatus;
  ready_for_downstream_evaluation: boolean;
  failures: readonly StrategyCandidateFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  closure_valid: boolean;
  registry_valid: boolean;
  validation_hash: string;
}>;

export type StrategyCandidateContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "strategy-candidate-generation/v12.4";
    advisory_only: true;
    policy_bound_generation_required: true;
    evidence_linked_generation_required: true;
    duplicate_suppression_required: true;
    qualification_before_evaluation_required: true;
    closed_sets_are_immutable: true;
    replay_required: true;
  }>;
  result: StrategyCandidateGenerationResult;
  validation: StrategyCandidateValidation;
}>;
