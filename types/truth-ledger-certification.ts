export type TruthLedgerCertificationCategory = "PERSISTENCE" | "EVIDENCE" | "LINEAGE" | "REPLAY" | "INTEGRITY" | "VISIBILITY" | "ISOLATION" | "FAIL_CLOSED";
export type TruthLedgerCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type TruthLedgerTestState = "PASS" | "WARN" | "FAIL";
export type TruthLedgerArtifactType = "CERTIFICATION_CONTRACT" | "FIXTURE_LIBRARY" | "PERSISTENCE_TEST_REPORT" | "EVIDENCE_RECONSTRUCTION_REPORT" | "LINEAGE_TEST_REPORT" | "REPLAY_TEST_REPORT" | "INTEGRITY_TEST_REPORT" | "VISIBILITY_TEST_REPORT" | "ISOLATION_TEST_REPORT" | "FAIL_CLOSED_TEST_REPORT" | "FINAL_CERTIFICATION_REPORT";

export type TruthLedgerCertificationFixture = Readonly<{
  fixture_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  event_type: "INPUT" | "EVIDENCE" | "RECOMMENDATION" | "GOVERNANCE" | "DECISION" | "REPLAY";
  event_source: string;
  lifecycle_state: "CREATED" | "VERIFIED" | "SUPERSEDED" | "RESTRICTED";
  evidence_refs: readonly string[];
  recommendation_refs: readonly string[];
  decision_refs: readonly string[];
  lineage: Readonly<{ parent_refs: readonly string[]; child_refs: readonly string[]; causality_refs: readonly string[]; supersedes: readonly string[]; branch_refs: readonly string[] }>;
  replay_refs: readonly string[];
  integrity: Readonly<{ record_hash: string; chain_hash: string; state: "VALID" | "DEGRADED" | "CORRUPTED" }>;
  created_at: string;
}>;

export type TruthLedgerCertificationContract = Readonly<{
  certification_id: string;
  suite_name: "Truth Ledger Certification Suite";
  phase: "6L";
  tenant_scope: string;
  mission_scope: string;
  ledger_version: string;
  schema_version: string;
  test_categories: readonly TruthLedgerCertificationCategory[];
  required_fixtures: readonly TruthLedgerCertificationFixture[];
  replay_required: boolean;
  integrity_required: boolean;
  visibility_required: boolean;
  isolation_required: boolean;
  fail_closed_required: boolean;
  certification_state: TruthLedgerCertificationState;
}>;

export type TruthLedgerCertificationTest = Readonly<{
  test_id: string;
  category: TruthLedgerCertificationCategory;
  name: string;
  expected: "PASS";
  state: TruthLedgerTestState;
  critical: boolean;
  evidence_refs: readonly string[];
  failure_reason?: string;
}>;

export type TruthLedgerCategoryResult = Readonly<{
  category: TruthLedgerCertificationCategory;
  state: TruthLedgerCertificationState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warning_tests: number;
  tests: readonly TruthLedgerCertificationTest[];
  artifact_ref: string;
}>;

export type TruthLedgerCertificationFailure = Readonly<{
  failure_id: string;
  category: TruthLedgerCertificationCategory;
  test_id: string;
  severity: "HIGH" | "CRITICAL";
  summary: string;
  blocking: boolean;
}>;

export type TruthLedgerCertificationWarning = Readonly<{
  warning_id: string;
  category: TruthLedgerCertificationCategory;
  test_id: string;
  summary: string;
  remediation: string;
}>;

export type TruthLedgerCertificationFinding = Readonly<{
  finding_id: string;
  category: TruthLedgerCertificationCategory;
  summary: string;
}>;

export type TruthLedgerCertificationArtifact = Readonly<{
  artifact_id: string;
  artifact_type: TruthLedgerArtifactType;
  certification_id: string;
  category?: TruthLedgerCertificationCategory;
  summary: string;
  evidence_refs: readonly string[];
}>;

export type TruthLedgerCertificationReport = Readonly<{
  certification_id: string;
  executed_at: string;
  ledger_version: string;
  schema_version: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warning_tests: number;
  certification_state: TruthLedgerCertificationState;
  category_results: readonly TruthLedgerCategoryResult[];
  failure_summary: readonly TruthLedgerCertificationFailure[];
}>;

export type TruthLedgerCertificationResult = Readonly<{
  certification_id: string;
  phase: "6L";
  suite_name: "Truth Ledger Certification Suite";
  certification_state: TruthLedgerCertificationState;
  persistence: TruthLedgerCategoryResult;
  evidence: TruthLedgerCategoryResult;
  lineage: TruthLedgerCategoryResult;
  replay: TruthLedgerCategoryResult;
  integrity: TruthLedgerCategoryResult;
  visibility: TruthLedgerCategoryResult;
  isolation: TruthLedgerCategoryResult;
  fail_closed: TruthLedgerCategoryResult;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warnings: readonly TruthLedgerCertificationWarning[];
  blocking_failures: readonly TruthLedgerCertificationFailure[];
  non_blocking_findings: readonly TruthLedgerCertificationFinding[];
  replay_hashes: readonly string[];
  integrity_hashes: readonly string[];
  ledger_version: string;
  schema_version: string;
  certified_at: string;
  report: TruthLedgerCertificationReport;
  artifacts: readonly TruthLedgerCertificationArtifact[];
  deterministic_result_hash: string;
}>;

export type TruthLedgerCertificationView = Readonly<{
  contract: TruthLedgerCertificationContract;
  result: TruthLedgerCertificationResult;
  guardrails: readonly string[];
  generated_at: string;
}>;
