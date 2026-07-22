export type RecommendationCycleCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RecommendationCycleState = "REGISTERED" | "POLICY_BOUND" | "AUTHORIZED" | "GENERATING" | "GENERATED" | "EVALUATING" | "VALIDATING" | "COMPLETING" | "COMPLETE" | "FAILED" | "CANCELLED" | "SUPERSEDED" | "ARCHIVED";
export type RecommendationCycleTerminalOutcome = "COMPLETE" | "FAILED" | "CANCELLED" | "SUPERSEDED";
export type RecommendationCycleTransactionStatus = "OPEN" | "LOCKED" | "COMMITTED" | "ROLLED_BACK" | "FAILED_CLOSED";
export type RecommendationCycleType = "STRATEGIC_RECOMMENDATION" | "REEVALUATION" | "SUPERSESSION";
export type RecommendationCycleFailure =
  | "CYCLE_CONTRACT_INVALID"
  | "CYCLE_IDENTITY_NONDETERMINISTIC"
  | "LIFECYCLE_NOT_APPROVED"
  | "SCHEMA_MUTABLE"
  | "TRANSACTION_MODEL_NONDETERMINISTIC"
  | "ROLLBACK_NOT_REPRODUCIBLE"
  | "CONCURRENCY_UNPROTECTED"
  | "IDEMPOTENCY_BROKEN"
  | "POLICY_BINDING_MISSING"
  | "POLICY_VALIDATION_FAILED"
  | "AUTHORITY_NOT_RESOLVED"
  | "GOVERNANCE_NOT_APPROVED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "GENERATION_ORDER_NONDETERMINISTIC"
  | "GENERATION_DEPENDENCY_BROKEN"
  | "DUPLICATE_ARTIFACT_REGISTERED"
  | "LINEAGE_RECORDING_MISSING"
  | "EVALUATION_NONDETERMINISTIC"
  | "EVIDENCE_INSUFFICIENT"
  | "THRESHOLD_VALIDATION_FAILED"
  | "COMPARISON_INCOMPLETE"
  | "TIE_RESOLUTION_NONDETERMINISTIC"
  | "COMPLETION_VALIDATION_FAILED"
  | "MULTIPLE_TERMINAL_OUTCOMES"
  | "PARTIAL_CYCLE_MARKED_COMPLETE"
  | "LEDGER_COMMIT_FAILED"
  | "REPLAY_VALIDATION_FAILED"
  | "INTEGRITY_VALIDATION_FAILED"
  | "RECOVERY_NONDETERMINISTIC"
  | "RECOVERY_FABRICATED_ARTIFACT"
  | "RECOVERY_BYPASSED_GOVERNANCE"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "POST_COMPLETION_MUTATION"
  | "REEVALUATION_REUSED_CYCLE"
  | "SUPERSESSION_LINEAGE_BROKEN"
  | "ARCHIVE_INCOMPLETE"
  | "ARCHIVE_REPLAY_NOT_PRESERVED"
  | "LEDGER_NOT_APPEND_ONLY"
  | "REFERENTIAL_INTEGRITY_FAILED"
  | "TENANT_ISOLATION_BREACH"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "OBSERVABILITY_MISSING";
export type RecommendationCycleScenario = "BASELINE" | RecommendationCycleFailure;

export type RecommendationCycleInput = Readonly<{
  scenario?: RecommendationCycleScenario;
  tenant_id?: string;
  mission_id?: string;
  cycle_type?: RecommendationCycleType;
  strategic_objective?: string;
  recommendation_scope?: string;
  reevaluation_requested?: boolean;
}>;

