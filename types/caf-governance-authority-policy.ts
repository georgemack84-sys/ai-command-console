export type AuthorityDecisionType = "AUTHORIZED" | "CONDITIONALLY_AUTHORIZED" | "REQUIRES_APPROVAL" | "DELEGATION_REQUIRED" | "DENIED";
export type PolicyDecisionType = "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "POLICY_EXCEPTION_REQUIRED" | "POLICY_VIOLATION";
export type ApprovalDecisionType = "APPROVED" | "CONDITIONALLY_APPROVED" | "PENDING_APPROVAL" | "REJECTED";
export type GateResultOutcome = "ADMITTED" | "ADMITTED_WITH_WARNINGS" | "PENDING_APPROVAL" | "REJECTED" | "FAIL_CLOSED";
export type GovernanceCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type WarningSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type GovernanceAuthorityPolicyFailure =
  | "P3_6_COLLABORATION_INVALID"
  | "P3_0_AUTHORITY_MATRIX_UNAVAILABLE"
  | "P3_0_WARNING_REGISTRY_UNAVAILABLE"
  | "GOVERNANCE_POLICY_REDEFINED"
  | "AUTHORITY_HIERARCHY_REDEFINED"
  | "AUTHORITY_DECISION_NON_DETERMINISTIC"
  | "POLICY_ENGINE_BYPASS"
  | "APPROVAL_WORKFLOW_NON_DETERMINISTIC"
  | "GATE_RESULT_DUPLICATED"
  | "WARNING_CLASS_NOT_FROM_P3_0"
  | "WARNING_ROUTING_MISSING"
  | "ADMISSION_REQUEST_MISSING"
  | "EVIDENCE_TRACE_MISSING"
  | "REPLAY_DIVERGENCE"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "CERTIFICATION_PRUNED";

export type GovernanceAuthorityPolicyScenario = "BASELINE" | GovernanceAuthorityPolicyFailure;
export type GovernanceAuthorityPolicyInput = Readonly<{ scenario?: GovernanceAuthorityPolicyScenario; tenant_id?: string }>;

export type AuthorityDecision = Readonly<{
  authority_decision_id: string;
  actor_identity_ref: string;
  principal_identity_ref: string;
  delegated_authority_ref: string;
  execution_scope_ref: string;
  capability_permission_ref: string;
  lifecycle_state_ref: string;
  mission_context_ref: string;
  operator_authority_ref: string;
  governance_approval_refs: readonly string[];
  decision: AuthorityDecisionType;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PolicyEvaluationResult = Readonly<{
  policy_evaluation_id: string;
  policy_engine_ref: "Program 2 - CCI Policy Engine";
  evaluated_policy_refs: readonly string[];
  sequencing_deterministic: boolean;
  conflict_handling_ref: string;
  decision: PolicyDecisionType;
  cci_policy_engine_consumed: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ApprovalDecision = Readonly<{
  approval_decision_id: string;
  required_approvals: readonly string[];
  approval_routes: readonly string[];
  approval_state_refs: readonly string[];
  escalation_refs: readonly string[];
  decision: ApprovalDecisionType;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GateWarning = Readonly<{
  warning_id: string;
  warning_class: string;
  severity: WarningSeverity;
  category: string;
  source_gate: "AUTHORITY" | "POLICY" | "APPROVAL" | "GATE_ORCHESTRATOR";
  description: string;
  recommended_action: string;
  evidence_ref: string;
  from_p3_0_registry: boolean;
  integrity_hash: string;
}>;

export type WarningCollection = Readonly<{
  warning_collection_id: string;
  warnings: readonly GateWarning[];
  duplicates_suppressed: boolean;
  ordering_deterministic: boolean;
  severity_assigned: boolean;
  routing_destinations: readonly string[];
  routed: boolean;
  integrity_hash: string;
}>;

export type GateResult = Readonly<{
  gate_id: string;
  request_id: string;
  agent_id: string;
  principal_id: string;
  capability_id: string;
  authority_decision: AuthorityDecisionType;
  policy_decision: PolicyDecisionType;
  approval_decision: ApprovalDecisionType;
  outcome: GateResultOutcome;
  warning_collection_ref: string;
  required_approvals: readonly string[];
  evidence_refs: readonly string[];
  exactly_one_result: boolean;
  timestamp: string;
  integrity_hash: string;
}>;

export type ExecutionAdmissionRequest = Readonly<{
  admission_request_id: string;
  gate_result_ref: string;
  runtime_orchestrator_ref: string;
  admitted: boolean;
  admission_scope_ref: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceReplayValidation = Readonly<{
  replay_validation_id: string;
  authority_replayed: boolean;
  policy_replayed: boolean;
  approval_replayed: boolean;
  warnings_replayed: boolean;
  gate_result_replayed: boolean;
  admission_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type GovernanceAuthorityPolicyCertification = Readonly<{
  certification_id: string;
  outcome: GovernanceCertificationOutcome;
  certified: boolean;
  authority_deterministic: boolean;
  policy_uses_cci_engine: boolean;
  approval_deterministic: boolean;
  exactly_one_gate_result: boolean;
  warnings_from_p3_0_only: boolean;
  admission_generated_when_admitted: boolean;
  evidence_traceable: boolean;
  replay_reproducible: boolean;
  no_policy_redefinition: boolean;
  no_authority_redefinition: boolean;
  fail_closed_enforced: boolean;
  failures: readonly GovernanceAuthorityPolicyFailure[];
  integrity_hash: string;
}>;

export type GovernanceAuthorityPolicyResult = Readonly<{
  phase_version: "caf-governance-authority-policy/v3.7";
  phase_identifier: "CafGovernanceAuthorityPolicy";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  collaboration_federation_ref: "caf-collaboration-federation/v3.6";
  cci_policy_engine_ref: "Program 2 - CCI Policy Engine";
  cci_governance_ref: "Program 2 - CCI Governance Services";
  authority_decision: AuthorityDecision;
  policy_evaluation: PolicyEvaluationResult;
  approval_decision: ApprovalDecision;
  warning_collection: WarningCollection;
  gate_result: GateResult;
  admission_request: ExecutionAdmissionRequest;
  replay_validation: GovernanceReplayValidation;
  certification: GovernanceAuthorityPolicyCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceAuthorityPolicyValidation = Readonly<{
  valid: boolean;
  outcome: GovernanceCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  authority_valid: boolean;
  policy_valid: boolean;
  approval_valid: boolean;
  warnings_valid: boolean;
  gate_valid: boolean;
  admission_valid: boolean;
  certification_valid: boolean;
  failures: readonly GovernanceAuthorityPolicyFailure[];
  integrity_hash: string;
}>;

export type GovernanceAuthorityPolicyBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-governance-authority-policy/v3.7";
    consumes_p3_0_authority_matrix: true;
    consumes_p3_0_warning_registry: true;
    consumes_cci_policy_engine: true;
    defines_policy: false;
    defines_authority_hierarchy: false;
    exactly_one_gate_result_required: true;
    fail_closed_required: true;
  }>;
  result: GovernanceAuthorityPolicyResult;
  validation: GovernanceAuthorityPolicyValidation;
}>;
