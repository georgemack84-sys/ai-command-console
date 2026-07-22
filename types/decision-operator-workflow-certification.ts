import type { DecisionIntelligenceCertificationResult } from "@/types/decision-intelligence-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OperatorWorkflowScope =
  | "APPROVAL_WORKFLOW"
  | "REJECTION_WORKFLOW"
  | "OVERRIDE_WORKFLOW"
  | "DEFERRAL_WORKFLOW"
  | "ESCALATION_WORKFLOW"
  | "OPERATOR_HISTORY"
  | "WORKFLOW_REPLAY";

export type OperatorWorkflowCheck =
  | "OPERATOR_SUPREMACY"
  | "APPROVAL_INTEGRITY"
  | "REJECTION_INTEGRITY"
  | "OVERRIDE_AUDITABILITY"
  | "DEFERRAL_CONTINUITY"
  | "ESCALATION_VALIDITY"
  | "HISTORY_COMPLETENESS"
  | "REPLAY_DETERMINISM"
  | "AUTHORITY_ENFORCEMENT"
  | "INTEGRITY_VERIFICATION";

export type OperatorWorkflowCertificationState = "PASS" | "FAIL";

export type OperatorWorkflowCertificationFailure =
  | "DECISION_INTELLIGENCE_CERTIFICATION_INVALID"
  | "MISSING_REQUIRED_APPROVAL"
  | "UNAUTHORIZED_APPROVAL"
  | "UNAUTHORIZED_REJECTION"
  | "UNAUTHORIZED_OVERRIDE"
  | "MISSING_OVERRIDE_JUSTIFICATION"
  | "ORIGINAL_RECOMMENDATION_MODIFIED_OR_LOST"
  | "UNAUTHORIZED_DEFERRAL"
  | "UNAUTHORIZED_ESCALATION"
  | "INCORRECT_ESCALATION_ROUTING"
  | "MISSING_OPERATOR_HISTORY"
  | "INCOMPLETE_WORKFLOW_RECONSTRUCTION"
  | "WORKFLOW_REPLAY_MISMATCH"
  | "INVALID_STATE_TRANSITION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "CROSS_TENANT_WORKFLOW_CONTAMINATION"
  | "HIDDEN_OPERATOR_ACTION"
  | "MUTABLE_AUDIT_HISTORY"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_WORKFLOW_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type WorkflowValidationReport = Readonly<{
  workflow_report_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_states: readonly string[];
  state_transitions: readonly string[];
  final_workflow_state: string;
  approval_workflow_valid: boolean;
  rejection_workflow_valid: boolean;
  override_workflow_valid: boolean;
  deferral_workflow_valid: boolean;
  escalation_workflow_valid: boolean;
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  authority_bound: boolean;
  validation_state: OperatorWorkflowCertificationState;
  integrity_hash: string;
}>;

export type ApprovalValidationReport = Readonly<{
  approval_report_id: string;
  tenant_id: string;
  mission_id: string;
  approval_requirements: readonly string[];
  approval_routing: readonly string[];
  required_approvers: readonly string[];
  approvals_present: readonly string[];
  approval_timestamps: readonly string[];
  approval_lineage_ref: string;
  approval_replay_ref: string;
  approval_authority_valid: boolean;
  multi_stage_approvals_reproduced: boolean;
  validation_state: OperatorWorkflowCertificationState;
  integrity_hash: string;
}>;

export type OverrideAuditReport = Readonly<{
  override_report_id: string;
  tenant_id: string;
  mission_id: string;
  override_authorized: boolean;
  override_justification_ref: string;
  original_recommendation_ref: string;
  final_recommendation_ref: string;
  override_history_refs: readonly string[];
  governance_review_ref: string;
  constitutional_review_ref: string;
  override_lineage_ref: string;
  replay_consistent: boolean;
  validation_state: OperatorWorkflowCertificationState;
  integrity_hash: string;
}>;

export type OperatorHistoryReport = Readonly<{
  history_report_id: string;
  tenant_id: string;
  mission_id: string;
  operator_identity_refs: readonly string[];
  action_chronology: readonly string[];
  approval_history_refs: readonly string[];
  rejection_history_refs: readonly string[];
  override_history_refs: readonly string[];
  deferral_history_refs: readonly string[];
  escalation_history_refs: readonly string[];
  audit_lineage_ref: string;
  immutable: boolean;
  validation_state: OperatorWorkflowCertificationState;
  integrity_hash: string;
}>;

export type WorkflowReplayReport = Readonly<{
  replay_report_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_reconstruction_complete: boolean;
  state_transitions_reproduced: boolean;
  approval_replay_valid: boolean;
  override_replay_valid: boolean;
  escalation_replay_valid: boolean;
  deferral_replay_valid: boolean;
  final_state_reproduced: boolean;
  replay_lineage_ref: string;
  validation_state: OperatorWorkflowCertificationState;
  integrity_hash: string;
}>;

