import type { DriftDefenseArchitectureResult } from "@/types/drift-defense-architecture";
import type { DriftDefenseLedgerResult } from "@/types/drift-defense-ledger";

export type DriftDefenseCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type DriftDefenseCertificationFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "DETECTION_COVERAGE_GAP"
  | "UNDETECTED_UNSAFE_DRIFT"
  | "NONDETERMINISTIC_CONTAINMENT"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_BOUNDARY_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "REPLAY_DIVERGENCE"
  | "EVIDENCE_POISONING_VULNERABILITY"
  | "FEEDBACK_MANIPULATION_INFLUENCE"
  | "OPTIMIZATION_GOVERNANCE_BYPASS"
  | "OPERATOR_AUTHORITY_DEGRADATION"
  | "CERTIFICATION_BYPASS"
  | "AUDIT_INTEGRITY_FAILURE"
  | "ROLLBACK_FAILURE"
  | "IMMUTABLE_LEDGER_VIOLATION"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "ADAPTIVE_BEHAVIOR_OUTSIDE_CERTIFIED_BOUNDARIES"
  | "DOCUMENTATION_GAP"
  | "OBSERVABILITY_GAP"
  | "REPORTING_GAP"
  | "VISUALIZATION_GAP"
  | "OPERATIONAL_USABILITY_GAP"
  | "NONDETERMINISTIC_CERTIFICATION"
  | "NONREPLAYABLE_CERTIFICATION_EVIDENCE"
  | "UNKNOWN_CERTIFICATION_BEHAVIOR";

export type DriftDefenseCertificationScenario =
  | "BASELINE"
  | "DETECTION_COVERAGE_GAP"
  | "UNDETECTED_UNSAFE_DRIFT"
  | "NONDETERMINISTIC_CONTAINMENT"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_BOUNDARY_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "REPLAY_DIVERGENCE"
  | "EVIDENCE_POISONING"
  | "FEEDBACK_MANIPULATION"
  | "OPTIMIZATION_BYPASS"
  | "OPERATOR_AUTHORITY_DEGRADATION"
  | "CERTIFICATION_BYPASS"
  | "AUDIT_INTEGRITY_FAILURE"
  | "ROLLBACK_FAILURE"
  | "LEDGER_VIOLATION"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "OUTSIDE_CERTIFIED_BOUNDARIES"
  | "DOCUMENTATION_GAP"
  | "OBSERVABILITY_GAP"
  | "REPORTING_GAP"
  | "VISUALIZATION_GAP"
  | "OPERATIONAL_USABILITY_GAP"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "UNKNOWN_BEHAVIOR";

