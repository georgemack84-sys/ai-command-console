export type GovernanceAuthorityValidationState =
  | "REQUESTED"
  | "LOADING_RULES"
  | "VALIDATING_BOUNDARIES"
  | "VERIFYING_COMPLIANCE"
  | "GENERATING_REPORT"
  | "VALIDATED"
  | "ADVISORY_FAILURE"
  | "EXECUTION_AUTHORITY_FAILURE"
  | "CONSTITUTION_FAILURE"
  | "POLICY_FAILURE"
  | "OPERATOR_FAILURE"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED";

export type GovernanceAuthorityValidationResultState = "PASS" | "FAIL";

export type GovernanceAuthorityDomain =
  | "ADVISORY_ONLY"
  | "EXECUTION_AUTHORITY"
  | "CONSTITUTION"
  | "POLICY_ENFORCEMENT"
  | "OPERATOR_SUPREMACY"
  | "AUTHORITY_ESCALATION"
  | "GOVERNANCE_BYPASS";

export type GovernanceAuthorityViolation =
  | "NONE"
  | "EXECUTION_COMMAND_GENERATED"
  | "STATE_MODIFICATION_REQUESTED"
  | "AUTONOMOUS_ACTION_INITIATED"
  | "EXECUTION_CAPABILITY_DETECTED"
  | "PRIVILEGED_OPERATION_ATTEMPTED"
  | "COMMAND_TRANSMISSION_INITIATED"
  | "CONSTITUTIONAL_VIOLATION"
  | "PROHIBITED_AUTHORITY_EXERCISED"
  | "CONSTITUTIONAL_BYPASS"
  | "POLICY_IGNORED"
  | "ENFORCEMENT_BYPASSED"
  | "INCONSISTENT_ENFORCEMENT"
  | "OPERATOR_OVERRIDE_BLOCKED"
  | "GOVERNANCE_SELF_APPROVAL"
  | "OPERATOR_AUTHORITY_DIMINISHED"
  | "PRIVILEGE_EXPANSION"
  | "ROLE_ELEVATION"
  | "UNAUTHORIZED_AUTHORITY_ACQUISITION"
  | "APPROVAL_WORKFLOW_BYPASSED"
  | "OPERATOR_REVIEW_BYPASSED"
  | "TENANT_AUTHORITY_LEAK";

export type GovernanceAuthorityBoundaryScenario =
  | "BASELINE"
  | "EXECUTION_COMMAND_GENERATED"
  | "STATE_MODIFICATION_REQUESTED"
  | "AUTONOMOUS_ACTION_INITIATED"
  | "EXECUTION_CAPABILITY_DETECTED"
  | "PRIVILEGED_OPERATION_ATTEMPTED"
  | "COMMAND_TRANSMISSION_INITIATED"
  | "CONSTITUTIONAL_VIOLATION"
  | "PROHIBITED_AUTHORITY_EXERCISED"
  | "CONSTITUTIONAL_BYPASS"
  | "POLICY_IGNORED"
  | "ENFORCEMENT_BYPASSED"
  | "INCONSISTENT_ENFORCEMENT"
  | "OPERATOR_OVERRIDE_BLOCKED"
  | "GOVERNANCE_SELF_APPROVAL"
  | "OPERATOR_AUTHORITY_DIMINISHED"
  | "PRIVILEGE_EXPANSION"
  | "ROLE_ELEVATION"
  | "UNAUTHORIZED_AUTHORITY_ACQUISITION"
  | "APPROVAL_WORKFLOW_BYPASSED"
  | "OPERATOR_REVIEW_BYPASSED"
  | "TENANT_AUTHORITY_LEAK";

export type GovernanceAuthorityValidationRun = Readonly<{
  authority_validation_id: string;
  tenant_id: string;
  mission_id: string;
  validation_timestamp: string;
  validation_scope: readonly GovernanceAuthorityDomain[];
  overall_result: GovernanceAuthorityValidationResultState;
  constitution_version: "governance-constitution/v7";
  policy_version: "governance-policy-framework/v7";
  integrity_hash: string;
  run_hash: string;
}>;

