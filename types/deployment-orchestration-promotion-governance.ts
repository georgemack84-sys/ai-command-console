export type DeploymentGovernanceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DeploymentLifecycleState = "RELEASE_REGISTERED" | "ARTIFACT_VERIFIED" | "ENVIRONMENT_QUALIFIED" | "DEPLOYMENT_APPROVED" | "CANARY_DEPLOYED" | "PRODUCTION_VALIDATION" | "PRODUCTION_ACTIVE" | "ROLLED_BACK";
export type PromotionDecisionOutcome = "PROMOTION_APPROVED" | "PROMOTION_BLOCKED" | "REQUIRES_OPERATOR_APPROVAL" | "REQUIRES_GOVERNANCE_REVIEW" | "FAILED_PRECONDITION";
export type ApprovalState = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "REVOKED";
export type DeploymentGovernanceFailure = "DEPLOYMENT_GOVERNANCE_CONTRACT_INVALID" | "DEPLOYMENT_IDENTITY_NON_DETERMINISTIC" | "PROMOTION_LIFECYCLE_NON_DETERMINISTIC" | "STATE_MACHINE_INCOMPLETE" | "STATE_TRANSITIONS_MUTABLE" | "PROMOTION_GATE_NON_DETERMINISTIC" | "CERTIFIED_ARTIFACT_NOT_REQUIRED" | "ENVIRONMENT_QUALIFICATION_NOT_ENFORCED" | "FAILED_QUALIFICATION_ALLOWED_PROMOTION" | "APPROVAL_WORKFLOW_NON_DETERMINISTIC" | "OPERATOR_AUTHORIZATION_INVALID" | "GOVERNANCE_APPROVAL_NOT_ENFORCED" | "ADVISORY_BOUNDARY_BREACH" | "DEPLOYMENT_EXECUTION_NOT_EXTERNALIZED" | "UNAUTHORIZED_PROMOTION_NOT_BLOCKED" | "DEPLOYMENT_LINEAGE_INCOMPLETE" | "ROLLBACK_LINEAGE_LOST" | "DEPLOYMENT_LEDGER_MUTABLE" | "REPLAY_NON_DETERMINISTIC" | "EXPLAINABILITY_NOT_REPRODUCIBLE" | "SECURITY_POLICY_NOT_ENFORCED" | "TENANT_ISOLATION_NOT_PRESERVED" | "OBSERVABILITY_INCOMPLETE" | "AUDIT_EVIDENCE_MUTABLE" | "FAIL_CLOSED_NOT_ENFORCED" | "NON_CONSTITUTIONAL_DEPLOYMENT_WARNING";
export type DeploymentGovernanceScenario = "BASELINE" | DeploymentGovernanceFailure;

export type DeploymentGovernanceInput = Readonly<{ scenario?: DeploymentGovernanceScenario }>;

export type DeploymentGovernanceContract = Readonly<{
  contract_version: "deployment-orchestration-promotion-governance/v15.4";
  deployment_ownership: "AUTHORIZED_DEPLOYMENT_INFRASTRUCTURE";
  mission_control_authority: "ASSESSMENT_ONLY";
  deployment_execution_externalized: boolean;
  promotion_governance_required: boolean;
  rollback_governance_required: boolean;
  replay_required: boolean;
  fail_closed: boolean;
  lifecycle: readonly DeploymentLifecycleState[];
  integrity_hash: string;
}>;

