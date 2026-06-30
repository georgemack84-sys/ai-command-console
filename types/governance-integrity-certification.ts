import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceIntegrityVerificationReport, GovernanceIntegrityVerificationScenario } from "@/types/governance-integrity-verification";

export type GovernanceIntegrityCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type GovernanceIntegrityCertificationScenario =
  | "BASELINE"
  | "MINOR_REPORTING_GAP"
  | "INTEGRITY_CONTRACT_INVALID"
  | "SERIALIZATION_MISMATCH_ACCEPTED"
  | "CONTENT_HASH_MISMATCH_UNDETECTED"
  | "PREVIOUS_HASH_MISMATCH_ACCEPTED"
  | "ROOT_HASH_CORRUPTION_ACCEPTED"
  | "CHAIN_DELETION_ACCEPTED"
  | "CHAIN_REORDERING_ACCEPTED"
  | "LINEAGE_CORRUPTION_UNDETECTED"
  | "REPLAY_MISMATCH_ACCEPTED"
  | "TAMPERING_UNDETECTED"
  | "IMMUTABLE_IDENTITY_MODIFICATION_ACCEPTED"
  | "EVIDENCE_TAMPERING_UNDETECTED"
  | "CROSS_TENANT_LINKAGE_ACCEPTED"
  | "INCONSISTENT_VERIFICATION_ACCEPTED"
  | "UNKNOWN_STATE_ACCEPTED"
  | "MISSING_LEDGER_RECORD_ACCEPTED"
  | "OPERATOR_VISIBILITY_INCOMPLETE";

export type GovernanceIntegrityCertificationFailure =
  | "MINOR_REPORTING_GAP"
  | "INTEGRITY_CONTRACT_INVALID"
  | "CANONICAL_SERIALIZATION_NOT_CERTIFIED"
  | "HASH_MISMATCH_NOT_CERTIFIED"
  | "PREVIOUS_HASH_NOT_CERTIFIED"
  | "ROOT_HASH_NOT_CERTIFIED"
  | "CHAIN_INTEGRITY_NOT_CERTIFIED"
  | "LINEAGE_NOT_CERTIFIED"
  | "REPLAY_NOT_CERTIFIED"
  | "TAMPER_DETECTION_NOT_CERTIFIED"
  | "IDENTITY_PROTECTION_NOT_CERTIFIED"
  | "EVIDENCE_INTEGRITY_NOT_CERTIFIED"
  | "TENANT_ISOLATION_NOT_CERTIFIED"
  | "VERIFICATION_NOT_DETERMINISTIC"
  | "STATE_CLASSIFICATION_NOT_CERTIFIED"
  | "TRUTH_LEDGER_NOT_CERTIFIED"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE";

export type GovernanceIntegrityCertificationCategory =
  | "CONTRACT"
  | "SERIALIZATION"
  | "HASH"
  | "CHAIN"
  | "LINEAGE"
  | "REPLAY"
  | "TAMPER"
  | "IDENTITY"
  | "EVIDENCE"
  | "TENANT"
  | "VERIFICATION"
  | "CLASSIFICATION"
  | "TRUTH_LEDGER"
  | "VISIBILITY";

export type GovernanceIntegrityCertificationTestResult = Readonly<{
  test_id: string;
  category: GovernanceIntegrityCertificationCategory;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: GovernanceIntegrityCertificationFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type GovernanceIntegrityCertificationEvidence = Readonly<{
  evidence_id: string;
  verification_report_hash: string;
  source_chain_hash: string;
  tamper_report_hash: string;
  truth_ledger_record_id: string;
  replay_references: readonly string[];
  lineage_references: readonly string[];
  evidence_hash: string;
}>;

export type GovernanceIntegrityCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "7I.5";
  schema_version: "governance-integrity-certification/v7I.5";
  certification_timestamp: string;
  integrity_framework_version: "governance-integrity-framework/v7I";
  certification_state: GovernanceIntegrityCertificationState;
  integrity_state: GovernanceIntegrityState;
  verification_report: GovernanceIntegrityVerificationReport;
  certification_tests: readonly GovernanceIntegrityCertificationTestResult[];
  mandatory_tests_passed: boolean;
  optional_tests_passed: boolean;
  failed_tests: readonly GovernanceIntegrityCertificationTestResult[];
  detected_findings: readonly GovernanceIntegrityCertificationFailure[];
  certification_evidence: GovernanceIntegrityCertificationEvidence;
  truth_ledger_certification_reference: string;
  operator_approval_status: "APPROVED_FOR_PRODUCTION" | "APPROVED_FOR_STAGING" | "BLOCKED";
  operator_explanation: string;
  certification_signature: string;
  report_hash: string;
}>;

export type GovernanceIntegrityCertificationInput = Readonly<{
  scenario?: GovernanceIntegrityCertificationScenario;
  verification_scenario?: GovernanceIntegrityVerificationScenario;
  verification_report?: GovernanceIntegrityVerificationReport;
  tenant_id?: string;
  mission_id?: string;
  created_by?: string;
}>;

export type GovernanceIntegrityCertificationValidationResult = Readonly<{
  certification_id: string | null;
  validation_state: "VALID" | "INVALID";
  certified: boolean;
  mandatory_tests_passed: boolean;
  evidence_complete: boolean;
  report_hash_valid: boolean;
  failures: readonly GovernanceIntegrityCertificationFailure[];
  validation_hash: string;
}>;

export type GovernanceIntegrityCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: GovernanceIntegrityCertificationState;
  integrity_state: GovernanceIntegrityState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  mandatory_tests_passed: boolean;
  failures: readonly GovernanceIntegrityCertificationFailure[];
  operator_approval_status: GovernanceIntegrityCertificationReport["operator_approval_status"];
  truth_ledger_certification_reference: string;
}>;
