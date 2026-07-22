import type { AdaptiveSecuritySafetyBoundariesResult } from "@/types/adaptive-security-safety-boundaries";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptiveArchitectureCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type AdaptiveArchitectureValidationState = "PASS" | "FAIL";

export type AdaptiveArchitectureCertificationArea =
  | "CONTRACT_FOUNDATION"
  | "DOMAIN_BOUNDARY"
  | "LEARNING_PERMISSION"
  | "STATE_MACHINE"
  | "AUTHORITY_GOVERNANCE"
  | "REPLAY_TRACEABILITY"
  | "OPERATOR_APPROVAL"
  | "ADAPTIVE_LEDGER"
  | "SECURITY_SAFETY"
  | "PRODUCTION_READINESS";

export type AdaptiveArchitectureFailure =
  | "MANDATORY_TEST_FAILED"
  | "REPLAY_DIVERGED"
  | "GOVERNANCE_OMITTED"
  | "CONSTITUTIONAL_PROTECTION_WEAKENED"
  | "AUTHORITY_EXPANDED"
  | "DETERMINISTIC_FAILURE"
  | "ADVISORY_ONLY_VIOLATED"
  | "OPERATOR_APPROVAL_BYPASSED"
  | "TENANT_ISOLATION_COMPROMISED"
  | "HIDDEN_LEARNING_DETECTED"
  | "HIDDEN_MEMORY_DETECTED"
  | "SELF_MODIFICATION_DETECTED"
  | "UNAUTHORIZED_ADAPTATION_DETECTED"
  | "REPLAY_OMISSION"
  | "GOVERNANCE_BYPASS"
  | "IMMUTABLE_LEDGER_MUTATION"
  | "CERTIFICATION_EVIDENCE_INCONSISTENT"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "UNCERTIFIED_ADAPTIVE_DEPLOYMENT"
  | "PARTIAL_CERTIFICATION_ATTEMPTED"
  | "CERTIFICATION_FORGERY"
  | "HIDDEN_ARCHITECTURAL_CHANGE"
  | "UNAUTHORIZED_PRODUCTION_PROMOTION"
  | "EVIDENCE_TAMPERING"
  | "DOCUMENTATION_DEFICIENCY"
  | "REPORTING_DEFICIENCY"
  | "DASHBOARD_DEFICIENCY"
  | "VISUALIZATION_DEFICIENCY"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_CERTIFICATION_BEHAVIOR";

export type AdaptiveArchitectureCertificationTest = Readonly<{
  test_id: string;
  area: AdaptiveArchitectureCertificationArea;
  description: string;
  expected: AdaptiveArchitectureValidationState;
  actual: AdaptiveArchitectureValidationState;
  mandatory: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  architectural_compliance_report: string;
  replay_verification_report: string;
  governance_compliance_report: string;
  constitutional_compliance_report: string;
  authority_validation_report: string;
  operator_approval_validation_report: string;
  security_validation_report: string;
  ledger_integrity_report: string;
  production_readiness_report: string;
  immutable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveProductionReadinessReport = Readonly<{
  report_id: string;
  all_components_certified: boolean;
  mandatory_validations_passed: boolean;
  deterministic_replay_verified: boolean;
  governance_controls_active: boolean;
  constitutional_protections_enforced: boolean;
  authority_boundaries_immutable: boolean;
  operator_approval_mandatory: boolean;
  security_protections_operational: boolean;
  rollback_verified: boolean;
  certification_evidence_complete: boolean;
  production_ready: boolean;
  integrity_hash: string;
}>;

export type AdaptiveArchitectureCertification = Readonly<{
  certification_id: string;
  certification_version: string;
  tenant_id: string;
  mission_scope: readonly string[];
  architecture_version: "phase-10.0";
  certification_scope: readonly AdaptiveArchitectureCertificationArea[];
  certification_tests: readonly string[];
  passed_tests: readonly string[];
  failed_tests: readonly string[];
  replay_validation: AdaptiveArchitectureValidationState;
  governance_validation: AdaptiveArchitectureValidationState;
  constitutional_validation: AdaptiveArchitectureValidationState;
  authority_validation: AdaptiveArchitectureValidationState;
  operator_validation: AdaptiveArchitectureValidationState;
  security_validation: AdaptiveArchitectureValidationState;
  final_certification_state: AdaptiveArchitectureCertificationState;
  certification_report_ref: string;
  replay_refs: readonly string[];
  integrity_hash: string;
  certified_by: string;
  certification_timestamp: string;
}>;

export type AdaptiveCertificationLedgerRecord = Readonly<{
  record_id: string;
  certification_id: string;
  architecture_version: "phase-10.0";
  certification_state: AdaptiveArchitectureCertificationState;
  passed_tests: readonly string[];
  failed_tests: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  certification_report_ref: string;
  integrity_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
}>;

export type AdaptiveArchitectureCertificationDashboard = Readonly<{
  dashboard_id: string;
  certification_progress: number;
  certification_outcome: AdaptiveArchitectureCertificationState;
  passed_tests: number;
  failed_tests: number;
  replay_verification_status: AdaptiveArchitectureValidationState;
  governance_compliance: AdaptiveArchitectureValidationState;
  constitutional_compliance: AdaptiveArchitectureValidationState;
  authority_validation: AdaptiveArchitectureValidationState;
  security_validation: AdaptiveArchitectureValidationState;
  production_readiness: AdaptiveArchitectureValidationState;
  certification_history: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveArchitectureCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  scope: readonly AdaptiveArchitectureCertificationArea[];
  deterministic_architecture_verified: boolean;
  constitutional_compliance_verified: boolean;
  governance_enforcement_verified: boolean;
  authority_boundaries_verified: boolean;
  advisory_only_verified: boolean;
  replay_traceability_verified: boolean;
  operator_supremacy_verified: boolean;
  adaptive_security_verified: boolean;
  immutable_auditability_verified: boolean;
  production_readiness_verified: boolean;
  failure_analysis: readonly AdaptiveArchitectureFailure[];
  certification_decision: AdaptiveArchitectureCertificationState;
  phase_10_1_authorized: boolean;
  integrity_hash: string;
}>;

export type AdaptiveArchitectureCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  all_mandatory_tests_passed: boolean;
  replay_deterministic: boolean;
  governance_enforced: boolean;
  constitutional_protections_enforced: boolean;
  authority_expansion_impossible: boolean;
  advisory_only: boolean;
  operator_approval_mandatory: boolean;
  tenant_isolated: boolean;
  hidden_learning_absent: boolean;
  hidden_memory_absent: boolean;
  self_modification_absent: boolean;
  immutable_ledgers_preserved: boolean;
  evidence_consistent: boolean;
  integrity_verified: boolean;
  production_promotion_authorized: boolean;
  authorization_valid: boolean;
  failures: readonly AdaptiveArchitectureFailure[];
  integrity_hash: string;
}>;

