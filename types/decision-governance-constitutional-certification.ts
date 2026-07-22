import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { ReplayReconstructionCertificationResult } from "@/types/decision-replay-reconstruction-certification";

export type GovernanceCertificationScope =
  | "INTAKE"
  | "CONTEXT_CONSTRUCTION"
  | "DEPENDENCY_ANALYSIS"
  | "CONFLICT_ARBITRATION"
  | "PRIORITIZATION"
  | "DECISION_PACKAGING"
  | "OPERATOR_WORKFLOW"
  | "REPLAY"
  | "CERTIFICATION";

export type GovernanceCertificationCheck =
  | "POLICY_ENFORCEMENT"
  | "CONSTITUTIONAL_COMPLIANCE"
  | "AUTHORITY_BOUNDARY"
  | "TENANT_ISOLATION"
  | "ADVISORY_ONLY"
  | "FAIL_CLOSED"
  | "GOVERNANCE_REPLAY"
  | "EVIDENCE_COMPLETENESS"
  | "INTEGRITY_VERIFICATION";

export type GovernanceCertificationState = "PASS" | "FAIL";

export type GovernanceConstitutionalCertificationFailure =
  | "REPLAY_RECONSTRUCTION_CERTIFICATION_INVALID"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION_PERMITTED"
  | "UNAUTHORIZED_AUTHORITY_ESCALATION"
  | "MISSING_REQUIRED_APPROVAL"
  | "POLICY_PRECEDENCE_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "CROSS_TENANT_DATA_EXPOSURE"
  | "REPLAY_GOVERNANCE_MISMATCH"
  | "MISSING_GOVERNANCE_EVIDENCE"
  | "MISSING_CONSTITUTIONAL_EVIDENCE"
  | "MISSING_AUTHORITY_VALIDATION"
  | "ADVISORY_ONLY_BOUNDARY_VIOLATION"
  | "AUTONOMOUS_EXECUTION_CAPABILITY"
  | "HIDDEN_EXECUTION_PATHWAY"
  | "FAIL_OPEN_BEHAVIOR"
  | "INTEGRITY_HASH_MISMATCH"
  | "GOVERNANCE_LINEAGE_CORRUPTION"
  | "UNDETECTED_POLICY_CONFLICT"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type GovernancePolicyValidationReport = Readonly<{
  policy_report_id: string;
  tenant_id: string;
  mission_id: string;
  evaluated_policies: readonly string[];
  policy_precedence: readonly string[];
  inherited_policies: readonly string[];
  mandatory_policies_enforced: boolean;
  policy_conflicts_detected: readonly string[];
  policy_conflicts_resolved: boolean;
  governance_decisions_logged: boolean;
  governance_lineage_ref: string;
  replay_ref: string;
  validation_state: GovernanceCertificationState;
  integrity_hash: string;
}>;

export type ConstitutionalValidationReport = Readonly<{
  constitutional_report_id: string;
  tenant_id: string;
  mission_id: string;
  evaluated_principles: readonly string[];
  mandatory_constraints_enforced: boolean;
  protected_boundaries_preserved: boolean;
  rule_precedence_enforced: boolean;
  violations_detected: readonly string[];
  violations_permitted: boolean;
  escalation_requirements_enforced: boolean;
  audit_trail_ref: string;
  replay_ref: string;
  validation_state: GovernanceCertificationState;
  integrity_hash: string;
}>;

export type AuthorityBoundaryReport = Readonly<{
  authority_report_id: string;
  tenant_id: string;
  mission_id: string;
  role_authorized: boolean;
  approvals_required: readonly string[];
  approvals_present: readonly string[];
  delegated_authority_valid: boolean;
  escalation_authority_valid: boolean;
  override_permissions_valid: boolean;
  separation_of_duties_enforced: boolean;
  restricted_actions_blocked: boolean;
  execution_authority_granted: boolean;
  replay_ref: string;
  validation_state: GovernanceCertificationState;
  integrity_hash: string;
}>;

export type TenantIsolationReport = Readonly<{
  tenant_report_id: string;
  tenant_id: string;
  mission_id: string;
  tenant_ownership_verified: boolean;
  resource_isolation_verified: boolean;
  decision_isolation_verified: boolean;
  evidence_isolation_verified: boolean;
  replay_isolation_verified: boolean;
  ledger_isolation_verified: boolean;
  cross_tenant_access_blocked: boolean;
  validation_state: GovernanceCertificationState;
  integrity_hash: string;
}>;