export type OperatorWorkflowEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  approval_evidence_refs: readonly string[];
  rejection_evidence_refs: readonly string[];
  override_evidence_refs: readonly string[];
  deferral_evidence_refs: readonly string[];
  escalation_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  history_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type OperatorWorkflowCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly OperatorWorkflowScope[];
  certified_checks: readonly OperatorWorkflowCheck[];
  workflow_validation_results: OperatorWorkflowCertificationState;
  approval_assessment: OperatorWorkflowCertificationState;
  rejection_assessment: OperatorWorkflowCertificationState;
  override_assessment: OperatorWorkflowCertificationState;
  deferral_assessment: OperatorWorkflowCertificationState;
  escalation_assessment: OperatorWorkflowCertificationState;
  operator_history_assessment: OperatorWorkflowCertificationState;
  workflow_replay_assessment: OperatorWorkflowCertificationState;
  governance_compliance: OperatorWorkflowCertificationState;
  authority_boundary_assessment: OperatorWorkflowCertificationState;
  integrity_verification: OperatorWorkflowCertificationState;
  failure_analysis: readonly OperatorWorkflowCertificationFailure[];
  certification_decision: OperatorWorkflowCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type OperatorWorkflowLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "WORKFLOW_VALIDATED" | "APPROVAL_VALIDATED" | "OVERRIDE_AUDITED" | "HISTORY_VALIDATED" | "REPLAY_VALIDATED" | "OPERATOR_WORKFLOW_CERTIFIED" | "OPERATOR_WORKFLOW_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: OperatorWorkflowCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OperatorWorkflowCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  intelligence_certification_valid: boolean;
  required_approvals_present: boolean;
  approvals_authorized: boolean;
  rejections_authorized: boolean;
  overrides_authorized: boolean;
  override_justification_present: boolean;
  original_recommendation_preserved: boolean;
  deferrals_authorized: boolean;
  escalations_authorized: boolean;
  escalation_routing_correct: boolean;
  operator_history_complete: boolean;
  workflow_reconstruction_complete: boolean;
  workflow_replay_consistent: boolean;
  state_transitions_valid: boolean;
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  authority_boundaries_enforced: boolean;
  tenant_isolated: boolean;
  hidden_actions_absent: boolean;
  audit_history_immutable: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly OperatorWorkflowCertificationFailure[];
  integrity_hash: string;
}>;

export type OperatorWorkflowCertificationInput = Readonly<{
  intelligence_certification?: DecisionIntelligenceCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "INTELLIGENCE_INVALID"
    | "MISSING_APPROVAL"
    | "UNAUTHORIZED_APPROVAL"
    | "UNAUTHORIZED_REJECTION"
    | "UNAUTHORIZED_OVERRIDE"
    | "MISSING_OVERRIDE_JUSTIFICATION"
    | "ORIGINAL_RECOMMENDATION_LOST"
    | "UNAUTHORIZED_DEFERRAL"
    | "UNAUTHORIZED_ESCALATION"
    | "INCORRECT_ESCALATION_ROUTING"
    | "MISSING_OPERATOR_HISTORY"
    | "INCOMPLETE_RECONSTRUCTION"
    | "REPLAY_MISMATCH"
    | "INVALID_STATE_TRANSITION"
    | "GOVERNANCE_BYPASS"
    | "CONSTITUTIONAL_VIOLATION"
    | "AUTHORITY_BOUNDARY_VIOLATION"
    | "CROSS_TENANT"
    | "HIDDEN_OPERATOR_ACTION"
    | "MUTABLE_AUDIT_HISTORY"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type OperatorWorkflowCertificationResult = Readonly<{
  certification_version: "decision-operator-workflow-certification/v1";
  intelligence_certification: DecisionIntelligenceCertificationResult;
  workflow_report: WorkflowValidationReport;
  approval_report: ApprovalValidationReport;
  override_report: OverrideAuditReport;
  history_report: OperatorHistoryReport;
  replay_report: WorkflowReplayReport;
  evidence_package: OperatorWorkflowEvidencePackage;
  workflow_certification_report: OperatorWorkflowCertificationReport;
  workflow_ledger: readonly OperatorWorkflowLedgerEntry[];
  validation: OperatorWorkflowCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_workflow_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperatorWorkflowCertificationFoundation = Readonly<{
  certification_version: "decision-operator-workflow-certification/v1";
  scopes: readonly OperatorWorkflowScope[];
  checks: readonly OperatorWorkflowCheck[];
  result: OperatorWorkflowCertificationResult;
}>;