export type AdaptiveArchitectureCertificationGateInput = Readonly<{
  security_boundaries?: AdaptiveSecuritySafetyBoundariesResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MANDATORY_TEST_FAILED"
    | "REPLAY_DIVERGED"
    | "GOVERNANCE_OMITTED"
    | "CONSTITUTIONAL_WEAKENED"
    | "AUTHORITY_EXPANDED"
    | "DETERMINISTIC_FAILURE"
    | "ADVISORY_ONLY_VIOLATION"
    | "OPERATOR_BYPASS"
    | "TENANT_FAILURE"
    | "HIDDEN_LEARNING"
    | "HIDDEN_MEMORY"
    | "SELF_MODIFICATION"
    | "UNAUTHORIZED_ADAPTATION"
    | "REPLAY_OMISSION"
    | "GOVERNANCE_BYPASS"
    | "LEDGER_MUTATION"
    | "EVIDENCE_INCONSISTENT"
    | "INTEGRITY_FAILURE"
    | "UNCERTIFIED_DEPLOYMENT"
    | "PARTIAL_CERTIFICATION"
    | "CERTIFICATION_FORGERY"
    | "HIDDEN_ARCHITECTURAL_CHANGE"
    | "UNAUTHORIZED_PRODUCTION_PROMOTION"
    | "EVIDENCE_TAMPERING"
    | "DOCUMENTATION_DEFICIENCY"
    | "REPORTING_DEFICIENCY"
    | "DASHBOARD_DEFICIENCY"
    | "VISUALIZATION_DEFICIENCY"
    | "FAIL_OPEN";
}>;

export type AdaptiveArchitectureCertificationGateResult = Readonly<{
  certification_gate_version: "adaptive-architecture-certification-gate/v1";
  security_boundaries: AdaptiveSecuritySafetyBoundariesResult;
  certification: AdaptiveArchitectureCertification;
  certification_tests: readonly AdaptiveArchitectureCertificationTest[];
  evidence_package: AdaptiveCertificationEvidencePackage;
  production_readiness_report: AdaptiveProductionReadinessReport;
  certification_ledger: readonly AdaptiveCertificationLedgerRecord[];
  dashboard: AdaptiveArchitectureCertificationDashboard;
  certification_report: AdaptiveArchitectureCertificationReport;
  validation: AdaptiveArchitectureCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  fail_closed: true;
  phase_10_1_authorized: boolean;
  permits_uncertified_deployment: false;
  permits_partial_certification: false;
  permits_execution: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveArchitectureCertificationGateFoundation = Readonly<{
  certification_gate_version: "adaptive-architecture-certification-gate/v1";
  scope: readonly AdaptiveArchitectureCertificationArea[];
  result: AdaptiveArchitectureCertificationGateResult;
}>;