export type GovernanceAuthorityCheck = Readonly<{
  authority_check_id: string;
  component: GovernanceAuthorityDomain;
  authority_type: "ADVISORY_BOUNDARY" | "EXECUTION_GUARD" | "CONSTITUTION_RULE" | "POLICY_CONTROL" | "OPERATOR_CONTROL" | "ESCALATION_GUARD" | "BYPASS_GUARD";
  expected_behavior: string;
  observed_behavior: string;
  validation_result: GovernanceAuthorityValidationResultState;
  violation_type: GovernanceAuthorityViolation;
  timestamp: string;
  evidence_refs: readonly string[];
  check_hash: string;
}>;

export type GovernanceAuthorityValidationResult = Readonly<{
  validation_result_id: string;
  overall_result: GovernanceAuthorityValidationResultState;
  advisory_result: GovernanceAuthorityValidationResultState;
  execution_result: GovernanceAuthorityValidationResultState;
  constitution_result: GovernanceAuthorityValidationResultState;
  policy_result: GovernanceAuthorityValidationResultState;
  operator_result: GovernanceAuthorityValidationResultState;
  failure_count: number;
  warning_count: number;
  result_hash: string;
}>;

export type GovernanceAuthorityTimelineEvent = Readonly<{
  event_id: string;
  stage: "LOAD_CONSTITUTION" | "LOAD_GOVERNANCE_POLICIES" | "VALIDATE_ADVISORY_BOUNDARIES" | "VALIDATE_EXECUTION_AUTHORITY" | "VALIDATE_CONSTITUTIONAL_COMPLIANCE" | "VALIDATE_POLICY_ENFORCEMENT" | "VALIDATE_OPERATOR_SUPREMACY" | "STORE_AUTHORITY_VALIDATION";
  timestamp: string;
  state: GovernanceAuthorityValidationState;
  summary: string;
  event_hash: string;
}>;

export type GovernanceAuthorityLedgerRecord = Readonly<{
  ledger_record_id: string;
  authority_validation_id: string;
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

export type GovernanceAuthorityBoundaryValidationReport = Readonly<{
  validator_id: string;
  phase_version: "7L.4";
  schema_version: "governance-authority-boundary-validation/v7L.4";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  execution_authority_granted: false;
  privilege_elevation_allowed: false;
  governance_self_approval_allowed: false;
  policy_mutation_allowed: false;
  constitution_mutation_allowed: false;
  operator_supremacy_preserved: boolean;
  tenant_isolated: boolean;
  authority_protected: boolean;
  validation_run: GovernanceAuthorityValidationRun;
  authority_checks: readonly GovernanceAuthorityCheck[];
  validation_result: GovernanceAuthorityValidationResult;
  rejected_violations: readonly Exclude<GovernanceAuthorityViolation, "NONE">[];
  timeline: readonly GovernanceAuthorityTimelineEvent[];
  evidence_package: Readonly<{
    evidence_package_id: string;
    constitution_refs: readonly string[];
    policy_refs: readonly string[];
    operator_refs: readonly string[];
    certification_refs: readonly string[];
    integrity_hashes: readonly string[];
    evidence_hash: string;
  }>;
  truth_ledger_record: GovernanceAuthorityLedgerRecord;
  observability: Readonly<{
    authority_validation_duration_ms: number;
    advisory_compliance_rate: number;
    constitutional_compliance_rate: number;
    policy_enforcement_success_rate: number;
    operator_override_verification_rate: number;
    authority_violation_count: number;
    governance_bypass_detection_rate: number;
    certification_success_rate: number;
  }>;
  report_hash: string;
}>;

export type GovernanceAuthorityBoundaryValidationInput = Readonly<{
  scenario?: GovernanceAuthorityBoundaryScenario;
  tenant_id?: string;
  mission_id?: string;
  validator_id?: string;
}>;

export type GovernanceAuthorityBoundaryObservabilitySurface = Readonly<{
  authority_validation_id: string;
  validation_state: GovernanceAuthorityValidationState;
  overall_result: GovernanceAuthorityValidationResultState;
  check_count: number;
  failure_count: number;
  rejected_violations: readonly Exclude<GovernanceAuthorityViolation, "NONE">[];
  authority_violation_count: number;
  certification_success_rate: number;
  report_hash: string;
}>;
