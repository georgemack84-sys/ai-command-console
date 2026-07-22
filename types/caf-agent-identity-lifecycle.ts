export type AgentLifecycleState =
  | "REGISTERED"
  | "VALIDATED"
  | "APPROVED"
  | "READY"
  | "ACTIVATED"
  | "ACTIVE"
  | "SUSPENDED"
  | "RESUMING"
  | "UPGRADING"
  | "RETIRED"
  | "ARCHIVED";

export type AgentRetirementType = "PLANNED" | "SUPERSEDED" | "SECURITY" | "OBSOLETE" | "GOVERNANCE" | "EMERGENCY";
export type AgentLifecycleCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type AgentIdentityLifecycleFailure =
  | "P3_0_CONSTITUTIONAL_BASELINE_INVALID"
  | "IDENTITY_COLLISION"
  | "NAMESPACE_UNGOVERNED"
  | "REGISTRY_MUTABLE"
  | "ILLEGAL_LIFECYCLE_TRANSITION"
  | "ACTIVATION_WITHOUT_GOVERNANCE"
  | "UNAUTHORIZED_TENANT"
  | "SUSPENSION_NON_DETERMINISTIC"
  | "RECOVERY_UNGOVERNED"
  | "RETIREMENT_DESTROYS_HISTORY"
  | "VERSION_LINEAGE_INCOMPLETE"
  | "LIFECYCLE_EVIDENCE_MISSING"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "OBSERVABILITY_GAP"
  | "CERTIFICATION_PRUNED";

export type AgentIdentityLifecycleScenario = "BASELINE" | AgentIdentityLifecycleFailure;
export type AgentIdentityLifecycleInput = Readonly<{ scenario?: AgentIdentityLifecycleScenario; tenant_id?: string }>;

