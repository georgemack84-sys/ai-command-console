export type OperatorApprovalDecision = "APPROVE" | "DENY" | "DEFER" | "ESCALATE" | "CANCEL";
export type WarningDispositionDecision = "ACKNOWLEDGED" | "ACCEPTED" | "REJECTED" | "ESCALATED" | "OVERRIDDEN" | "EXPIRED";
export type EscalationType = "AUTHORITY" | "SAFETY" | "POLICY" | "GOVERNANCE" | "OPERATOR" | "SYSTEM_TIMEOUT";
export type InteractionType = "EXECUTION_APPROVAL" | "WARNING_ACKNOWLEDGEMENT" | "SAFETY_ACKNOWLEDGEMENT" | "POLICY_ACKNOWLEDGEMENT" | "AUTHORITY_APPROVAL" | "INTERVENTION_REQUEST" | "ESCALATION_REVIEW" | "EXECUTION_CANCELLATION" | "OVERRIDE_REQUEST" | "EXECUTION_RESUME";
export type InteractionCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type ExecutionAdmissionState = "AUTHORIZED" | "PENDING_OPERATOR" | "ESCALATED" | "DENIED" | "FAIL_CLOSED";

export type HumanOperatorInteractionFailure =
  | "P3_0_AUTHORITY_MATRIX_INVALID"
  | "P3_7_GOVERNANCE_INVALID"
  | "P3_8_SAFETY_INVALID"
  | "INTERACTION_FRAMEWORK_DUPLICATED"
  | "APPROVAL_REQUIREMENT_NOT_RESOLVED"
  | "OPERATOR_APPROVAL_MISSING"
  | "OPERATOR_AUTHORITY_INVALID"
  | "APPROVAL_NON_DETERMINISTIC"
  | "WARNING_ACKNOWLEDGEMENT_MISSING"
  | "WARNING_DISPOSITION_NOT_REPLAYABLE"
  | "ESCALATION_ROUTING_INVALID"
  | "INTERVENTION_GOVERNANCE_INVALID"
  | "DECISION_PRESENTATION_INCOMPLETE"
  | "EXECUTION_SEQUENCE_REORDERED"
  | "EXECUTION_SEQUENCE_BYPASSED"
  | "ADMISSION_BEFORE_DISPOSITION"
  | "APPROVAL_EVIDENCE_MISSING"
  | "INTERACTION_REPLAY_DIVERGENCE"
  | "OBSERVABILITY_INCOMPLETE"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "CERTIFICATION_PRUNED";

export type HumanOperatorInteractionScenario = "BASELINE" | HumanOperatorInteractionFailure;
export type HumanOperatorInteractionInput = Readonly<{ scenario?: HumanOperatorInteractionScenario; tenant_id?: string }>;