export type AdvisoryFailClosedReport = Readonly<{
  advisory_report_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_only_outputs: boolean;
  operator_approval_required: boolean;
  no_autonomous_execution: boolean;
  no_command_dispatch: boolean;
  no_hidden_execution_paths: boolean;
  missing_evidence_blocks_progression: boolean;
  invalid_policy_blocks_progression: boolean;
  unknown_authority_blocks_progression: boolean;
  replay_failure_blocks_progression: boolean;
  integrity_failure_blocks_progression: boolean;
  invalid_configuration_blocks_progression: boolean;
  validation_state: GovernanceCertificationState;
  integrity_hash: string;
}>;

export type GovernanceCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  governance_evidence_refs: readonly string[];
  constitutional_evidence_refs: readonly string[];
  authority_evidence_refs: readonly string[];
  isolation_evidence_refs: readonly string[];
  advisory_evidence_refs: readonly string[];
  fail_closed_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type GovernanceCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly GovernanceCertificationScope[];
  certified_checks: readonly GovernanceCertificationCheck[];
  governance_policy_assessment: GovernanceCertificationState;
  constitutional_compliance_results: GovernanceCertificationState;
  authority_boundary_assessment: GovernanceCertificationState;
  tenant_isolation_assessment: GovernanceCertificationState;
  advisory_only_verification: GovernanceCertificationState;
  fail_closed_validation: GovernanceCertificationState;
  replay_consistency_assessment: GovernanceCertificationState;
  integrity_verification: GovernanceCertificationState;
  failure_analysis: readonly GovernanceConstitutionalCertificationFailure[];
  certification_decision: GovernanceCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type GovernanceCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "GOVERNANCE_VALIDATED" | "CONSTITUTION_VALIDATED" | "AUTHORITY_VALIDATED" | "TENANT_ISOLATION_VALIDATED" | "ADVISORY_FAIL_CLOSED_VALIDATED" | "GOVERNANCE_CERTIFIED" | "GOVERNANCE_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: GovernanceCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  replay_certification_valid: boolean;
  governance_continuous: boolean;
  constitutional_compliant: boolean;
  authority_boundaries_enforced: boolean;
  approvals_complete: boolean;
  policy_precedence_valid: boolean;
  tenant_isolated: boolean;
  cross_tenant_data_blocked: boolean;
  governance_replay_consistent: boolean;
  governance_evidence_complete: boolean;
  constitutional_evidence_complete: boolean;
  authority_validation_complete: boolean;
  advisory_only: boolean;
  autonomous_execution_absent: boolean;
  hidden_execution_paths_absent: boolean;
  fail_closed: boolean;
  integrity_verified: boolean;
  governance_lineage_complete: boolean;
  policy_conflicts_detected: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly GovernanceConstitutionalCertificationFailure[];
  integrity_hash: string;
}>;

export type GovernanceConstitutionalCertificationInput = Readonly<{
  replay_certification?: ReplayReconstructionCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "REPLAY_INVALID"
    | "GOVERNANCE_BYPASS"
    | "CONSTITUTIONAL_VIOLATION"
    | "AUTHORITY_ESCALATION"
    | "MISSING_APPROVAL"
    | "POLICY_PRECEDENCE_FAILURE"
    | "TENANT_BREACH"
    | "CROSS_TENANT_EXPOSURE"
    | "REPLAY_GOVERNANCE_MISMATCH"
    | "MISSING_GOVERNANCE_EVIDENCE"
    | "MISSING_CONSTITUTIONAL_EVIDENCE"
    | "MISSING_AUTHORITY_VALIDATION"
    | "ADVISORY_BOUNDARY_VIOLATION"
    | "AUTONOMOUS_EXECUTION"
    | "HIDDEN_EXECUTION_PATHWAY"
    | "FAIL_OPEN"
    | "HASH_MISMATCH"
    | "LINEAGE_CORRUPTION"
    | "UNDETECTED_POLICY_CONFLICT"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type GovernanceConstitutionalCertificationResult = Readonly<{
  certification_version: "decision-governance-constitutional-certification/v1";
  replay_certification: ReplayReconstructionCertificationResult;
  policy_report: GovernancePolicyValidationReport;
  constitutional_report: ConstitutionalValidationReport;
  authority_report: AuthorityBoundaryReport;
  tenant_report: TenantIsolationReport;
  advisory_fail_closed_report: AdvisoryFailClosedReport;
  evidence_package: GovernanceCertificationEvidencePackage;
  governance_report: GovernanceCertificationReport;
  governance_ledger: readonly GovernanceCertificationLedgerEntry[];
  validation: GovernanceConstitutionalCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_governance_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalCertificationFoundation = Readonly<{
  certification_version: "decision-governance-constitutional-certification/v1";
  scopes: readonly GovernanceCertificationScope[];
  checks: readonly GovernanceCertificationCheck[];
  result: GovernanceConstitutionalCertificationResult;
}>;
