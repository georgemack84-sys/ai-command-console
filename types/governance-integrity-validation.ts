export type GovernanceIntegrityValidationState =
  | "REQUESTED"
  | "LOADING_HISTORY"
  | "VALIDATING_HASHES"
  | "VALIDATING_RECORDS"
  | "VALIDATING_HISTORY"
  | "GENERATING_REPORT"
  | "VALIDATED"
  | "HASH_FAILURE"
  | "EVIDENCE_FAILURE"
  | "POLICY_FAILURE"
  | "RECOMMENDATION_FAILURE"
  | "REPLAY_FAILURE"
  | "HISTORY_FAILURE"
  | "CORRUPTION_DETECTED";

export type GovernanceIntegrityValidationResultState = "PASS" | "FAIL";

export type GovernanceIntegrityValidationDomain =
  | "HASH_CHAIN"
  | "EVIDENCE"
  | "RECOMMENDATION"
  | "POLICY"
  | "REPLAY"
  | "HISTORY"
  | "TENANT"
  | "AUTHORITY";

export type GovernanceIntegrityViolation =
  | "NONE"
  | "BROKEN_HASH_CHAIN"
  | "HASH_MISMATCH"
  | "MISSING_HASH"
  | "ORPHANED_RECORD"
  | "MISSING_EVIDENCE"
  | "ALTERED_EVIDENCE"
  | "INVALID_EVIDENCE_REFERENCE"
  | "RECOMMENDATION_MODIFICATION"
  | "CONFIDENCE_ALTERATION"
  | "POLICY_MODIFICATION"
  | "POLICY_DELETION"
  | "REPLAY_ALTERATION"
  | "REPLAY_EVIDENCE_MISSING"
  | "DELETED_HISTORY"
  | "MODIFIED_HISTORY"
  | "REORDERED_HISTORY"
  | "INCOMPLETE_TIMELINE"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTHORITY_BOUNDARY_BYPASS"
  | "HIDDEN_INTEGRITY_STATE";

export type GovernanceIntegrityValidationScenario =
  | "BASELINE"
  | "BROKEN_HASH_CHAIN"
  | "HASH_MISMATCH"
  | "MISSING_HASH"
  | "ORPHANED_RECORD"
  | "MISSING_EVIDENCE"
  | "ALTERED_EVIDENCE"
  | "INVALID_EVIDENCE_REFERENCE"
  | "RECOMMENDATION_MODIFICATION"
  | "CONFIDENCE_ALTERATION"
  | "POLICY_MODIFICATION"
  | "POLICY_DELETION"
  | "REPLAY_ALTERATION"
  | "REPLAY_EVIDENCE_MISSING"
  | "DELETED_HISTORY"
  | "MODIFIED_HISTORY"
  | "REORDERED_HISTORY"
  | "INCOMPLETE_TIMELINE"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTHORITY_BOUNDARY_BYPASS"
  | "HIDDEN_INTEGRITY_STATE";

export type GovernanceIntegrityValidationRun = Readonly<{
  integrity_validation_id: string;
  tenant_id: string;
  mission_id: string;
  validation_timestamp: string;
  validation_scope: readonly GovernanceIntegrityValidationDomain[];
  overall_result: GovernanceIntegrityValidationResultState;
  validated_components: readonly string[];
  integrity_hash: string;
  run_hash: string;
}>;

export type GovernanceIntegrityCheck = Readonly<{
  integrity_check_id: string;
  component: GovernanceIntegrityValidationDomain;
  check_type: "HASH_CONTINUITY" | "EVIDENCE_AUTHENTICITY" | "RECOMMENDATION_IMMUTABILITY" | "POLICY_IMMUTABILITY" | "REPLAY_IMMUTABILITY" | "HISTORY_IMMUTABILITY" | "TENANT_ISOLATION" | "AUTHORITY_PROTECTION";
  expected_hash: string;
  actual_hash: string;
  validation_result: GovernanceIntegrityValidationResultState;
  violation: GovernanceIntegrityViolation;
  difference_location: string | null;
  timestamp: string;
  evidence_refs: readonly string[];
  check_hash: string;
}>;

export type GovernanceIntegrityValidationResult = Readonly<{
  validation_result_id: string;
  overall_result: GovernanceIntegrityValidationResultState;
  hash_chain_result: GovernanceIntegrityValidationResultState;
  evidence_result: GovernanceIntegrityValidationResultState;
  recommendation_result: GovernanceIntegrityValidationResultState;
  policy_result: GovernanceIntegrityValidationResultState;
  replay_result: GovernanceIntegrityValidationResultState;
  history_result: GovernanceIntegrityValidationResultState;
  failure_count: number;
  warning_count: number;
  result_hash: string;
}>;

export type GovernanceIntegrityValidationTimelineEvent = Readonly<{
  event_id: string;
  stage: "LOAD_IMMUTABLE_HISTORY" | "VERIFY_HASH_CHAINS" | "VALIDATE_EVIDENCE" | "VALIDATE_RECORDS" | "VALIDATE_REPLAY" | "VALIDATE_HISTORY" | "STORE_VALIDATION";
  timestamp: string;
  state: GovernanceIntegrityValidationState;
  summary: string;
  event_hash: string;
}>;

export type GovernanceIntegrityValidationLedgerRecord = Readonly<{
  ledger_record_id: string;
  integrity_validation_id: string;
  tenant_id: string;
  mission_id: string;
  check_hashes: readonly string[];
  result_hash: string;
  evidence_hash: string;
  integrity_hash: string;
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type GovernanceIntegrityValidationReport = Readonly<{
  validator_id: string;
  phase_version: "7L.3";
  schema_version: "governance-integrity-validation/v7L.3";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  governance_history_mutation_allowed: false;
  certification_evidence_mutation_allowed: false;
  governance_execution_allowed: false;
  tenant_isolated: boolean;
  authority_protected: boolean;
  validation_run: GovernanceIntegrityValidationRun;
  integrity_checks: readonly GovernanceIntegrityCheck[];
  validation_result: GovernanceIntegrityValidationResult;
  detected_violations: readonly Exclude<GovernanceIntegrityViolation, "NONE">[];
  timeline: readonly GovernanceIntegrityValidationTimelineEvent[];
  evidence_package: Readonly<{
    evidence_package_id: string;
    governance_history_refs: readonly string[];
    certification_refs: readonly string[];
    replay_refs: readonly string[];
    integrity_hashes: readonly string[];
    evidence_hash: string;
  }>;
  truth_ledger_record: GovernanceIntegrityValidationLedgerRecord;
  observability: Readonly<{
    integrity_validation_duration_ms: number;
    hash_verification_rate: number;
    corruption_detection_rate: number;
    modification_detection_rate: number;
    deletion_detection_rate: number;
    replay_alteration_rate: number;
    validation_success_rate: number;
  }>;
  report_hash: string;
}>;

export type GovernanceIntegrityValidationInput = Readonly<{
  scenario?: GovernanceIntegrityValidationScenario;
  tenant_id?: string;
  mission_id?: string;
  validator_id?: string;
}>;

export type GovernanceIntegrityValidationObservabilitySurface = Readonly<{
  integrity_validation_id: string;
  validation_state: GovernanceIntegrityValidationState;
  overall_result: GovernanceIntegrityValidationResultState;
  check_count: number;
  failure_count: number;
  detected_violations: readonly Exclude<GovernanceIntegrityViolation, "NONE">[];
  validation_success_rate: number;
  report_hash: string;
}>;
