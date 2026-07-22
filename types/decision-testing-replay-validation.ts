export type DecisionTestCategory =
  | "UNIT"
  | "INTEGRATION"
  | "REPLAY"
  | "BOUNDARY"
  | "FAILURE_INJECTION"
  | "SERIALIZATION"
  | "TENANT_ISOLATION";

export type DecisionTestResult = "PASS" | "FAIL";

export type DecisionTestingFailureClass =
  | "UNIT_FAILURE"
  | "INTEGRATION_FAILURE"
  | "REPLAY_FAILURE"
  | "BOUNDARY_FAILURE"
  | "FAILURE_INJECTION_FAILURE"
  | "SERIALIZATION_FAILURE"
  | "TENANT_ISOLATION_FAILURE"
  | "VALIDATION_FAILURE"
  | "UNKNOWN_FAILURE";

export type TestEvidenceRecord = Readonly<{
  test_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  test_category: DecisionTestCategory;
  test_name: string;
  expected_result: DecisionTestResult;
  actual_result: DecisionTestResult;
  replay_reference: string;
  failure_class?: DecisionTestingFailureClass;
  integrity_hash: string;
  execution_duration: number;
  completed_at: string;
}>;

export type ReplayValidationMetadata = Readonly<{
  replay_validation_id: string;
  replay_version: "decision-testing-replay/v1";
  replay_status: DecisionTestResult;
  replay_hash: string;
  reconstruction_duration: number;
  integrity_hash: string;
  completed_at: string;
}>;

export type DecisionFailureInjectionScenario =
  | "HASH_CORRUPTION"
  | "REPLAY_CORRUPTION"
  | "SERIALIZATION_CORRUPTION"
  | "POLICY_CORRUPTION"
  | "LINEAGE_CORRUPTION"
  | "MISSING_REFERENCES"
  | "AUTHORITY_FAILURE"
  | "API_FAILURE"
  | "VALIDATION_FAILURE"
  | "TIMEOUT";

export type DecisionFailureInjectionResult = Readonly<{
  scenario: DecisionFailureInjectionScenario;
  expected_result: DecisionTestResult;
  actual_result: DecisionTestResult;
  prevented_orchestration: boolean;
  diagnostics: readonly string[];
  evidence: TestEvidenceRecord;
}>;

export type DecisionCoverageReport = Readonly<{
  coverage_id: string;
  component_coverage: Readonly<Record<string, number>>;
  public_api_coverage: number;
  sdk_interface_coverage: number;
  total_coverage: number;
  coverage_status: DecisionTestResult;
  integrity_hash: string;
}>;

export type DecisionReplayValidationResult = Readonly<{
  replay_valid: boolean;
  original_hash: string;
  replayed_hash: string;
  metadata: ReplayValidationMetadata;
  evidence: TestEvidenceRecord;
}>;

export type DecisionTestingReport = Readonly<{
  testing_report_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  test_matrix: readonly DecisionTestCategory[];
  validation_status: DecisionTestResult;
  evidence_records: readonly TestEvidenceRecord[];
  failure_injections: readonly DecisionFailureInjectionResult[];
  replay_validation: DecisionReplayValidationResult;
  coverage_report: DecisionCoverageReport;
  failures: readonly DecisionTestingFailureClass[];
  advisory_only: true;
  certification_ready: boolean;
  integrity_hash: string;
  completed_at: string;
}>;

export type DecisionTestingObservability = Readonly<{
  test_execution_count: number;
  pass_rate: number;
  fail_rate: number;
  replay_validation_latency: number;
  serialization_consistency: number;
  boundary_rejection_rate: number;
  failure_injection_outcomes: Readonly<Record<DecisionFailureInjectionScenario, DecisionTestResult>>;
  tenant_isolation_violations: number;
  coverage_percentage: number;
  replay_divergence_rate: number;
  deterministic_validation_rate: number;
}>;
