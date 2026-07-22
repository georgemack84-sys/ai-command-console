import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { ObservabilityDashboardCertificationResult } from "@/types/decision-observability-dashboard-certification";

export type SecurityBoundaryScope =
  | "TENANT_ISOLATION"
  | "CROSS_TENANT_PROTECTION"
  | "AUTHORITY_BOUNDARIES"
  | "GOVERNANCE_BOUNDARIES"
  | "CONSTITUTIONAL_BOUNDARIES"
  | "ADVISORY_ONLY"
  | "EXECUTION_PREVENTION"
  | "REPLAY_ISOLATION"
  | "LEDGER_ISOLATION"
  | "CERTIFICATION_ISOLATION";

export type SecurityBoundaryCheck =
  | "TENANT_OWNERSHIP"
  | "DATA_SEGREGATION"
  | "CROSS_TENANT_REJECTION"
  | "ROLE_AUTHORIZATION"
  | "DELEGATED_AUTHORITY"
  | "APPROVAL_AUTHORITY"
  | "OVERRIDE_AUTHORITY"
  | "GOVERNANCE_ENFORCEMENT"
  | "CONSTITUTIONAL_ENFORCEMENT"
  | "ADVISORY_EXECUTION_BOUNDARY"
  | "COMMAND_BLOCKING"
  | "SECURITY_REPLAY"
  | "INTEGRITY_VERIFICATION";

export type SecurityCertificationState = "PASS" | "FAIL";

export type SecurityBoundaryCertificationFailure =
  | "OBSERVABILITY_CERTIFICATION_INVALID"
  | "TENANT_LEAKAGE"
  | "CROSS_TENANT_ACCESS"
  | "CROSS_TENANT_REPLAY_CONTAMINATION"
  | "CROSS_TENANT_LEDGER_CONTAMINATION"
  | "UNAUTHORIZED_AUTHORITY_ESCALATION"
  | "ROLE_PRIVILEGE_ESCALATION"
  | "MISSING_APPROVAL_ENFORCEMENT"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_PRECEDENCE_FAILURE"
  | "HIDDEN_EXECUTION_PATHWAY"
  | "AUTONOMOUS_EXECUTION_CAPABILITY"
  | "SUCCESSFUL_COMMAND_EXECUTION"
  | "RUNTIME_PRIVILEGE_BYPASS"
  | "MISSING_AUDIT_RECORDS"
  | "BOUNDARY_REPLAY_MISMATCH"
  | "INTEGRITY_HASH_MISMATCH"
  | "HIDDEN_SECURITY_STATE"
  | "FAIL_OPEN_BOUNDARY_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type TenantIsolationValidationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  tenant_identity_enforced: boolean;
  data_isolated: boolean;
  decision_isolated: boolean;
  evidence_isolated: boolean;
  workflow_isolated: boolean;
  replay_isolated: boolean;
  ledger_isolated: boolean;
  certification_isolated: boolean;
  cross_tenant_requests_rejected: boolean;
  validation_state: SecurityCertificationState;
  integrity_hash: string;
}>;

export type AuthorityBoundaryValidationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  operator_authority_validated: boolean;
  governance_authority_validated: boolean;
  escalation_authority_validated: boolean;
  delegated_authority_limited: boolean;
  approval_authority_enforced: boolean;
  override_authority_enforced: boolean;
  separation_of_duties_enforced: boolean;
  validation_state: SecurityCertificationState;
  integrity_hash: string;
}>;

export type GovernanceBoundaryValidationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  policy_enforcement_active: boolean;
  governance_checkpoints_executed: boolean;
  mandatory_approvals_enforced: boolean;
  governance_escalation_enforced: boolean;
  compliance_requirements_enforced: boolean;
  policy_precedence_preserved: boolean;
  constitutional_constraints_enforced: boolean;
  constitutional_precedence_preserved: boolean;
  validation_state: SecurityCertificationState;
  integrity_hash: string;
}>;

export type AdvisoryExecutionBoundaryReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_only_outputs: boolean;
  execution_prohibited: boolean;
  autonomous_actions_prevented: boolean;
  operator_approval_required: boolean;
  command_execution_blocked: boolean;
  execution_api_restricted: boolean;
  runtime_privileges_restricted: boolean;
  unauthorized_workflows_rejected: boolean;
  execution_audit_logged: boolean;
  validation_state: SecurityCertificationState;
  integrity_hash: string;
}>;

export type SecurityReplayBoundaryReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  boundary_replay_deterministic: boolean;
  security_replay_reproducible: boolean;
  tenant_isolation_replay_verified: boolean;
  replay_scope_isolated: boolean;
  ledger_scope_isolated: boolean;
  integrity_hashes_reproducible: boolean;
  validation_state: SecurityCertificationState;
  integrity_hash: string;
}>;

export type SecurityBoundaryEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  isolation_evidence_refs: readonly string[];
  authority_evidence_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  constitutional_evidence_refs: readonly string[];
  execution_prevention_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  audit_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type SecurityBoundaryCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly SecurityBoundaryScope[];
  certified_checks: readonly SecurityBoundaryCheck[];
  tenant_isolation_assessment: SecurityCertificationState;
  cross_tenant_protection_assessment: SecurityCertificationState;
  authority_boundary_assessment: SecurityCertificationState;
  governance_boundary_assessment: SecurityCertificationState;
  constitutional_boundary_assessment: SecurityCertificationState;
  advisory_only_assessment: SecurityCertificationState;
  execution_prevention_assessment: SecurityCertificationState;
  security_replay_assessment: SecurityCertificationState;
  integrity_verification: SecurityCertificationState;
  failure_analysis: readonly SecurityBoundaryCertificationFailure[];
  certification_decision: SecurityCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type SecurityBoundaryCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "ISOLATION_VALIDATED" | "AUTHORITY_VALIDATED" | "GOVERNANCE_VALIDATED" | "EXECUTION_BOUNDARY_VALIDATED" | "SECURITY_REPLAY_VALIDATED" | "SECURITY_CERTIFIED" | "SECURITY_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: SecurityCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type SecurityBoundaryCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  observability_certification_valid: boolean;
  tenant_isolation_valid: boolean;
  cross_tenant_access_blocked: boolean;
  cross_tenant_replay_blocked: boolean;
  cross_tenant_ledger_blocked: boolean;
  authority_boundaries_enforced: boolean;
  role_authorization_deterministic: boolean;
  approvals_enforced: boolean;
  governance_boundaries_enforced: boolean;
  constitutional_boundaries_enforced: boolean;
  advisory_only: boolean;
  autonomous_execution_prevented: boolean;
  command_execution_blocked: boolean;
  runtime_privileges_restricted: boolean;
  audit_trail_complete: boolean;
  boundary_replay_deterministic: boolean;
  integrity_verified: boolean;
  hidden_security_state_absent: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly SecurityBoundaryCertificationFailure[];
  integrity_hash: string;
}>;

export type SecurityBoundaryCertificationInput = Readonly<{
  observability_certification?: ObservabilityDashboardCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "OBSERVABILITY_INVALID"
    | "TENANT_LEAKAGE"
    | "CROSS_TENANT_ACCESS"
    | "CROSS_TENANT_REPLAY"
    | "CROSS_TENANT_LEDGER"
    | "AUTHORITY_ESCALATION"
    | "ROLE_PRIVILEGE_ESCALATION"
    | "MISSING_APPROVAL"
    | "GOVERNANCE_BYPASS"
    | "CONSTITUTIONAL_VIOLATION"
    | "POLICY_PRECEDENCE_FAILURE"
    | "HIDDEN_EXECUTION_PATHWAY"
    | "AUTONOMOUS_EXECUTION"
    | "COMMAND_EXECUTED"
    | "RUNTIME_PRIVILEGE_BYPASS"
    | "MISSING_AUDIT"
    | "BOUNDARY_REPLAY_MISMATCH"
    | "HASH_MISMATCH"
    | "HIDDEN_SECURITY_STATE"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type SecurityBoundaryCertificationResult = Readonly<{
  certification_version: "decision-security-isolation-boundary-certification/v1";
  observability_certification: ObservabilityDashboardCertificationResult;
  tenant_isolation_report: TenantIsolationValidationReport;
  authority_boundary_report: AuthorityBoundaryValidationReport;
  governance_boundary_report: GovernanceBoundaryValidationReport;
  advisory_execution_report: AdvisoryExecutionBoundaryReport;
  security_replay_report: SecurityReplayBoundaryReport;
  evidence_package: SecurityBoundaryEvidencePackage;
  security_report: SecurityBoundaryCertificationReport;
  security_ledger: readonly SecurityBoundaryCertificationLedgerEntry[];
  validation: SecurityBoundaryCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_security_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SecurityBoundaryCertificationFoundation = Readonly<{
  certification_version: "decision-security-isolation-boundary-certification/v1";
  scopes: readonly SecurityBoundaryScope[];
  checks: readonly SecurityBoundaryCheck[];
  result: SecurityBoundaryCertificationResult;
}>;