export type AgentIdentityRecord = Readonly<{
  agent_id: string;
  agent_namespace: string;
  agent_class: string;
  agent_type: string;
  agent_owner: string;
  agent_instance: string;
  agent_family: string;
  agent_generation: number;
  agent_version: string;
  agent_status: AgentLifecycleState;
  tenant_id: string;
  deterministic_identity: boolean;
  namespace_governed: boolean;
  collision_free: boolean;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type AgentRegistryRecord = Readonly<{
  registry_id: string;
  identity: AgentIdentityRecord;
  metadata_refs: readonly string[];
  capability_refs: readonly string[];
  dependency_refs: readonly string[];
  governance_state: "GOVERNED" | "BLOCKED";
  lifecycle_state: AgentLifecycleState;
  immutable: boolean;
  replayable: boolean;
  discovery_enabled: boolean;
  lineage_traversal_supported: boolean;
  history_refs: readonly string[];
  integrity_hash: string;
}>;

export type AgentLifecycleContract = Readonly<{
  lifecycle_contract_id: string;
  states: readonly AgentLifecycleState[];
  legal_transitions: readonly string[];
  attempted_transition: string;
  transition_legal: boolean;
  approvals_skipped: boolean;
  activation_governed: boolean;
  retired_reactivation_blocked: boolean;
  archived_immutable: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type AgentActivationRecord = Readonly<{
  activation_id: string;
  identity_valid: boolean;
  dependencies_satisfied: boolean;
  authority_approved: boolean;
  policies_satisfied: boolean;
  tenant_authorized: boolean;
  resources_ready: boolean;
  version_compatible: boolean;
  evidence_complete: boolean;
  activation_authorized: boolean;
  ledger_ref: string;
  integrity_hash: string;
}>;

export type AgentSuspensionRecoveryRecord = Readonly<{
  suspension_id: string;
  suspension_causes: readonly string[];
  suspension_deterministic: boolean;
  recovery_id: string;
  issue_resolved: boolean;
  policies_satisfied: boolean;
  dependencies_healthy: boolean;
  authority_approval: boolean;
  evidence_recorded: boolean;
  recovery_governed: boolean;
  integrity_hash: string;
}>;

export type AgentRetirementRecord = Readonly<{
  retirement_id: string;
  retirement_type: AgentRetirementType;
  activation_disabled: boolean;
  configuration_frozen: boolean;
  evidence_preserved: boolean;
  lineage_preserved: boolean;
  metadata_archived: boolean;
  replay_compatibility_maintained: boolean;
  history_destroyed: boolean;
  integrity_hash: string;
}>;

export type AgentVersionLineageRecord = Readonly<{
  lineage_id: string;
  parent_version: string;
  child_version: string;
  upgrade_path: string;
  compatibility: "COMPATIBLE" | "INCOMPATIBLE";
  migration_ref: string;
  supersession_ref: string;
  rollback_targets: readonly string[];
  fork_refs: readonly string[];
  immutable: boolean;
  fully_traceable: boolean;
  integrity_hash: string;
}>;

export type AgentLifecycleEvidenceEntry = Readonly<{
  evidence_id: string;
  event_type: "IDENTITY_CREATED" | "REGISTERED" | "VALIDATED" | "APPROVED" | "ACTIVATED" | "UPGRADED" | "SUSPENDED" | "RECOVERED" | "RETIRED" | "ARCHIVED";
  lifecycle_state: AgentLifecycleState;
  evidence_refs: readonly string[];
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type AgentLifecycleObservability = Readonly<{
  observability_id: string;
  metrics: Readonly<{
    registrations: number;
    activations: number;
    active_agents: number;
    suspensions: number;
    recoveries: number;
    retirements: number;
    upgrades: number;
    failed_activations: number;
    policy_violations: number;
    version_distribution: readonly string[];
  }>;
  dashboards: readonly string[];
  alerts: readonly string[];
  complete_visibility: boolean;
  integrity_hash: string;
}>;

export type AgentLifecycleReplayValidation = Readonly<{
  replay_validation_id: string;
  identity_reconstructed: boolean;
  registry_reconstructed: boolean;
  lifecycle_reconstructed: boolean;
  activation_reconstructed: boolean;
  suspension_recovery_reconstructed: boolean;
  retirement_reconstructed: boolean;
  version_lineage_reconstructed: boolean;
  evidence_reconstructed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type AgentLifecycleCertification = Readonly<{
  certification_id: string;
  outcome: AgentLifecycleCertificationOutcome;
  certified: boolean;
  deterministic_identities: boolean;
  namespace_governance: boolean;
  uniqueness_validated: boolean;
  ownership_validated: boolean;
  legal_transitions_enforced: boolean;
  activation_governed: boolean;
  suspension_governed: boolean;
  retirement_governed: boolean;
  registry_integrity: boolean;
  lineage_complete: boolean;
  tenant_isolation_preserved: boolean;
  evidence_complete: boolean;
  replay_reproducible: boolean;
  constitutional_compliance: boolean;
  failures: readonly AgentIdentityLifecycleFailure[];
  integrity_hash: string;
}>;

export type AgentIdentityLifecycleResult = Readonly<{
  phase_version: "caf-agent-identity-lifecycle/v3.1";
  phase_identifier: "CafAgentIdentityLifecycle";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  identity: AgentIdentityRecord;
  registry: AgentRegistryRecord;
  lifecycle_contract: AgentLifecycleContract;
  activation: AgentActivationRecord;
  suspension_recovery: AgentSuspensionRecoveryRecord;
  retirement: AgentRetirementRecord;
  version_lineage: AgentVersionLineageRecord;
  lifecycle_evidence: readonly AgentLifecycleEvidenceEntry[];
  observability: AgentLifecycleObservability;
  replay_validation: AgentLifecycleReplayValidation;
  certification: AgentLifecycleCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AgentIdentityLifecycleValidation = Readonly<{
  valid: boolean;
  outcome: AgentLifecycleCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  identity_valid: boolean;
  registry_valid: boolean;
  lifecycle_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly AgentIdentityLifecycleFailure[];
  integrity_hash: string;
}>;

export type AgentIdentityLifecycleBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-agent-identity-lifecycle/v3.1";
    consumes_constitutional_foundation: true;
    owns_identity_lifecycle_only: true;
    cci_identity_infrastructure_owner: "Program 2";
    deterministic_identity_required: true;
    immutable_lineage_required: true;
    governed_lifecycle_required: true;
    replay_safe_reconstruction_required: true;
    multi_tenant_isolation_required: true;
  }>;
  result: AgentIdentityLifecycleResult;
  validation: AgentIdentityLifecycleValidation;
}>;
