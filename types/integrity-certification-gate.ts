import type { IntegrityState } from "@/types/integrity-contract";
import type { IntegrityVerificationReport, IntegrityVerificationScenario } from "@/types/integrity-verification-service";

export type IntegrityCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type IntegrityCertificationScenario =
  | "BASELINE"
  | "MINOR_REPORTING_GAP"
  | "INTEGRITY_CONTRACT_MISSING"
  | "INTEGRITY_SCHEMA_INVALID"
  | "REPLAY_HASH_NONREPRODUCIBLE"
  | "EXECUTION_HASH_NONREPRODUCIBLE"
  | "PLANNING_HASH_NONREPRODUCIBLE"
  | "DECISION_HASH_NONREPRODUCIBLE"
  | "ORCHESTRATION_HASH_NONREPRODUCIBLE"
  | "SUPERVISION_HASH_NONREPRODUCIBLE"
  | "INTERVENTION_HASH_NONREPRODUCIBLE"
  | "HASH_CHAIN_NONDETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "LINEAGE_HASH_NONREPRODUCIBLE"
  | "IMMUTABLE_IDENTIFIERS_MODIFIED"
  | "TAMPERING_UNDETECTED"
  | "CORRUPTION_UNDETECTED"
  | "UNAUTHORIZED_MODIFICATION_ACCEPTED"
  | "DELETED_HISTORY_ACCEPTED"
  | "ORPHANED_CHAIN_ACCEPTED"
  | "REPLAY_ALTERATION_ACCEPTED"
  | "ORDERING_MUTATION_ACCEPTED"
  | "CONSTITUTIONAL_REFERENCE_LOST"
  | "GOVERNANCE_REFERENCE_LOST"
  | "VERIFICATION_NONREPRODUCIBLE"
  | "CONFIDENCE_NONREPRODUCIBLE"
  | "REPAIR_RECOMMENDATIONS_NONDETERMINISTIC"
  | "TENANT_ISOLATION_BROKEN"
  | "CROSS_TENANT_HASH_LINKAGE_ACCEPTED"
  | "FAIL_CLOSED_BYPASSED"
  | "AUTONOMOUS_EXECUTION_MODIFIED_HISTORY";

export type IntegrityCertificationFailure =
  | "MINOR_REPORTING_GAP"
  | "INTEGRITY_CONTRACT_NOT_CERTIFIED"
  | "INTEGRITY_SCHEMA_NOT_CERTIFIED"
  | "REPLAY_HASH_NOT_CERTIFIED"
  | "EXECUTION_HASH_NOT_CERTIFIED"
  | "PLANNING_HASH_NOT_CERTIFIED"
  | "DECISION_HASH_NOT_CERTIFIED"
  | "ORCHESTRATION_HASH_NOT_CERTIFIED"
  | "SUPERVISION_HASH_NOT_CERTIFIED"
  | "INTERVENTION_HASH_NOT_CERTIFIED"
  | "HASH_CHAIN_NOT_CERTIFIED"
  | "REPLAY_RECONSTRUCTION_NOT_CERTIFIED"
  | "LINEAGE_NOT_CERTIFIED"
  | "IMMUTABLE_IDENTIFIERS_NOT_CERTIFIED"
  | "TAMPER_DETECTION_NOT_CERTIFIED"
  | "CORRUPTION_DETECTION_NOT_CERTIFIED"
  | "UNAUTHORIZED_MODIFICATION_NOT_CERTIFIED"
  | "DELETED_HISTORY_NOT_CERTIFIED"
  | "ORPHANED_CHAIN_NOT_CERTIFIED"
  | "REPLAY_ALTERATION_NOT_CERTIFIED"
  | "DETERMINISTIC_ORDERING_NOT_CERTIFIED"
  | "CONSTITUTIONAL_INTEGRITY_NOT_CERTIFIED"
  | "GOVERNANCE_INTEGRITY_NOT_CERTIFIED"
  | "VERIFICATION_NOT_DETERMINISTIC"
  | "CONFIDENCE_NOT_DETERMINISTIC"
  | "REPAIR_RECOMMENDATIONS_NOT_DETERMINISTIC"
  | "TENANT_ISOLATION_NOT_CERTIFIED"
  | "CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED"
  | "FAIL_CLOSED_NOT_CERTIFIED"
  | "AUTONOMOUS_HISTORY_IMMUTABILITY_NOT_CERTIFIED"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE";

