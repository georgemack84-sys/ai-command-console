export type PilotGovernanceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PilotLifecycleState = "PLANNED" | "QUALIFIED" | "APPROVED" | "ACTIVE" | "MONITORED" | "ROLLED_BACK" | "TERMINATED" | "EXPANDED" | "COMPLETE";
export type PilotRiskClassification = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CONSTITUTIONAL";
export type PilotGovernanceFailure = "GOVERNANCE_CONTRACT_NOT_APPROVED" | "PILOT_LIFECYCLE_NON_DETERMINISTIC" | "AUTHORITY_MODEL_NOT_EXPLICIT" | "OWNERSHIP_NOT_ATTRIBUTABLE" | "LIFECYCLE_TRANSITIONS_MUTABLE" | "PILOT_HISTORY_NOT_REPLAYABLE" | "GOVERNANCE_DECISIONS_NOT_TRACEABLE" | "PRODUCTION_BOUNDARIES_NOT_ENFORCED" | "ROLLBACK_AUTHORITY_NOT_INDEPENDENT" | "ADVISORY_ONLY_NOT_PRESERVED" | "TERMINAL_STATES_NOT_GOVERNED" | "EVIDENCE_LINEAGE_INCOMPLETE" | "UNAUTHORIZED_ADVANCEMENT_POSSIBLE" | "EXPANSION_WITHOUT_GOVERNANCE" | "CONSTITUTIONAL_RULES_NOT_VERIFIED" | "TENANT_ISOLATION_NOT_PRESERVED" | "PHASE_15_CERTIFICATION_NOT_PASSED" | "NON_CONSTITUTIONAL_PILOT_WARNING";
export type PilotGovernanceScenario = "BASELINE" | PilotGovernanceFailure;

export type PilotGovernanceInput = Readonly<{ scenario?: PilotGovernanceScenario; pilot_id?: string; tenant_id?: string; operator_id?: string }>;

export type PilotGovernanceContract = Readonly<{
  contract_version: "pilot-governance-foundation/v16.1";
  constitutional_scope: string;
  permitted_production_behavior: readonly string[];
  operational_constraints: readonly string[];
  required_evidence: readonly string[];
  approval_requirements: readonly string[];
  monitoring_obligations: readonly string[];
  rollback_requirements: readonly string[];
  completion_conditions: readonly string[];
  expansion_requirements: readonly string[];
  termination_conditions: readonly string[];
  approved: boolean;
  advisory_only: boolean;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type PilotLifecycleDefinition = Readonly<{
  lifecycle_id: string;
  states: readonly PilotLifecycleState[];
  valid_transitions: readonly string[];
  deterministic: boolean;
  terminal_states_governed: boolean;
  immutable_history_required: boolean;
  replay_required: boolean;
  integrity_hash: string;
}>;

export type PilotAuthorityRecord = Readonly<{
  authority_id: string;
  governance_approval_authority: string;
  qualification_approval_authority: string;
  production_authorization_authority: string;
  rollback_authority: string;
  expansion_approval_authority: string;
  termination_approval_authority: string;
  certification_review_authority: string;
  operational_monitoring_owner: string;
  evidence_acceptance_authority: string;
  final_completion_authority: string;
  explicit: boolean;
  authority_separated: boolean;
  rollback_independent: boolean;
  integrity_hash: string;
}>;

export type PilotOwnershipRecord = Readonly<{
  pilot_id: string;
  pilot_owner: string;
  governance_authority: string;
  operational_owner: string;
  production_environment: string;
  scope_definition: string;
  tenant_scope: readonly string[];
  risk_classification: PilotRiskClassification;
  approval_refs: readonly string[];
  certification_refs: readonly string[];
  current_state: PilotLifecycleState;
  attributable: boolean;
  integrity_hash: string;
}>;

export type PilotScopeRecord = Readonly<{
  scope_id: string;
  participating_tenants: readonly string[];
  enabled_capabilities: readonly string[];
  production_limits: readonly string[];
  geographic_boundaries: readonly string[];
  environment_restrictions: readonly string[];
  monitoring_requirements: readonly string[];
  rollback_boundaries: readonly string[];
  success_measurements: readonly string[];
  expansion_authorized: boolean;
  tenant_isolation_preserved: boolean;
  integrity_hash: string;
}>;

export type PilotCriteriaRecord = Readonly<{
  criteria_id: string;
  functional_objectives: boolean;
  governance_compliance: boolean;
  operational_stability: boolean;
  replay_consistency: boolean;
  tenant_isolation: boolean;
  advisory_boundary_preservation: boolean;
  rollback_readiness: boolean;
  operator_satisfaction: boolean;
  evidence_completeness: boolean;
  production_safety: boolean;
  exit_objectives_achieved: boolean;
  exit_reviews_finalized: boolean;
  integrity_hash: string;
}>;

export type PilotTransitionRecord = Readonly<{
  transition_id: string;
  from_state: PilotLifecycleState;
  to_state: PilotLifecycleState;
  current_state_validated: boolean;
  governance_authorized: boolean;
  authority_verified: boolean;
  evidence_refs: readonly string[];
  replay_checkpoint_ref: string;
  ledger_entry_ref: string;
  timestamp: string;
  operator_ref: string;
  certification_validated: boolean;
  integrity_verified: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type PilotGovernanceDecision = Readonly<{
  decision_id: string;
  lifecycle_decision: "ADVANCE" | "HOLD" | "ROLLBACK" | "TERMINATE" | "EXPAND" | "COMPLETE";
  deterministic: boolean;
  governance_supremacy: boolean;
  explicit_authority: boolean;
  fail_closed_advancement: boolean;
  unauthorized_advancement_blocked: boolean;
  expansion_requires_governance: boolean;
  fully_traceable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PilotGovernanceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "CONTRACT" | "AUTHORITY" | "OWNERSHIP" | "SCOPE" | "CRITERIA" | "TRANSITION" | "DECISION" | "CERTIFICATION";
  pilot_id: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type PilotGovernanceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: PilotGovernanceOutcome;
  passed: boolean;
  failure_reason: PilotGovernanceFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PilotGovernanceResult = Readonly<{
  phase_version: "pilot-governance-foundation/v16.1";
  phase_identifier: "PilotGovernanceFoundation";
  production_certification_ref: string;
  contract: PilotGovernanceContract;
  lifecycle: PilotLifecycleDefinition;
  authority: PilotAuthorityRecord;
  ownership: PilotOwnershipRecord;
  scope: PilotScopeRecord;
  criteria: PilotCriteriaRecord;
  transition: PilotTransitionRecord;
  decision: PilotGovernanceDecision;
  ledger: readonly PilotGovernanceLedgerEntry[];
  certification_tests: readonly PilotGovernanceCertificationTest[];
  failures: readonly PilotGovernanceFailure[];
  outcome: PilotGovernanceOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PilotGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: PilotGovernanceOutcome;
  contract_valid: boolean;
  lifecycle_valid: boolean;
  authority_valid: boolean;
  ownership_valid: boolean;
  scope_valid: boolean;
  criteria_valid: boolean;
  transition_valid: boolean;
  decision_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly PilotGovernanceFailure[];
  integrity_hash: string;
}>;

export type PilotGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "pilot-governance-foundation/v16.1";
    upstream_phase: "production-certification-gate/v15.12";
    lifecycle: readonly PilotLifecycleState[];
    risk_classifications: readonly PilotRiskClassification[];
    certification_outcomes: readonly PilotGovernanceOutcome[];
  }>;
  result: PilotGovernanceResult;
  validation: PilotGovernanceValidation;
}>;
