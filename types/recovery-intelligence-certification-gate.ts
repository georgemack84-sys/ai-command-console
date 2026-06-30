export type RecoveryIntelligenceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RecoveryCertificationTestExpected = "PASS" | "FAIL";
export type RecoveryCertificationTestOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RecoveryCertificationScenario = "BASELINE" | "CONDITIONAL_REPORTING_GAP" | "AUTONOMOUS_RECOVERY" | "REPLAY_MISMATCH" | "TENANT_ISOLATION_FAILURE" | "INTEGRITY_FAILURE";

export type RecoveryCertificationDomain =
  | "RECOVERY_CONTRACT"
  | "FAILURE_ANALYSIS"
  | "RECOVERY_PLANNING"
  | "RECOVERY_VALIDATION"
  | "RECOVERY_RECOMMENDATION"
  | "RECOVERY_REPLAY"
  | "GOVERNANCE"
  | "CONSTITUTIONAL"
  | "AUTHORITY"
  | "TENANT"
  | "OPERATOR_APPROVAL"
  | "SECURITY";

export type RecoveryCertificationTestResult = Readonly<{
  test_id: string;
  name: string;
  domain: RecoveryCertificationDomain;
  expected_result: RecoveryCertificationTestExpected;
  actual_result: RecoveryCertificationTestOutcome;
  passed: boolean;
  evidence_reference: string;
  findings: readonly string[];
  test_hash: string;
}>;

export type RecoveryCertificationReport = Readonly<{
  executive_summary: string;
  determinism_verification: string;
  replay_verification_report: string;
  governance_compliance_report: string;
  constitutional_compliance_report: string;
  authority_enforcement_report: string;
  tenant_isolation_verification: string;
  operator_approval_verification: string;
  integrity_verification_report: string;
  recovery_lineage_verification: string;
  failed_test_analysis: readonly string[];
  corrective_actions: readonly string[];
  report_hash: string;
}>;

export type RecoveryCertificationLedgerEntry = Readonly<{
  ledger_id: string;
  certification_id: string;
  executed_test_ids: readonly string[];
  replay_references: readonly string[];
  lineage_reference: string;
  governance_evidence: readonly string[];
  append_only: true;
  ledger_hash: string;
}>;

export type RecoveryIntelligenceCertificationRecord = Readonly<{
  certification_id: string;
  certification_version: "recovery-intelligence-certification-gate/v8ALT.2.7";
  recovery_framework_version: "recovery-intelligence/v8ALT.2";
  mission_id: string;
  tenant_id: string;
  certification_state: RecoveryIntelligenceCertificationState;
  executed_tests: readonly RecoveryCertificationTestResult[];
  passed_tests: number;
  failed_tests: number;
  conditional_tests: number;
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  authority_status: "PASS" | "FAIL";
  replay_status: "PASS" | "FAIL";
  integrity_status: "PASS" | "FAIL";
  operator_approval_status: "PASS" | "FAIL";
  production_deployment_approved: boolean;
  controlled_autonomy_integration_approved: boolean;
  certification_report: RecoveryCertificationReport;
  ledger_entry: RecoveryCertificationLedgerEntry;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  certified_timestamp: string;
  record_hash: string;
}>;

export type RecoveryCertificationInput = Readonly<{
  scenario?: RecoveryCertificationScenario;
}>;

export type RecoveryCertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  certification_passed: boolean;
  positive_tests_passed: boolean;
  negative_tests_passed: boolean;
  governance_verified: boolean;
  constitutional_verified: boolean;
  authority_verified: boolean;
  replay_verified: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  operator_approval_enforced: boolean;
  production_ready: boolean;
  immutable_hash_valid: boolean;
  failures: readonly string[];
  validation_hash: string;
}>;

export type RecoveryCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: RecoveryIntelligenceCertificationState;
  passed_tests: number;
  failed_tests: number;
  conditional_tests: number;
  production_deployment_approved: boolean;
  controlled_autonomy_integration_approved: boolean;
  replay_status: "PASS" | "FAIL";
  integrity_status: "PASS" | "FAIL";
  record_hash: string;
}>;

export type RecoveryIntelligenceCertificationGateContract = Readonly<{
  doctrine: Readonly<{
    gate_version: "recovery-intelligence-certification-gate/v8ALT.2.7";
    principles: readonly string[];
    certification_states: readonly RecoveryIntelligenceCertificationState[];
    production_requires_pass: true;
  }>;
  certification: RecoveryIntelligenceCertificationRecord;
  validation: RecoveryCertificationValidationResult;
  observability: RecoveryCertificationObservabilitySurface;
}>;