export type RecommendationCycleArtifact = Readonly<{
  cycle_id: string;
  cycle_version: "12.3.0";
  tenant_id: string;
  mission_id: string;
  cycle_type: RecommendationCycleType;
  strategic_objective: string;
  recommendation_scope: string;
  authority_context: Readonly<{ authority_id: string; owner: string; advisory_only: boolean; resolved: boolean; integrity_hash: string }>;
  bound_policy_manifest: Readonly<{ manifest_id: string; binding_id: string; manifest_integrity_hash: string; validation_passed: boolean; integrity_hash: string }>;
  input_artifact_refs: readonly string[];
  generated_artifact_refs: readonly string[];
  evaluation_artifact_refs: readonly string[];
  output_refs: readonly string[];
  lifecycle_state: RecommendationCycleState;
  transaction_status: RecommendationCycleTransactionStatus;
  creation_timestamp: string;
  completion_timestamp: string | null;
  recovery_metadata: Readonly<{ recovery_required: boolean; recovery_attempts: number; fail_closed: boolean; integrity_hash: string }>;
  replay_metadata: Readonly<{ replay_required: boolean; replay_validated: boolean; replay_hash: string; integrity_hash: string }>;
  immutable: boolean;
  integrity_hash: string;
}>;

export type CycleLifecycleRecord = Readonly<{
  lifecycle_id: string;
  transitions: readonly Readonly<{ from: RecommendationCycleState; to: RecommendationCycleState; allowed: boolean; authority_validated: boolean; policy_integrity_validated: boolean; integrity_hash: string }>[];
  terminal_outcomes: readonly RecommendationCycleTerminalOutcome[];
  exactly_one_terminal_outcome: boolean;
  approved: boolean;
  integrity_hash: string;
}>;

export type CycleTransactionRecord = Readonly<{
  transaction_id: string;
  cycle_id: string;
  atomic_creation: boolean;
  deterministic_commit: boolean;
  rollback_reproducible: boolean;
  transaction_locked: boolean;
  concurrency_protected: boolean;
  idempotency_key: string;
  idempotent_operations: boolean;
  status: RecommendationCycleTransactionStatus;
  integrity_hash: string;
}>;