export type IntegrityCertificationCategory =
  | "CONTRACT"
  | "CRYPTOGRAPHIC"
  | "HASH_CHAIN"
  | "TAMPER_DETECTION"
  | "REPLAY"
  | "LINEAGE"
  | "GOVERNANCE"
  | "CONSTITUTIONAL"
  | "TENANT"
  | "VERIFICATION"
  | "FAIL_CLOSED"
  | "IMMUTABILITY"
  | "VISIBILITY";

export type IntegrityCertificationTestResult = Readonly<{
  test_id: string;
  category: IntegrityCertificationCategory;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: IntegrityCertificationFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type IntegrityCertificationMetrics = Readonly<{
  integrity_score: number;
  replay_confidence: number;
  verification_confidence: number;
  hash_reproducibility_score: number;
  lineage_completeness_score: number;
  governance_integrity_score: number;
  tenant_isolation_score: number;
  metrics_hash: string;
}>;

export type IntegrityCertificationEvidence = Readonly<{
  evidence_id: string;
  verification_report_hash: string;
  verification_evidence_hash: string;
  source_integrity_hash: string;
  hash_chain_terminal_hash: string;
  tamper_forensic_hash: string;
  replay_reference: string;
  lineage_reference: string;
  result_hashes: readonly string[];
  evidence_hash: string;
}>;

export type IntegrityCertificationRecord = Readonly<{
  certification_id: string;
  phase: "8H.5";
  integrity_contract: Readonly<{ status: "PASS" | "FAIL" }>;
  hash_chain: Readonly<{ status: "PASS" | "FAIL" }>;
  replay_verification: Readonly<{ status: "PASS" | "FAIL" }>;
  tamper_detection: Readonly<{ status: "PASS" | "FAIL" }>;
  lineage_verification: Readonly<{ status: "PASS" | "FAIL" }>;
  governance_verification: Readonly<{ status: "PASS" | "FAIL" }>;
  constitutional_verification: Readonly<{ status: "PASS" | "FAIL" }>;
  tenant_isolation: Readonly<{ status: "PASS" | "FAIL" }>;
  confidence_score: number;
  certification_state: IntegrityCertificationState;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type IntegrityCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "8H.5";
  schema_version: "integrity-certification-gate/v8H.5";
  certification_timestamp: string;
  integrity_framework_version: "autonomy-integrity-framework/v8H";
  certification_state: IntegrityCertificationState;
  integrity_state: IntegrityState;
  verification_report: IntegrityVerificationReport;
  certification_tests: readonly IntegrityCertificationTestResult[];
  mandatory_tests_passed: boolean;
  optional_tests_passed: boolean;
  failed_tests: readonly IntegrityCertificationTestResult[];
  detected_findings: readonly IntegrityCertificationFailure[];
  certification_metrics: IntegrityCertificationMetrics;
  certification_evidence: IntegrityCertificationEvidence;
  certification_record: IntegrityCertificationRecord;
  truth_ledger_certification_reference: string;
  governance_notifications: readonly string[];
  operator_approval_status: "APPROVED_FOR_PRODUCTION" | "APPROVED_FOR_STAGING" | "BLOCKED";
  operator_explanation: string;
  downstream_mission_control_enabled: boolean;
  certification_signature: string;
  report_hash: string;
}>;

export type IntegrityCertificationInput = Readonly<{
  scenario?: IntegrityCertificationScenario;
  verification_scenario?: IntegrityVerificationScenario;
  verification_report?: IntegrityVerificationReport;
}>;

export type IntegrityCertificationValidationResult = Readonly<{
  certification_id: string | null;
  validation_state: "VALID" | "INVALID";
  certified: boolean;
  mandatory_tests_passed: boolean;
  evidence_complete: boolean;
  report_hash_valid: boolean;
  failures: readonly IntegrityCertificationFailure[];
  validation_hash: string;
}>;

export type IntegrityCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: IntegrityCertificationState;
  integrity_state: IntegrityState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  mandatory_tests_passed: boolean;
  confidence_score: number;
  failures: readonly IntegrityCertificationFailure[];
  operator_approval_status: IntegrityCertificationReport["operator_approval_status"];
  downstream_mission_control_enabled: boolean;
  truth_ledger_certification_reference: string;
}>;
