import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { RiskConfidenceActualizationRecorderResult } from "@/types/risk-confidence-actualization-recorder";

export type GovernanceOutcomeLifecycleState = "OBSERVED" | "CLASSIFIED" | "VALIDATED" | "RECORDED" | "REPLAYABLE";

export type GovernanceOutcomeState =
  | "APPROVED"
  | "DENIED"
  | "ESCALATED"
  | "REVIEW_REQUIRED"
  | "POLICY_EXCEPTION"
  | "CONSTITUTIONAL_REVIEW"
  | "ROLLBACK_AUTHORIZED"
  | "ROLLBACK_DENIED";

export type OperatorOutcomeState = "ACCEPTED" | "REJECTED" | "OVERRIDDEN" | "MODIFIED" | "DEFERRED" | "MANUAL_ACTION" | "NO_ACTION" | "UNKNOWN";

export type GovernanceOperatorCheck =
  | "ACTUALIZATION_VALIDATION"
  | "AUTHORITY_LINEAGE"
  | "GOVERNANCE_OUTCOME"
  | "OPERATOR_OUTCOME"
  | "APPROVAL_PATH"
  | "STRUCTURAL_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "OPERATOR_VALIDATION"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "LEDGER_IMMUTABILITY"
  | "TENANT_ISOLATION"
  | "CONSTITUTIONAL_GOVERNANCE";

export type GovernanceOperatorFailure =
  | "ACTUALIZATION_NOT_VALIDATED"
  | "GOVERNANCE_OUTCOME_ACCEPTED_WITHOUT_AUTHORITY_REFERENCES"
  | "OPERATOR_ACTION_ACCEPTED_WITHOUT_WORKFLOW_REFERENCES"
  | "APPROVAL_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "ROLLBACK_AUTHORIZATION_MISSING"
  | "INFERRED_GOVERNANCE_OUTCOME_ACCEPTED"
  | "INFERRED_OPERATOR_ACTION_ACCEPTED"
  | "REPLAY_RECONSTRUCTION_DIFFERS"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DUPLICATE_GOVERNANCE_RECORD_CREATED"
  | "TENANT_ISOLATION_VIOLATED"
  | "UNAUTHORIZED_AUTHORITY_REJECTED"
  | "HISTORICAL_GOVERNANCE_CHANGED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_GOVERNANCE_OPERATOR_BEHAVIOR";

export type AuthorityLineage = Readonly<{
  lineage_id: string;
  decision_ref: string;
  operator_ref: string;
  supervisor_refs: readonly string[];
  governance_authority_refs: readonly string[];
  constitution_engine_refs: readonly string[];
  certification_refs: readonly string[];
  replay_refs: readonly string[];
  delegation_chain_complete: boolean;
  authority_ownership_verified: boolean;
  integrity_hash: string;
}>;

