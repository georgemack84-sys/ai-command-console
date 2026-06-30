import type { EscalationReplayState } from "./escalation-contract";

export type EscalationCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type EscalationCertificationComponentKey =
  | "contract_certification_result"
  | "detection_certification_result"
  | "prioritization_certification_result"
  | "recommendation_certification_result"
  | "replay_certification_result"
  | "evidence_certification_result"
  | "lineage_certification_result"
  | "confidence_certification_result"
  | "truth_ledger_result"
  | "explainability_result"
  | "governance_boundary_result"
  | "advisory_only_result"
  | "tenant_isolation_result"
  | "certification_metadata_result";

export type EscalationCertificationFailureClass =
  | "CONTRACT_MISSING_ACCEPTED"
  | "SCHEMA_INVALID_ACCEPTED"
  | "UNSUPPORTED_TRIGGER_ACCEPTED"
  | "DETECTION_MISMATCH"
  | "CONSTITUTIONAL_REPLAY_MISMATCH"
  | "AUTHORITY_REPLAY_MISMATCH"
  | "POLICY_REPLAY_MISMATCH"
  | "COMPLIANCE_REPLAY_MISMATCH"
  | "INTEGRITY_REPLAY_MISMATCH"
  | "PRIORITY_CALCULATION_MISMATCH"
  | "SEVERITY_THRESHOLD_MISMATCH"
  | "ROUTING_INCONSISTENCY"
  | "RECOMMENDATION_MISMATCH"
  | "RECOMMENDATION_CONFIDENCE_MISMATCH"
  | "INCOMPLETE_EVIDENCE_ACCEPTED"
  | "LINEAGE_RECONSTRUCTION_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "TRUTH_LEDGER_RECORD_MISSING"
  | "REPLAY_MISMATCH"
  | "EXPLAINABILITY_INCOMPLETE"
  | "TENANT_ISOLATION_FAILURE"
  | "EXECUTION_AUTHORITY_ACCEPTED"
  | "AUTHORITY_EXPANSION_ACCEPTED"
  | "IDENTIFIER_MUTATION_ACCEPTED"
  | "HIDDEN_CERTIFICATION_STATE"
  | "CERTIFICATION_METADATA_INCOMPLETE"
  | "CERTIFICATION_HASH_MISMATCH"
  | "CERTIFICATION_DECISION_MISMATCH"
  | "MINOR_EXPLAINABILITY_GAP"
  | "MINOR_OPERATOR_VISIBILITY_GAP"
  | "MINOR_REPORTING_GAP";

export type EscalationCertificationTestResult = Readonly<{
  component: EscalationCertificationComponentKey;
  status: EscalationCertificationState;
  test_count: number;
  passed_count: number;
  failed_count: number;
  deterministic: boolean;
  tenant_safe: boolean;
  advisory_only: boolean;
  replay_state: EscalationReplayState;
  failure_class: EscalationCertificationFailureClass | null;
  rationale: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
}>;

export type EscalationCertificationFinding = Readonly<{
  finding_id: string;
  component: EscalationCertificationComponentKey;
  failure_class: EscalationCertificationFailureClass;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  remediation_ref: string;
}>;

export type EscalationCertificationInputSet = Readonly<{
  valid_contract_case: string;
  missing_contract_case: string;
  baseline_detection_case: string;
  unsupported_trigger_case: string;
  constitutional_case: string;
  authority_case: string;
  policy_case: string;
  compliance_case: string;
  integrity_case: string;
  replay_case: string;
  priority_mismatch_case: string;
  recommendation_mismatch_case: string;
  incomplete_evidence_case: string;
  broken_lineage_case: string;
  tenant_violation_case: string;
  execution_authority_case: string;
  hidden_state_case: string;
}>;

export type EscalationCertificationRecord = Readonly<{
  certification_id: string;
  tenant_id: string;
  mission_id: string;
  phase_id: "7F";
  certification_scope: readonly ("7F.1" | "7F.2" | "7F.3" | "7F.4")[];
  certification_state: EscalationCertificationState;
  certification_summary: string;
  input_set: EscalationCertificationInputSet;
  contract_certification_result: EscalationCertificationTestResult;
  detection_certification_result: EscalationCertificationTestResult;
  prioritization_certification_result: EscalationCertificationTestResult;
  recommendation_certification_result: EscalationCertificationTestResult;
  replay_certification_result: EscalationCertificationTestResult;
  evidence_certification_result: EscalationCertificationTestResult;
  lineage_certification_result: EscalationCertificationTestResult;
  confidence_certification_result: EscalationCertificationTestResult;
  truth_ledger_result: EscalationCertificationTestResult;
  explainability_result: EscalationCertificationTestResult;
  governance_boundary_result: EscalationCertificationTestResult;
  advisory_only_result: EscalationCertificationTestResult;
  tenant_isolation_result: EscalationCertificationTestResult;
  certification_metadata_result: EscalationCertificationTestResult;
  failed_tests: readonly EscalationCertificationComponentKey[];
  conditional_findings: readonly EscalationCertificationFinding[];
  blocking_findings: readonly EscalationCertificationFinding[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  certified_timestamp: string;
  certifier_version: "ESCALATION-CERTIFICATION-V1";
  certification_hash: string;
}>;

export type EscalationCertificationValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type EscalationCertificationValidationResult = Readonly<{
  validation_state: EscalationCertificationValidationState;
  validator_version: "ESCALATION-CERTIFICATION-VALIDATOR-V1";
  errors: readonly EscalationCertificationFinding[];
  checks: Readonly<{
    record_present: boolean;
    state_valid: boolean;
    decision_consistent: boolean;
    replay_ready: boolean;
    tenant_isolated: boolean;
    advisory_only_enforced: boolean;
    truth_ledger_linked: boolean;
    metadata_complete: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
}>;

export type EscalationCertificationReplayResult = Readonly<{
  replay_id: string;
  replay_state: EscalationReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: EscalationCertificationState;
  expected_state: EscalationCertificationState;
  failure_class: EscalationCertificationFailureClass | null;
}>;

export type EscalationCertificationReport = Readonly<{
  certification_state: EscalationCertificationState;
  certification_summary: string;
  evidence_status: "COMPLETE" | "INCOMPLETE";
  replay_status: EscalationReplayState;
  tenant_isolation_status: "PRESERVED" | "VIOLATED";
  advisory_only_status: "ENFORCED" | "VIOLATED";
  truth_ledger_status: "COMPLETE" | "INCOMPLETE";
  metadata_status: "COMPLETE" | "INCOMPLETE";
  failed_tests: readonly EscalationCertificationComponentKey[];
  required_remediation: readonly EscalationCertificationFinding[];
}>;

export type EscalationCertificationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "explainable" | "evidence-complete" | "lineage-preserving" | "confidence-reproducible" | "truth-ledger-recorded" | "replayable" | "constitutional-supremacy" | "authority-preserving" | "advisory-only" | "tenant-safe" | "certification-ready" | "fail-closed")[];
  certification_states: readonly EscalationCertificationState[];
  certification_scope: readonly ("7F.1" | "7F.2" | "7F.3" | "7F.4")[];
  blocking_failure_classes: readonly EscalationCertificationFailureClass[];
  contract_version: "ESCALATION-CERTIFICATION-V1";
}>;
