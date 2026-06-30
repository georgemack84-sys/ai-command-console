export type GovernanceIsolationValidationState =
  | "REQUESTED"
  | "LOADING_CONTEXT"
  | "VALIDATING_BOUNDARIES"
  | "VERIFYING_ISOLATION"
  | "VALIDATING_VISIBILITY"
  | "GENERATING_REPORT"
  | "VALIDATED"
  | "TENANT_BOUNDARY_FAILURE"
  | "GOVERNANCE_ISOLATION_FAILURE"
  | "REPLAY_ISOLATION_FAILURE"
  | "RECOMMENDATION_ISOLATION_FAILURE"
  | "EVIDENCE_ISOLATION_FAILURE"
  | "VISIBILITY_FAILURE"
  | "CROSS_TENANT_ACCESS_DETECTED";

export type GovernanceIsolationValidationResultState = "PASS" | "FAIL";

export type GovernanceIsolationDomain =
  | "TENANT_BOUNDARY"
  | "GOVERNANCE_SEPARATION"
  | "REPLAY_ISOLATION"
  | "RECOMMENDATION_ISOLATION"
  | "EVIDENCE_ISOLATION"
  | "VISIBILITY_CONTROL";

export type GovernanceIsolationViolation =
  | "NONE"
  | "TENANT_MISMATCH"
  | "CROSS_TENANT_RECORD_REFERENCE"
  | "UNAUTHORIZED_TENANT_ACCESS"
  | "SHARED_GOVERNANCE_STATE"
  | "POLICY_CONTAMINATION"
  | "GOVERNANCE_STATE_LEAKAGE"
  | "REPLAY_DATA_LEAKAGE"
  | "CROSS_TENANT_REPLAY_RECONSTRUCTION"
  | "SHARED_REPLAY_HISTORY"
  | "SHARED_RECOMMENDATIONS"
  | "RECOMMENDATION_VISIBILITY_LEAK"
  | "RECOMMENDATION_OWNERSHIP_MISMATCH"
  | "SHARED_EVIDENCE"
  | "UNAUTHORIZED_EVIDENCE_REFERENCE"
  | "EVIDENCE_LEAKAGE"
  | "UNAUTHORIZED_DASHBOARD_VISIBILITY"
  | "UNAUTHORIZED_SEARCH_RESULT"
  | "UNAUTHORIZED_LINEAGE_VIEW"
  | "UNAUTHORIZED_RECOMMENDATION_VISIBILITY"
  | "UNAUTHORIZED_EVIDENCE_INSPECTION";

export type GovernanceIsolationScenario =
  | "BASELINE"
  | "TENANT_MISMATCH"
  | "CROSS_TENANT_RECORD_REFERENCE"
  | "UNAUTHORIZED_TENANT_ACCESS"
  | "SHARED_GOVERNANCE_STATE"
  | "POLICY_CONTAMINATION"
  | "GOVERNANCE_STATE_LEAKAGE"
  | "REPLAY_DATA_LEAKAGE"
  | "CROSS_TENANT_REPLAY_RECONSTRUCTION"
  | "SHARED_REPLAY_HISTORY"
  | "SHARED_RECOMMENDATIONS"
  | "RECOMMENDATION_VISIBILITY_LEAK"
  | "RECOMMENDATION_OWNERSHIP_MISMATCH"
  | "SHARED_EVIDENCE"
  | "UNAUTHORIZED_EVIDENCE_REFERENCE"
  | "EVIDENCE_LEAKAGE"
  | "UNAUTHORIZED_DASHBOARD_VISIBILITY"
  | "UNAUTHORIZED_SEARCH_RESULT"
  | "UNAUTHORIZED_LINEAGE_VIEW"
  | "UNAUTHORIZED_RECOMMENDATION_VISIBILITY"
  | "UNAUTHORIZED_EVIDENCE_INSPECTION";

export type GovernanceIsolationValidationRun = Readonly<{
  isolation_validation_id: string;
  tenant_id: string;
  mission_id: string;
  validation_timestamp: string;
  validation_scope: readonly GovernanceIsolationDomain[];
  overall_result: GovernanceIsolationValidationResultState;
  tenant_context: Readonly<{
    tenant_id: string;
    mission_id: string;
    isolated_runtime: true;
    isolated_governance_state: true;
    isolated_replay_state: true;
    isolated_evidence_cache: true;
    tenant_context_hash: string;
  }>;
  integrity_hash: string;
  run_hash: string;
}>;