export type ApprovalPathRecord = Readonly<{
  approval_path_id: string;
  approving_authority_refs: readonly string[];
  approval_sequence: readonly string[];
  approval_timestamps: readonly string[];
  delegated_authority_refs: readonly string[];
  approval_evidence_refs: readonly string[];
  approval_lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceOperatorClassification = Readonly<{
  classification_id: string;
  governance_decision: GovernanceOutcomeState;
  operator_action: OperatorOutcomeState;
  rollback_authorization: "AUTHORIZED" | "DENIED" | "NOT_REQUIRED" | "MISSING";
  policy_outcome: "ENFORCED" | "EXCEPTION" | "NOT_APPLICABLE";
  constitutional_outcome: "PRESERVED" | "REVIEWED" | "MISSING" | "BYPASSED";
  deterministic_classification: boolean;
  inferred_governance_absent: boolean;
  inferred_operator_absent: boolean;
  historical_governance_unchanged: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type GovernanceOutcomeRecord = Readonly<{
  governance_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  decision_id: string;
  decision_package_id: string;
  operator_workflow_id: string;
  governance_decision: GovernanceOutcomeState;
  operator_action: OperatorOutcomeState;
  approval_path: readonly string[];
  policy_outcome: string;
  constitutional_outcome: string;
  authority_refs: readonly string[];
  rollback_authorization: "AUTHORIZED" | "DENIED" | "NOT_REQUIRED" | "MISSING";
  governance_evidence_refs: readonly string[];
  operator_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  immutable_after_recording: true;
  integrity_hash: string;
}>;

export type GovernanceOperatorValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  structural_valid: boolean;
  authority_valid: boolean;
  governance_valid: boolean;
  operator_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  approval_path_complete: boolean;
  tenant_isolated: boolean;
  immutable_after_recording: boolean;
  constitutional_governance_preserved: boolean;
  observational_only: boolean;
  failures: readonly GovernanceOperatorFailure[];
  integrity_hash: string;
}>;

export type GovernanceOperatorReplayReport = Readonly<{
  replay_report_id: string;
  authority_lineage_hash: string;
  approval_path_hash: string;
  classification_hash: string;
  record_hash: string;
  reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  deterministic_serialization: boolean;
  historical_compatibility_preserved: boolean;
  integrity_hash: string;
}>;

export type GovernanceOperatorLedgerRecord = Readonly<{
  ledger_id: string;
  governance_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  lifecycle_state: GovernanceOutcomeLifecycleState;
  governance_decision: GovernanceOutcomeState;
  operator_action: OperatorOutcomeState;
  record_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type GovernanceOperatorMetrics = Readonly<{
  metrics_id: string;
  governance_outcomes_recorded: number;
  operator_outcomes_recorded: number;
  approvals_recorded: number;
  overrides_recorded: number;
  escalations_recorded: number;
  constitutional_reviews_recorded: number;
  rollback_authorizations_recorded: number;
  authority_lineage_completeness: number;
  replay_reconstruction_success_rate: number;
  processing_latency_ms: number;
  validation_failures_by_category: readonly GovernanceOperatorFailure[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernanceOperatorAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly GovernanceOperatorCheck[];
  governance_recorder_operational: boolean;
  operator_recorder_operational: boolean;
  approval_recorder_operational: boolean;
  authority_lineage_engine_operational: boolean;
  validation_engine_operational: boolean;
  replay_generator_operational: boolean;
  authority_lineage_preserved: boolean;
  governance_lineage_preserved: boolean;
  operator_lineage_preserved: boolean;
  policy_or_permission_mutation_absent: boolean;
  immutable_record_verified: boolean;
  failure_analysis: readonly GovernanceOperatorFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type GovernanceOperatorOutcomeRecorderInput = Readonly<{
  actualization_recorder?: RiskConfidenceActualizationRecorderResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "APPROVED"
    | "DENIED"
    | "ESCALATED"
    | "REVIEW_REQUIRED"
    | "POLICY_EXCEPTION"
    | "CONSTITUTIONAL_REVIEW"
    | "ROLLBACK_AUTHORIZED"
    | "ROLLBACK_DENIED"
    | "ACCEPTED"
    | "REJECTED"
    | "OVERRIDDEN"
    | "MODIFIED"
    | "DEFERRED"
    | "MANUAL_ACTION"
    | "NO_ACTION"
    | "UNKNOWN"
    | "MISSING_AUTHORITY"
    | "MISSING_OPERATOR_WORKFLOW"
    | "INCOMPLETE_APPROVAL_LINEAGE"
    | "MISSING_GOVERNANCE_LINEAGE"
    | "MISSING_CONSTITUTIONAL_REFS"
    | "MISSING_ROLLBACK_AUTHORIZATION"
    | "INFERRED_GOVERNANCE"
    | "INFERRED_OPERATOR"
    | "REPLAY_MISMATCH"
    | "INTEGRITY_FAILURE"
    | "DUPLICATE_RECORD"
    | "TENANT_VIOLATION"
    | "UNAUTHORIZED_AUTHORITY"
    | "HISTORICAL_CHANGE"
    | "FAIL_OPEN";
}>;

export type GovernanceOperatorOutcomeRecorderResult = Readonly<{
  governance_operator_outcome_recorder_version: "governance-operator-outcome-recorder/v1";
  actualization_recorder: RiskConfidenceActualizationRecorderResult;
  authority_lineage: AuthorityLineage;
  approval_path: ApprovalPathRecord;
  classification: GovernanceOperatorClassification;
  governance_outcome_record: GovernanceOutcomeRecord;
  validation: GovernanceOperatorValidation;
  replay_report: GovernanceOperatorReplayReport;
  governance_outcome_ledger: readonly GovernanceOperatorLedgerRecord[];
  metrics: GovernanceOperatorMetrics;
  audit_report: GovernanceOperatorAuditReport;
  lifecycle: readonly GovernanceOutcomeLifecycleState[];
  deterministic: true;
  replayable: true;
  observational_only: true;
  modifies_authority: false;
  modifies_governance_policy: false;
  modifies_operator_permissions: false;
  modifies_decision_outcomes: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceOperatorOutcomeRecorderFoundation = Readonly<{
  governance_operator_outcome_recorder_version: "governance-operator-outcome-recorder/v1";
  checks: readonly GovernanceOperatorCheck[];
  lifecycle: readonly GovernanceOutcomeLifecycleState[];
  result: GovernanceOperatorOutcomeRecorderResult;
}>;