export type CertificationSuiteStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type CertificationSuiteReport = Readonly<{
  suite_id: string;
  suite_name: string;
  status: CertificationSuiteStatus;
  tests_executed: readonly string[];
  passed_tests: readonly string[];
  failed_tests: readonly string[];
  conditional_findings: readonly DriftDefenseCertificationFailure[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DriftDefenseCertificationReport = Readonly<{
  report_id: string;
  certification_outcome: DriftDefenseCertificationOutcome;
  certification_statement: string;
  detected_failures: readonly DriftDefenseCertificationFailure[];
  conditional_findings: readonly DriftDefenseCertificationFailure[];
  production_progression_authorized: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  authority_preserved: boolean;
  replay_preserved: boolean;
  tenant_isolation_preserved: boolean;
  evidence_integrity_preserved: boolean;
  operator_control_preserved: boolean;
  integrity_hash: string;
}>;

export type CertificationTraceabilityMatrix = Readonly<{
  matrix_id: string;
  detection_coverage_refs: readonly string[];
  adversarial_defense_refs: readonly string[];
  containment_refs: readonly string[];
  replay_audit_refs: readonly string[];
  governance_security_refs: readonly string[];
  ledger_refs: readonly string[];
  unmet_requirements: readonly DriftDefenseCertificationFailure[];
  integrity_hash: string;
}>;

export type ProductionReadinessAssessment = Readonly<{
  assessment_id: string;
  production_ready: boolean;
  deterministic_adaptive_behavior: boolean;
  governance_preserving_adaptation: boolean;
  constitutionally_constrained_adaptation: boolean;
  operator_controlled_adaptation: boolean;
  replay_safe_adaptation: boolean;
  explainable_adaptation: boolean;
  evidence_backed_adaptation: boolean;
  tenant_isolated_adaptation: boolean;
  certification_bound_adaptation: boolean;
  recoverable_adaptation: boolean;
  readiness_summary: string;
  integrity_hash: string;
}>;

export type DriftDefenseCertificationRecord = Readonly<{
  certification_id: string;
  tenant_id: string;
  certification_version: string;
  outcome: DriftDefenseCertificationOutcome;
  suite_results: readonly CertificationSuiteStatus[];
  failures: readonly DriftDefenseCertificationFailure[];
  conditional_findings: readonly DriftDefenseCertificationFailure[];
  production_progression_authorized: boolean;
  ledger_ref: string;
  replay_refs: readonly string[];
  supporting_evidence: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DriftDefenseCertificationMetrics = Readonly<{
  outcome: DriftDefenseCertificationOutcome;
  detection_coverage_passed: boolean;
  adversarial_defense_passed: boolean;
  containment_passed: boolean;
  replay_audit_passed: boolean;
  governance_security_passed: boolean;
  production_ready: boolean;
  deterministic_certification: boolean;
  replayable_certification: boolean;
  critical_failures: readonly DriftDefenseCertificationFailure[];
  conditional_findings: readonly DriftDefenseCertificationFailure[];
  integrity_hash: string;
}>;

export type DriftDefenseCertificationApiSurface = Readonly<{
  api_id: string;
  certify_drift_defense: "POST /drift-defense-certification-gate/certify";
  retrieve_certification_report: "POST /drift-defense-certification-gate/report";
  retrieve_detection_coverage: "POST /drift-defense-certification-gate/detection-coverage";
  retrieve_adversarial_defense: "POST /drift-defense-certification-gate/adversarial-defense";
  retrieve_containment: "POST /drift-defense-certification-gate/containment";
  retrieve_replay_audit: "POST /drift-defense-certification-gate/replay-audit";
  retrieve_governance_security: "POST /drift-defense-certification-gate/governance-security";
  retrieve_traceability: "POST /drift-defense-certification-gate/traceability";
  retrieve_readiness: "POST /drift-defense-certification-gate/readiness";
  retrieve_record: "POST /drift-defense-certification-gate/record";
  retrieve_metrics: "POST /drift-defense-certification-gate/metrics";
  replay_certification: "POST /drift-defense-certification-gate/replay";
  inspect_certification: "POST /drift-defense-certification-gate/inspect";
  retrieve_contract: "GET /drift-defense-certification-gate/contract";
  production_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type DriftDefenseCertificationInput = Readonly<{
  scenario?: DriftDefenseCertificationScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
  ledger_result?: DriftDefenseLedgerResult;
}>;

export type DriftDefenseCertificationResult = Readonly<{
  drift_defense_certification_version: "drift-defense-certification-gate/v1";
  gate_identifier: "DriftDefenseCertificationGate";
  outcome: DriftDefenseCertificationOutcome;
  api_surface: DriftDefenseCertificationApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  ledger_result: DriftDefenseLedgerResult;
  detection_coverage_report: CertificationSuiteReport;
  adversarial_defense_report: CertificationSuiteReport;
  containment_validation_report: CertificationSuiteReport;
  replay_integrity_report: CertificationSuiteReport;
  governance_preservation_report: CertificationSuiteReport;
  certification_report: DriftDefenseCertificationReport;
  traceability_matrix: CertificationTraceabilityMatrix;
  production_readiness_assessment: ProductionReadinessAssessment;
  certification_record: DriftDefenseCertificationRecord;
  metrics: DriftDefenseCertificationMetrics;
  failures: readonly DriftDefenseCertificationFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  authorizes_production: false;
  mutates_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DriftDefenseCertificationFoundation = Readonly<{
  drift_defense_certification_version: "drift-defense-certification-gate/v1";
  api_surface: DriftDefenseCertificationApiSurface;
  result: DriftDefenseCertificationResult;
}>;
