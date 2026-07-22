export type AdaptiveMemoryCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type AdaptiveMemoryCertificationTestStatus = "PASS" | "FAIL";

export type AdaptiveMemoryCertificationCategory =
  | "Foundation"
  | "Store"
  | "Index"
  | "Pattern Registry"
  | "Similarity"
  | "Qualification"
  | "Governance"
  | "Tenant Isolation"
  | "Replay"
  | "Lifecycle"
  | "Observability"
  | "Security"
  | "Ledger"
  | "Production Readiness"
  | "Fail Closed";

export type AdaptiveMemoryCertificationScenario =
  | "BASELINE"
  | "MINOR_DOCUMENTATION_GAP"
  | "MINOR_REPORTING_GAP"
  | "NON_CRITICAL_OBSERVABILITY_GAP"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_NONDETERMINISTIC"
  | "REPLAY_DIVERGENCE"
  | "QUALIFICATION_BYPASS"
  | "UNAUTHORIZED_REUSE"
  | "TENANT_ISOLATION_VIOLATION"
  | "CROSS_TENANT_LEAKAGE"
  | "HIDDEN_SHARING"
  | "PRIVILEGE_ESCALATION"
  | "SECURITY_BYPASS"
  | "REPLAY_MANIPULATION"
  | "MEMORY_POISONING"
  | "LEDGER_MODIFICATION"
  | "APPEND_ONLY_VIOLATION"
  | "INTEGRITY_HASH_INCONSISTENCY"
  | "DETERMINISM_VIOLATION"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "LIFECYCLE_HISTORY_DELETE"
  | "OPERATOR_AUTHORITY_BYPASS";

export type AdaptiveMemoryCertificationFailure =
  | "MINOR_DOCUMENTATION_GAP"
  | "MINOR_REPORTING_GAP"
  | "NON_CRITICAL_OBSERVABILITY_GAP"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "REPLAY_NONDETERMINISTIC"
  | "REPLAY_DIVERGENCE_UNEXPLAINED"
  | "MEMORY_QUALIFICATION_BYPASSED"
  | "UNAUTHORIZED_REUSE_SUCCEEDED"
  | "TENANT_ISOLATION_VIOLATED"
  | "CROSS_TENANT_LEAKAGE_DETECTED"
  | "HIDDEN_SHARING_DETECTED"
  | "PRIVILEGE_ESCALATION_SUCCEEDED"
  | "SECURITY_CONTROLS_BYPASSED"
  | "REPLAY_MANIPULATION_SUCCEEDED"
  | "MEMORY_POISONING_SUCCEEDED"
  | "LEDGER_MODIFICATION_DETECTED"
  | "APPEND_ONLY_GUARANTEE_VIOLATED"
  | "INTEGRITY_HASHES_INCONSISTENT"
  | "DETERMINISTIC_BEHAVIOR_VIOLATED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "LIFECYCLE_DELETES_HISTORICAL_MEMORY"
  | "OPERATOR_AUTHORITY_BYPASSED";

export type AdaptiveMemoryCertificationEvidence = Readonly<{
  evidence_id: string;
  source: string;
  phase: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type AdaptiveMemoryCertificationMatrixRecord = Readonly<{
  test_id: string;
  name: string;
  category: AdaptiveMemoryCertificationCategory;
  expected: AdaptiveMemoryCertificationTestStatus;
  actual: AdaptiveMemoryCertificationTestStatus;
  failure: AdaptiveMemoryCertificationFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type AdaptiveMemoryCertificationReportSection = Readonly<{
  report_id: string;
  title: string;
  scope: readonly AdaptiveMemoryCertificationCategory[];
  outcome: AdaptiveMemoryCertificationState;
  findings: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryProductionReadiness = Readonly<{
  readiness_id: string;
  production_deployment_authorized: boolean;
  adaptive_memory_reuse_authorized: boolean;
  governed_institutional_memory_authorized: boolean;
  allowed_operations: readonly string[];
  blocked_operations: readonly string[];
  readiness_hash: string;
}>;

export type AdaptiveMemoryCertificationReplay = Readonly<{
  replay_id: string;
  deterministic: boolean;
  reconstructed_state: AdaptiveMemoryCertificationState;
  reconstructed_matrix_hashes: readonly string[];
  replay_failures: readonly AdaptiveMemoryCertificationFailure[];
  replay_hash: string;
}>;

export type AdaptiveMemoryCertificationReport = Readonly<{
  certification_id: string;
  phase: "10.13N";
  certification_version: "adaptive-memory-certification-gate/v10.13N";
  tenant_id: string;
  mission_id: string;
  certification_state: AdaptiveMemoryCertificationState;
  production_deployment_authorized: boolean;
  adaptive_memory_reuse_authorized: boolean;
  validation_matrix: readonly AdaptiveMemoryCertificationMatrixRecord[];
  detected_failures: readonly AdaptiveMemoryCertificationFailure[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  certification_evidence: readonly AdaptiveMemoryCertificationEvidence[];
  adaptive_memory_certification_report: AdaptiveMemoryCertificationReportSection;
  governance_compliance_report: AdaptiveMemoryCertificationReportSection;
  replay_validation_report: AdaptiveMemoryCertificationReportSection;
  tenant_isolation_report: AdaptiveMemoryCertificationReportSection;
  security_assessment_report: AdaptiveMemoryCertificationReportSection;
  production_readiness_report: AdaptiveMemoryCertificationReportSection;
  readiness: AdaptiveMemoryProductionReadiness;
  replay: AdaptiveMemoryCertificationReplay;
  operator_required: boolean;
  certification_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  report_hash: string;
}>;

export type AdaptiveMemoryCertificationInput = Readonly<{
  scenario?: AdaptiveMemoryCertificationScenario;
}>;

export type AdaptiveMemoryCertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  report_hash_valid: boolean;
  matrix_complete: boolean;
  evidence_complete: boolean;
  reports_complete: boolean;
  replay_valid: boolean;
  production_deployment_authorized: boolean;
  failures: readonly AdaptiveMemoryCertificationFailure[];
  validation_hash: string;
}>;

export type AdaptiveMemoryCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: AdaptiveMemoryCertificationState;
  total_tests: number;
  failed_tests: number;
  production_deployment_authorized: boolean;
  adaptive_memory_reuse_authorized: boolean;
  operator_required: boolean;
  failures: readonly AdaptiveMemoryCertificationFailure[];
  risks: readonly string[];
  report_hash: string;
}>;

export type AdaptiveMemoryCertificationContract = Readonly<{
  doctrine: Readonly<{
    certification_version: "adaptive-memory-certification-gate/v10.13N";
    states: readonly AdaptiveMemoryCertificationState[];
    certification_scope: readonly string[];
    categories: readonly AdaptiveMemoryCertificationCategory[];
    pass_rule: "all-critical-tests-pass";
    conditional_pass_rule: "minor-non-critical-only";
    production_rule: "pass-before-production-memory-reuse";
  }>;
  report: AdaptiveMemoryCertificationReport;
  validation: AdaptiveMemoryCertificationValidationResult;
  observability: AdaptiveMemoryCertificationObservabilitySurface;
}>;