export type DeploymentIdentity = Readonly<{
  deployment_id: string;
  release_id: string;
  environment_id: string;
  promotion_sequence: number;
  deployment_version: string;
  timestamp: string;
  tenant: string;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DeploymentOrchestratorRecord = Readonly<{
  orchestrator_id: string;
  coordinates_requests: boolean;
  verifies_prerequisites: boolean;
  evaluates_eligibility: boolean;
  tracks_progress: boolean;
  publishes_events: boolean;
  maintains_state: boolean;
  performs_deployment_execution: false;
  mutates_infrastructure: false;
  modifies_environment: false;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type PromotionGateRecord = Readonly<{
  gate_id: string;
  decision: PromotionDecisionOutcome;
  certified_artifact: boolean;
  environment_qualified: boolean;
  configuration_integrity: boolean;
  approval_evidence: boolean;
  policy_compliance: boolean;
  rollback_ready: boolean;
  integrity_verified: boolean;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DeploymentStateMachine = Readonly<{
  state_machine_id: string;
  states: readonly DeploymentLifecycleState[];
  current_state: DeploymentLifecycleState;
  skipped_states_allowed: false;
  transitions_immutable: boolean;
  previous_states_preserved: boolean;
  replay_deterministic: boolean;
  integrity_hash: string;
}>;

export type ApprovalWorkflowRecord = Readonly<{
  approval_id: string;
  approval_state: ApprovalState;
  single_approval_supported: boolean;
  multi_party_approval_supported: boolean;
  governance_approval_supported: boolean;
  emergency_approval_supported: boolean;
  time_limited_approval_supported: boolean;
  delegated_authority_supported: boolean;
  approval_never_overrides_failed_qualification: boolean;
  authority_verified: boolean;
  delegation_auditable: boolean;
  immutable: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DeploymentLineageGraph = Readonly<{
  lineage_id: string;
  artifact_lineage_refs: readonly string[];
  environment_lineage_refs: readonly string[];
  approval_lineage_refs: readonly string[];
  promotion_lineage_refs: readonly string[];
  rollback_lineage_refs: readonly string[];
  validation_lineage_refs: readonly string[];
  certification_lineage_refs: readonly string[];
  relationships_immutable: boolean;
  replay_supported: boolean;
  integrity_hash: string;
}>;

export type DeploymentLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "STATE_TRANSITION" | "PROMOTION_EVALUATION" | "APPROVAL_EVENT" | "ROLLBACK_EVENT" | "DEPLOYMENT_EVIDENCE" | "OPERATOR_DECISION";
  sequence: number;
  deployment_id: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  tenant_isolated: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type RollbackGovernanceRecord = Readonly<{
  rollback_id: string;
  triggers: readonly ("VALIDATION_FAILURE" | "POLICY_VIOLATION" | "INTEGRITY_FAILURE" | "OPERATOR_REQUEST" | "GOVERNANCE_DECISION" | "INFRASTRUCTURE_FAILURE")[];
  preserves_history: boolean;
  never_rewrites_deployment: boolean;
  successor_lineage_generated: boolean;
  evidence_immutable: boolean;
  replay_reproducible: boolean;
  integrity_hash: string;
}>;

export type DeploymentReplayExplainability = Readonly<{
  replay_id: string;
  promotion_replay: boolean;
  approval_replay: boolean;
  rollback_replay: boolean;
  deployment_reasoning: readonly string[];
  evidence_reconstruction: boolean;
  operator_decision_reconstruction: boolean;
  deterministic: boolean;
  reproducible_explanation: boolean;
  integrity_hash: string;
}>;

export type DeploymentSecurityAuthority = Readonly<{
  authority_id: string;
  operator_authority_validated: boolean;
  deployment_authority_external: boolean;
  promotion_authorization_validated: boolean;
  policy_compliance_validated: boolean;
  identity_verified: boolean;
  environment_authorized: boolean;
  unauthorized_promotion_blocked: boolean;
  privilege_escalation_blocked: boolean;
  approval_forgery_blocked: boolean;
  policy_bypass_blocked: boolean;
  qualification_bypass_blocked: boolean;
  environment_substitution_blocked: boolean;
  artifact_substitution_blocked: boolean;
  integrity_hash: string;
}>;

export type DeploymentObservability = Readonly<{
  observability_id: string;
  dashboard_complete: boolean;
  promotion_monitor: boolean;
  approval_monitor: boolean;
  rollback_monitor: boolean;
  alerts_configured: boolean;
  replay_health_monitored: boolean;
  lineage_completeness_monitored: boolean;
  integrity_hash: string;
}>;

export type DeploymentGovernanceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: DeploymentGovernanceOutcome;
  passed: boolean;
  failure_reason: DeploymentGovernanceFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DeploymentGovernanceResult = Readonly<{
  phase_version: "deployment-orchestration-promotion-governance/v15.4";
  phase_identifier: "DeploymentOrchestrationPromotionGovernance";
  environment_qualification_ref: string;
  release_artifact_ref: string;
  contract: DeploymentGovernanceContract;
  identity: DeploymentIdentity;
  orchestrator: DeploymentOrchestratorRecord;
  promotion_gate: PromotionGateRecord;
  state_machine: DeploymentStateMachine;
  approval_workflow: ApprovalWorkflowRecord;
  lineage: DeploymentLineageGraph;
  ledger: readonly DeploymentLedgerEntry[];
  rollback: RollbackGovernanceRecord;
  replay_explainability: DeploymentReplayExplainability;
  security_authority: DeploymentSecurityAuthority;
  observability: DeploymentObservability;
  certification_tests: readonly DeploymentGovernanceCertificationTest[];
  failures: readonly DeploymentGovernanceFailure[];
  outcome: DeploymentGovernanceOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DeploymentGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: DeploymentGovernanceOutcome;
  contract_valid: boolean;
  identity_valid: boolean;
  orchestrator_valid: boolean;
  promotion_valid: boolean;
  state_valid: boolean;
  approval_valid: boolean;
  lineage_valid: boolean;
  ledger_valid: boolean;
  rollback_valid: boolean;
  replay_valid: boolean;
  security_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  failures: readonly DeploymentGovernanceFailure[];
  integrity_hash: string;
}>;

export type DeploymentGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "deployment-orchestration-promotion-governance/v15.4";
    upstream_phase: "production-environment-qualification/v15.3";
    lifecycle: readonly DeploymentLifecycleState[];
    promotion_decisions: readonly PromotionDecisionOutcome[];
    approval_states: readonly ApprovalState[];
    certification_outcomes: readonly DeploymentGovernanceOutcome[];
  }>;
  result: DeploymentGovernanceResult;
  validation: DeploymentGovernanceValidation;
}>;