export type GovernanceIsolationCheck = Readonly<{
  isolation_check_id: string;
  component: GovernanceIsolationDomain;
  validation_type: "TENANT_BOUNDARY" | "GOVERNANCE_CONTEXT" | "REPLAY_SCOPE" | "RECOMMENDATION_SCOPE" | "EVIDENCE_SCOPE" | "VISIBILITY_SCOPE";
  resource_identifier: string;
  expected_scope: string;
  observed_scope: string;
  validation_result: GovernanceIsolationValidationResultState;
  violation_type: GovernanceIsolationViolation;
  timestamp: string;
  evidence_refs: readonly string[];
  check_hash: string;
}>;

export type GovernanceIsolationValidationResult = Readonly<{
  validation_result_id: string;
  overall_result: GovernanceIsolationValidationResultState;
  tenant_boundary_result: GovernanceIsolationValidationResultState;
  governance_result: GovernanceIsolationValidationResultState;
  replay_result: GovernanceIsolationValidationResultState;
  recommendation_result: GovernanceIsolationValidationResultState;
  evidence_result: GovernanceIsolationValidationResultState;
  visibility_result: GovernanceIsolationValidationResultState;
  failure_count: number;
  warning_count: number;
  result_hash: string;
}>;

export type GovernanceIsolationTimelineEvent = Readonly<{
  event_id: string;
  stage: "LOAD_TENANT_CONTEXT" | "VALIDATE_TENANT_BOUNDARIES" | "VALIDATE_GOVERNANCE_SEPARATION" | "VALIDATE_REPLAY_ISOLATION" | "VALIDATE_RECOMMENDATION_ISOLATION" | "VALIDATE_EVIDENCE_ISOLATION" | "EVALUATE_VISIBILITY_CONTROLS" | "STORE_ISOLATION_VALIDATION";
  timestamp: string;
  state: GovernanceIsolationValidationState;
  summary: string;
  event_hash: string;
}>;

export type GovernanceIsolationLedgerRecord = Readonly<{
  ledger_record_id: string;
  isolation_validation_id: string;
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

export type GovernanceIsolationValidationReport = Readonly<{
  validator_id: string;
  phase_version: "7L.5";
  schema_version: "governance-isolation-validation/v7L.5";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  tenant_data_mutation_allowed: false;
  ownership_mutation_allowed: false;
  authorization_bypass_allowed: false;
  protected_information_exposure_allowed: false;
  governance_execution_allowed: false;
  tenant_isolated: boolean;
  authority_protected: boolean;
  validation_run: GovernanceIsolationValidationRun;
  isolation_checks: readonly GovernanceIsolationCheck[];
  validation_result: GovernanceIsolationValidationResult;
  rejected_violations: readonly Exclude<GovernanceIsolationViolation, "NONE">[];
  timeline: readonly GovernanceIsolationTimelineEvent[];
  evidence_package: Readonly<{
    evidence_package_id: string;
    tenant_refs: readonly string[];
    governance_refs: readonly string[];
    replay_refs: readonly string[];
    recommendation_refs: readonly string[];
    evidence_refs: readonly string[];
    visibility_refs: readonly string[];
    integrity_hashes: readonly string[];
    evidence_hash: string;
  }>;
  truth_ledger_record: GovernanceIsolationLedgerRecord;
  observability: Readonly<{
    isolation_validation_duration_ms: number;
    tenant_isolation_success_rate: number;
    cross_tenant_access_attempts: number;
    governance_separation_violations: number;
    replay_isolation_success_rate: number;
    recommendation_isolation_success_rate: number;
    evidence_isolation_success_rate: number;
    unauthorized_visibility_detections: number;
  }>;
  report_hash: string;
}>;

export type GovernanceIsolationValidationInput = Readonly<{
  scenario?: GovernanceIsolationScenario;
  tenant_id?: string;
  mission_id?: string;
  validator_id?: string;
}>;

export type GovernanceIsolationObservabilitySurface = Readonly<{
  isolation_validation_id: string;
  validation_state: GovernanceIsolationValidationState;
  overall_result: GovernanceIsolationValidationResultState;
  check_count: number;
  failure_count: number;
  rejected_violations: readonly Exclude<GovernanceIsolationViolation, "NONE">[];
  cross_tenant_access_attempts: number;
  unauthorized_visibility_detections: number;
  report_hash: string;
}>;
