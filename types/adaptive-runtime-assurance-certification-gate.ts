import type { RuntimeLedgerPackage } from "@/types/runtime-assurance-ledger";

export type AdaptiveRuntimeCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type AdaptiveRuntimeCertificationTestStatus = "PASS" | "FAIL";
export type AdaptiveRuntimeCertificationCategory = "Contract" | "Confidence" | "Runtime Health" | "Drift & Trend" | "Recommendation" | "State Management" | "Ledger" | "Replay" | "Integrity" | "Governance" | "Constitutional" | "Authority" | "Tenant Isolation" | "Operator Visibility" | "Fail Closed";
export type AdaptiveRuntimeCertificationScenario =
  | "BASELINE"
  | "MINOR_DOCUMENTATION_GAP"
  | "MINOR_REPORTING_GAP"
  | "MINOR_VISUALIZATION_GAP"
  | "NON_CRITICAL_OBSERVABILITY_GAP"
  | "NONDETERMINISTIC_CONFIDENCE"
  | "NONDETERMINISTIC_HEALTH"
  | "DRIFT_INCONSISTENCY"
  | "RECOMMENDATION_INCONSISTENCY"
  | "STATE_MISMATCH"
  | "LEDGER_CORRUPTION"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "TENANT_ISOLATION_FAILURE"
  | "HIDDEN_ASSURANCE_STATE"
  | "INCOMPLETE_OPERATOR_VISIBILITY"
  | "UNAUTHORIZED_EXECUTION_CAPABILITY";

export type AdaptiveRuntimeCertificationFailure =
  | "MINOR_DOCUMENTATION_GAP"
  | "MINOR_REPORTING_GAP"
  | "MINOR_VISUALIZATION_GAP"
  | "NON_CRITICAL_OBSERVABILITY_GAP"
  | "NONDETERMINISTIC_CONFIDENCE_EVALUATION"
  | "NONDETERMINISTIC_HEALTH_SCORING"
  | "DRIFT_INCONSISTENCY"
  | "RECOMMENDATION_INCONSISTENCY"
  | "ASSURANCE_STATE_MISMATCH"
  | "LEDGER_CORRUPTION"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "TENANT_ISOLATION_FAILURE"
  | "HIDDEN_RUNTIME_ASSURANCE_STATE"
  | "INCOMPLETE_OPERATOR_VISIBILITY"
  | "UNAUTHORIZED_EXECUTION_CAPABILITY";

export type AdaptiveRuntimeCertificationMatrixRecord = Readonly<{
  test_id: string;
  name: string;
  category: AdaptiveRuntimeCertificationCategory;
  expected: AdaptiveRuntimeCertificationTestStatus;
  actual: AdaptiveRuntimeCertificationTestStatus;
  failure: AdaptiveRuntimeCertificationFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type AdaptiveRuntimeCertificationEvidence = Readonly<{
  evidence_id: string;
  source: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type AdaptiveRuntimeCertificationReadiness = Readonly<{
  readiness_id: string;
  production_progression_permitted: boolean;
  higher_order_resilience_enabled: boolean;
  allowed_operations: readonly string[];
  blocked_operations: readonly string[];
  readiness_hash: string;
}>;

export type AdaptiveRuntimeCertificationReplay = Readonly<{
  replay_id: string;
  deterministic: boolean;
  reconstructed_state: AdaptiveRuntimeCertificationState;
  reconstructed_matrix_hashes: readonly string[];
  replay_failures: readonly AdaptiveRuntimeCertificationFailure[];
  replay_hash: string;
}>;

export type AdaptiveRuntimeCertificationReport = Readonly<{
  certification_id: string;
  phase: "8ALT.1H";
  certification_version: "adaptive-runtime-assurance-certification-gate/v8ALT.1H";
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  certification_state: AdaptiveRuntimeCertificationState;
  production_progression_permitted: boolean;
  higher_order_resilience_enabled: boolean;
  validation_matrix: readonly AdaptiveRuntimeCertificationMatrixRecord[];
  detected_failures: readonly AdaptiveRuntimeCertificationFailure[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  ledger_package: RuntimeLedgerPackage;
  certification_evidence: readonly AdaptiveRuntimeCertificationEvidence[];
  readiness: AdaptiveRuntimeCertificationReadiness;
  replay: AdaptiveRuntimeCertificationReplay;
  operator_required: boolean;
  certification_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  report_hash: string;
}>;

export type AdaptiveRuntimeCertificationInput = Readonly<{
  scenario?: AdaptiveRuntimeCertificationScenario;
}>;

export type AdaptiveRuntimeCertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  report_hash_valid: boolean;
  matrix_complete: boolean;
  evidence_complete: boolean;
  replay_valid: boolean;
  production_progression_permitted: boolean;
  failures: readonly AdaptiveRuntimeCertificationFailure[];
  validation_hash: string;
}>;

export type AdaptiveRuntimeCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: AdaptiveRuntimeCertificationState;
  total_tests: number;
  failed_tests: number;
  production_progression_permitted: boolean;
  higher_order_resilience_enabled: boolean;
  operator_required: boolean;
  failures: readonly AdaptiveRuntimeCertificationFailure[];
  risks: readonly string[];
  report_hash: string;
}>;

export type AdaptiveRuntimeCertificationContract = Readonly<{
  doctrine: Readonly<{
    certification_version: "adaptive-runtime-assurance-certification-gate/v8ALT.1H";
    states: readonly AdaptiveRuntimeCertificationState[];
    certification_scope: readonly string[];
    categories: readonly AdaptiveRuntimeCertificationCategory[];
    pass_rule: "all-critical-tests-pass";
    conditional_pass_rule: "minor-non-critical-only";
  }>;
  report: AdaptiveRuntimeCertificationReport;
  validation: AdaptiveRuntimeCertificationValidationResult;
  observability: AdaptiveRuntimeCertificationObservabilitySurface;
}>;
