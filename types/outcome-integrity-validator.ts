import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeLineageMapperResult } from "@/types/outcome-lineage-mapper";

export type OutcomeIntegrityValidationState = "PENDING" | "VALID" | "WARNING" | "FAILED" | "CERTIFIED";

export type IntegrityValidationCategory =
  | "SCHEMA"
  | "REFERENCE"
  | "IDENTITY"
  | "EVIDENCE"
  | "REPLAY"
  | "LEDGER"
  | "LINEAGE"
  | "TENANT"
  | "HASH"
  | "CONSISTENCY";

export type IntegritySeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type OutcomeIntegrityCheck =
  | "LINEAGE_VALIDATION"
  | "SCHEMA_COMPLETENESS"
  | "REFERENCE_VALIDATION"
  | "IDENTITY_CONSISTENCY"
  | "EVIDENCE_INTEGRITY"
  | "REPLAY_INTEGRITY"
  | "TRUTH_LEDGER_INTEGRITY"
  | "LINEAGE_COMPLETENESS"
  | "TENANT_ISOLATION"
  | "HASH_VERIFICATION"
  | "CONSISTENCY_CHECK";

export type OutcomeIntegrityFailure =
  | "LINEAGE_NOT_VALIDATED"
  | "SCHEMA_VIOLATION_REJECTED"
  | "MISSING_REFERENCE_REJECTED"
  | "UNKNOWN_IDENTITY_REJECTED"
  | "MISSING_EVIDENCE_REJECTED"
  | "BROKEN_LINEAGE_REJECTED"
  | "REPLAY_MISMATCH_REJECTED"
  | "MISSING_TRUTH_LEDGER_REFERENCE_REJECTED"
  | "CROSS_TENANT_REFERENCE_REJECTED"
  | "HASH_MISMATCH_REJECTED"
  | "CONSISTENCY_CHECK_FAILED"
  | "READ_ONLY_VALIDATION_VIOLATED"
  | "EVIDENCE_AUTHENTICITY_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_VERIFICATION_BYPASSED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_INTEGRITY_VALIDATION_BEHAVIOR";

export type IntegrityValidationResult = Readonly<{
  result_id: string;
  validation_category: IntegrityValidationCategory;
  validation_status: "PASS" | "FAIL";
  validation_reason: string;
  affected_reference: string;
  severity: IntegritySeverity;
  remediation_required: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type HashVerificationRecord = Readonly<{
  verification_id: string;
  normalized_outcome_id: string;
  hash_algorithm: "sha256";
  expected_hash: string;
  calculated_hash: string;
  verification_status: "PASS" | "FAIL";
  verification_timestamp: string;
  integrity_hash: string;
}>;

export type OutcomeIntegrityValidation = Readonly<{
  validation_id: string;
  normalized_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  validation_version: "10.2.5";
  schema_validation: "PASS" | "FAIL";
  reference_validation: "PASS" | "FAIL";
  identity_validation: "PASS" | "FAIL";
  evidence_validation: "PASS" | "FAIL";
  replay_validation: "PASS" | "FAIL";
  ledger_validation: "PASS" | "FAIL";
  lineage_validation: "PASS" | "FAIL";
  tenant_validation: "PASS" | "FAIL";
  hash_validation: "PASS" | "FAIL";
  overall_validation_state: OutcomeIntegrityValidationState;
  validation_timestamp: string;
  replay_refs: readonly string[];
  failures: readonly OutcomeIntegrityFailure[];
  integrity_hash: string;
}>;

export type IntegrityConsistencyReport = Readonly<{
  report_id: string;
  identities_consistent: boolean;
  lineage_consistent: boolean;
  references_consistent: boolean;
  evidence_consistent: boolean;
  replay_consistent: boolean;
  truth_ledger_consistent: boolean;
  governance_consistent: boolean;
  certification_consistent: boolean;
  global_integrity_status: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type OutcomeIntegrityReplayReport = Readonly<{
  replay_report_id: string;
  validation_hash: string;
  result_hashes: readonly string[];
  hash_verification_hashes: readonly string[];
  consistency_hash: string;
  replay_reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  integrity_hash: string;
}>;

export type OutcomeIntegrityApiSurface = Readonly<{
  api_id: string;
  validate_outcome_integrity: "POST /integrity/validate";
  verify_hashes: "POST /integrity/hash/verify";
  validate_references: "POST /integrity/references";
  retrieve_validation_report: "GET /integrity/{normalized_outcome_id}";
  retrieve_hash_verification: "GET /integrity/{normalized_outcome_id}/hashes";
  read_only: true;
  repair_supported: false;
  update_supported: false;
  delete_supported: false;
  integrity_hash: string;
}>;

export type OutcomeIntegrityMetrics = Readonly<{
  metrics_id: string;
  validations_executed: number;
  validation_success_rate: number;
  schema_failures: number;
  reference_failures: number;
  evidence_failures: number;
  replay_failures: number;
  lineage_failures: number;
  hash_mismatches: number;
  tenant_violations: number;
  validation_latency_ms: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeIntegrityAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeIntegrityCheck[];
  integrity_validator_operational: boolean;
  hash_verification_engine_operational: boolean;
  reference_validator_operational: boolean;
  consistency_checker_operational: boolean;
  schema_completeness_verified: boolean;
  truth_ledger_integrity_verified: boolean;
  lineage_completeness_verified: boolean;
  read_only_validation_preserved: boolean;
  adaptive_intelligence_eligible: boolean;
  failure_analysis: readonly OutcomeIntegrityFailure[];
  certification_decision: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type OutcomeIntegrityValidatorInput = Readonly<{
  lineage_mapper?: OutcomeLineageMapperResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "SCHEMA_VIOLATION"
    | "MISSING_REFERENCE"
    | "UNKNOWN_IDENTITY"
    | "MISSING_EVIDENCE"
    | "BROKEN_LINEAGE"
    | "REPLAY_MISMATCH"
    | "MISSING_TRUTH_LEDGER"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "CONSISTENCY_FAILURE"
    | "READ_ONLY_VIOLATION"
    | "EVIDENCE_AUTHENTICITY_FAILURE"
    | "INTEGRITY_BYPASS"
    | "INVALID_LINEAGE"
    | "FAIL_OPEN";
}>;

export type OutcomeIntegrityValidatorResult = Readonly<{
  outcome_integrity_validator_version: "outcome-integrity-validator/v1";
  lineage_mapper: OutcomeLineageMapperResult;
  api_surface: OutcomeIntegrityApiSurface;
  validation: OutcomeIntegrityValidation;
  validation_results: readonly IntegrityValidationResult[];
  hash_verifications: readonly HashVerificationRecord[];
  consistency_report: IntegrityConsistencyReport;
  replay_report: OutcomeIntegrityReplayReport;
  metrics: OutcomeIntegrityMetrics;
  audit_report: OutcomeIntegrityAuditReport;
  deterministic: true;
  replayable: true;
  read_only: true;
  repairs_records: false;
  modifies_normalized_outcomes: false;
  modifies_lineage: false;
  modifies_truth_ledger: false;
  changes_evidence: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeIntegrityValidatorFoundation = Readonly<{
  outcome_integrity_validator_version: "outcome-integrity-validator/v1";
  checks: readonly OutcomeIntegrityCheck[];
  api_surface: OutcomeIntegrityApiSurface;
  result: OutcomeIntegrityValidatorResult;
}>;