export type InteractionSession = Readonly<{
  session_id: string;
  execution_request_id: string;
  interaction_types: readonly InteractionType[];
  lifecycle_state: "CREATED" | "PRESENTED" | "DECISION_CAPTURED" | "EVIDENCE_RECORDED" | "ADMISSION_PRODUCED" | "FAIL_CLOSED";
  exclusive_operator_layer: boolean;
  timeout_policy_ref: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionPresentation = Readonly<{
  presentation_id: string;
  execution_request_id: string;
  authority_requirement_ref: string;
  policy_result_ref: string;
  safety_result_ref: string;
  warning_refs: readonly string[];
  required_approval_refs: readonly string[];
  execution_consequence_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type OperatorApprovalRecord = Readonly<{
  approval_id: string;
  execution_request_id: string;
  operator_id: string;
  authority_role: string;
  approval_required: boolean;
  approval_decision: OperatorApprovalDecision;
  approval_reason: string;
  approval_timestamp: string;
  expiration: string;
  authority_verified: boolean;
  deterministic: boolean;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type WarningDispositionRecord = Readonly<{
  disposition_id: string;
  warning_id: string;
  warning_type: string;
  warning_source: "P3.7_AUTHORITY" | "P3.7_POLICY" | "P3.8_SAFETY";
  operator_response: WarningDispositionDecision;
  acknowledgement_required: boolean;
  acknowledgement_timestamp: string;
  escalation_required: boolean;
  escalation_status: "NOT_REQUIRED" | "ROUTED" | "PENDING" | "FAILED";
  replayable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type EscalationRequest = Readonly<{
  escalation_id: string;
  escalation_type: EscalationType;
  trigger_ref: string;
  route_ref: string;
  routed: boolean;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type InterventionRecord = Readonly<{
  intervention_id: string;
  request_ref: string;
  action: "PAUSE_EXECUTION" | "REQUEST_INTERVENTION" | "CAPTURE_OVERRIDE" | "EMERGENCY_INTERVENTION" | "AUTHORIZE_RESUME";
  operator_id: string;
  governed: boolean;
  resume_authorization_ref: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RuntimeExecutionSequence = Readonly<{
  sequence_id: string;
  steps: readonly string[];
  canonical_order_enforced: boolean;
  bypass_detected: boolean;
  parallelization_detected: boolean;
  admission_after_disposition: boolean;
  fail_closed_enforced: boolean;
  integrity_hash: string;
}>;

export type InteractionEvidenceLedger = Readonly<{
  ledger_id: string;
  approval_refs: readonly string[];
  acknowledgement_refs: readonly string[];
  escalation_refs: readonly string[];
  intervention_refs: readonly string[];
  presentation_refs: readonly string[];
  operator_decision_refs: readonly string[];
  immutable: boolean;
  auditable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type InteractionObservability = Readonly<{
  observability_id: string;
  metrics: readonly string[];
  complete: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type InteractionReplayValidation = Readonly<{
  replay_validation_id: string;
  presentation_replayed: boolean;
  approvals_replayed: boolean;
  acknowledgements_replayed: boolean;
  interventions_replayed: boolean;
  sequence_replayed: boolean;
  admission_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ExecutionAuthorizationRequest = Readonly<{
  authorization_id: string;
  execution_request_id: string;
  approval_ref: string;
  gate_result_ref: string;
  safety_gate_ref: string;
  warning_disposition_refs: readonly string[];
  admission_state: ExecutionAdmissionState;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type HumanOperatorInteractionCertification = Readonly<{
  certification_id: string;
  outcome: InteractionCertificationOutcome;
  certified: boolean;
  exclusive_interaction_framework: boolean;
  approval_deterministic: boolean;
  authority_compliant: boolean;
  warnings_acknowledged: boolean;
  escalation_routing_valid: boolean;
  intervention_governed: boolean;
  presentation_complete: boolean;
  canonical_sequence_enforced: boolean;
  evidence_integrity: boolean;
  replay_reproducible: boolean;
  observability_complete: boolean;
  fail_closed_enforced: boolean;
  failures: readonly HumanOperatorInteractionFailure[];
  integrity_hash: string;
}>;

export type HumanOperatorInteractionResult = Readonly<{
  phase_version: "caf-human-operator-interaction/v3.9";
  phase_identifier: "CafHumanOperatorInteraction";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8";
  interaction_session: InteractionSession;
  decision_presentation: DecisionPresentation;
  operator_approval: OperatorApprovalRecord;
  warning_dispositions: readonly WarningDispositionRecord[];
  escalation_request: EscalationRequest;
  intervention_record: InterventionRecord;
  runtime_execution_sequence: RuntimeExecutionSequence;
  execution_authorization: ExecutionAuthorizationRequest;
  evidence_ledger: InteractionEvidenceLedger;
  observability: InteractionObservability;
  replay_validation: InteractionReplayValidation;
  certification: HumanOperatorInteractionCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type HumanOperatorInteractionValidation = Readonly<{
  valid: boolean;
  outcome: InteractionCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  interaction_valid: boolean;
  approval_valid: boolean;
  warnings_valid: boolean;
  escalation_valid: boolean;
  intervention_valid: boolean;
  sequence_valid: boolean;
  authorization_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly HumanOperatorInteractionFailure[];
  integrity_hash: string;
}>;

export type HumanOperatorInteractionBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-human-operator-interaction/v3.9";
    exclusive_operator_interaction_layer: true;
    owns_operator_approval: true;
    owns_warning_acknowledgement: true;
    owns_escalation_routing: true;
    owns_intervention_workflows: true;
    owns_decision_presentation: true;
    owns_constitutional_authority: false;
    owns_policy_contracts: false;
    owns_safety_contracts: false;
    canonical_sequence_required: true;
    fail_closed_required: true;
  }>;
  result: HumanOperatorInteractionResult;
  validation: HumanOperatorInteractionValidation;
}>;