export type PolicyBoundEntryRecord = Readonly<{
  entry_id: string;
  manifest_exists: boolean;
  manifest_validated: boolean;
  authority_resolved: boolean;
  governance_approved: boolean;
  constitutional_validated: boolean;
  immutable_policy_snapshot: boolean;
  execution_allowed: boolean;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type GenerationCoordinationRecord = Readonly<{
  coordination_id: string;
  execution_order: readonly string[];
  dependencies: readonly Readonly<{ artifact: string; depends_on: readonly string[] }>[];
  artifact_registration_complete: boolean;
  duplicates_prevented: boolean;
  lineage_recorded: boolean;
  transaction_consistent: boolean;
  deterministic: boolean;
  generated_artifact_refs: readonly string[];
  integrity_hash: string;
}>;

export type EvaluationCoordinationRecord = Readonly<{
  coordination_id: string;
  evaluation_order: readonly string[];
  evidence_sufficient: boolean;
  duplicate_suppression_complete: boolean;
  comparison_complete: boolean;
  thresholds_enforced: boolean;
  confidence_evaluated: boolean;
  portfolio_evaluated: boolean;
  tie_resolution_deterministic: boolean;
  governance_validated: boolean;
  deterministic_outcome: string;
  evaluation_artifact_refs: readonly string[];
  integrity_hash: string;
}>;

export type CompletionValidationRecord = Readonly<{
  validation_id: string;
  mandatory_artifacts_exist: boolean;
  evaluations_complete: boolean;
  policy_validation_passed: boolean;
  authority_validation_passed: boolean;
  governance_complete: boolean;
  comparison_complete: boolean;
  duplicate_resolution_complete: boolean;
  recommendation_selected: boolean;
  outputs_registered: boolean;
  ledger_committed: boolean;
  replay_validated: boolean;
  integrity_validated: boolean;
  referential_integrity_valid: boolean;
  lifecycle_consistent: boolean;
  transaction_integrity_valid: boolean;
  complete: boolean;
  terminal_outcome: RecommendationCycleTerminalOutcome;
  integrity_hash: string;
}>;

export type RecoveryRecord = Readonly<{
  recovery_id: string;
  failure_type: string;
  transaction_state_recovered: boolean;
  generated_artifacts_recovered: boolean;
  lifecycle_recovered: boolean;
  ledger_state_recovered: boolean;
  policy_binding_recovered: boolean;
  authority_context_recovered: boolean;
  fabricated_artifacts: boolean;
  governance_bypassed: boolean;
  validation_skipped: boolean;
  fail_closed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type SupersessionRecord = Readonly<{
  supersession_id: string;
  original_cycle_id: string;
  replacement_cycle_id: string;
  supersession_required_for_reevaluation: boolean;
  completed_cycle_immutable: boolean;
  append_only: boolean;
  reopened_original: boolean;
  lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type CycleArchiveRecord = Readonly<{
  archive_id: string;
  cycle_id: string;
  archived_components: readonly string[];
  immutable: boolean;
  replay_preserved: boolean;
  evidence_preserved: boolean;
  signatures_preserved: boolean;
  integrity_hashes_preserved: boolean;
  reconstructable: boolean;
  integrity_hash: string;
}>;

export type CycleLedger = Readonly<{
  ledger_id: string;
  append_only: boolean;
  committed: boolean;
  entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; state: RecommendationCycleState; integrity_hash: string }>[];
  integrity_hash: string;
}>;

export type CycleReplayRecord = Readonly<{
  replay_id: string;
  cycle_reconstructed: boolean;
  policy_binding_restored: boolean;
  authority_context_restored: boolean;
  lifecycle_restored: boolean;
  artifacts_restored: boolean;
  ledger_restored: boolean;
  byte_identical: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CycleObservabilityReport = Readonly<{
  report_id: string;
  active_cycles: number;
  lifecycle_transitions: number;
  transaction_duration_ms: number;
  policy_binding_failures: number;
  authority_failures: number;
  recovery_attempts: number;
  replay_validation_failures: number;
  archival_completion: number;
  supersession_frequency: number;
  integrity_violations: number;
  ledger_health: "HEALTHY" | "DEGRADED";
  observable: boolean;
  integrity_hash: string;
}>;

export type RecommendationCycleCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: RecommendationCycleFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationCycleCertification = Readonly<{
  certification_id: string;
  status: RecommendationCycleCertificationStatus;
  canonical_transaction_boundary_certified: boolean;
  failures: readonly RecommendationCycleFailure[];
  tests: readonly RecommendationCycleCertificationTest[];
  integrity_hash: string;
}>;

export type RecommendationCycleResult = Readonly<{
  phase_version: "recommendation-cycle-management/v12.3";
  phase_identifier: "RecommendationCycleManagement";
  cycle: RecommendationCycleArtifact;
  lifecycle: CycleLifecycleRecord;
  transaction: CycleTransactionRecord;
  policy_bound_entry: PolicyBoundEntryRecord;
  generation: GenerationCoordinationRecord;
  evaluation: EvaluationCoordinationRecord;
  completion: CompletionValidationRecord;
  recovery: RecoveryRecord;
  supersession: SupersessionRecord;
  archive: CycleArchiveRecord;
  ledger: CycleLedger;
  replay: CycleReplayRecord;
  observability: CycleObservabilityReport;
  certification: RecommendationCycleCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationCycleValidation = Readonly<{
  cycle_id: string | null;
  valid: boolean;
  status: RecommendationCycleCertificationStatus;
  canonical_transaction_boundary_certified: boolean;
  failures: readonly RecommendationCycleFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  terminal_outcome_valid: boolean;
  immutable_after_completion: boolean;
  validation_hash: string;
}>;

export type RecommendationCycleContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "recommendation-cycle-management/v12.3";
    recommendation_cycle_first_class_artifact: true;
    atomic_transaction_boundary: true;
    immutable_policy_binding_required: true;
    exactly_one_terminal_outcome_required: true;
    completed_cycles_never_reopened: true;
    reevaluation_requires_new_cycle: true;
    replay_required: true;
    archival_required: true;
  }>;
  result: RecommendationCycleResult;
  validation: RecommendationCycleValidation;
}>;
