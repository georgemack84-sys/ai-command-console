export type AgentRole = "Coordinator" | "Planner" | "Analyst" | "Observer" | "Executor" | "Validator" | "Governance Advisor" | "Runtime Supervisor" | "Recovery Advisor" | "Explainability Agent" | "Prediction Agent" | "Integrity Auditor" | "Certification Agent";
export type AuthorityCategory = "NONE" | "READ_ONLY" | "OBSERVE" | "ANALYZE" | "PLAN" | "RECOMMEND" | "VALIDATE" | "SUPERVISE" | "GOVERNANCE_ADVISORY" | "CERTIFY";
export type CommunicationType = "REQUEST" | "RESPONSE" | "NOTIFICATION" | "STATUS" | "RECOMMENDATION" | "EVIDENCE" | "GOVERNANCE" | "EXPLANATION" | "HEALTH" | "CERTIFICATION";
export type CoordinationState = "INITIALIZING" | "VALIDATING" | "REGISTERING_AGENTS" | "VERIFYING_AUTHORITIES" | "VERIFYING_GOVERNANCE" | "ACTIVE" | "PAUSED" | "REPLAY_READY" | "CERTIFIED" | "FAILED" | "TERMINATED";
export type CoordinationScenario = "BASELINE" | "UNCERTIFIED_AGENT" | "DUPLICATE_AGENT_IDENTITY" | "MISSION_SCOPE_MISMATCH" | "ROLE_AMBIGUITY" | "AUTHORITY_OVERLAP" | "AUTHORITY_ESCALATION" | "UNAUTHORIZED_COMMUNICATION" | "CIRCULAR_DELEGATION" | "MISSING_GOVERNANCE_REFERENCE" | "MISSING_CONSTITUTIONAL_REFERENCE" | "MISSING_REPLAY_REQUIREMENTS" | "CROSS_TENANT_PARTICIPATION" | "HIDDEN_PARTICIPANT" | "INTEGRITY_FAILURE";
export type CoordinationFailure = "UNCERTIFIED_AGENT_DETECTED" | "DUPLICATE_AGENT_IDENTITY_DETECTED" | "MISSION_SCOPE_MISMATCH_DETECTED" | "ROLE_AMBIGUITY_DETECTED" | "AUTHORITY_OVERLAP_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "UNAUTHORIZED_COMMUNICATION_PERMITTED" | "CIRCULAR_DELEGATION_DETECTED" | "GOVERNANCE_REFERENCE_MISSING" | "CONSTITUTIONAL_REFERENCE_MISSING" | "REPLAY_REQUIREMENTS_MISSING" | "CROSS_TENANT_PARTICIPATION_REJECTED" | "HIDDEN_PARTICIPANT_DETECTED" | "INTEGRITY_HASH_INVALID" | "CONTRACT_SCHEMA_INVALID" | "COMMUNICATION_POLICY_INCOMPLETE" | "DELEGATION_POLICY_INVALID" | "OPERATOR_VISIBILITY_INCOMPLETE";

export type AgentIdentity = Readonly<{
  agent_id: string;
  agent_name: string;
  agent_type: string;
  agent_version: string;
  certification_level: "CERTIFIED" | "UNCERTIFIED";
  authority_profile: AuthorityCategory;
  governance_profile: string;
  constitutional_profile: string;
  replay_identity: string;
  role: AgentRole;
  tenant_id: string;
  mission_assignment: string;
  parent_agent: string | null;
  lineage_reference: string;
  status: "ACTIVE" | "REJECTED";
}>;

export type CoordinationSession = Readonly<{
  coordination_session_id: string;
  coordination_contract_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  session_version: "coordination-session/v8ALT.7.1";
  coordination_type: "MULTI_AGENT_CERTIFIED_COORDINATION";
  created_timestamp: string;
  expiration_timestamp: string;
  session_state: CoordinationState;
}>;

export type MissionScope = Readonly<{
  mission_id: string;
  mission_name: string;
  mission_objective: string;
  mission_constraints: readonly string[];
  mission_priority: "LOW" | "NORMAL" | "HIGH" | "CERTIFICATION";
  authorized_agents: readonly string[];
  authorized_resources: readonly string[];
  authorized_outputs: readonly string[];
  mission_boundaries: readonly string[];
  mission_duration: string;
}>;

export type RoleAssignment = Readonly<{
  role_id: string;
  agent_id: string;
  role_name: AgentRole;
  authority_scope: AuthorityCategory;
  delegation_scope: readonly AgentRole[];
  communication_scope: readonly AgentRole[];
  governance_scope: string;
  replay_scope: string;
  status: "ASSIGNED" | "REJECTED";
}>;

export type CommunicationPermission = Readonly<{
  source_role: AgentRole;
  target_role: AgentRole | "All";
  allowed: boolean;
  governance_required: boolean;
  replay_required: boolean;
}>;

export type DelegationPolicy = Readonly<{
  delegation_id: string;
  source_agent: string;
  target_agent: string;
  authority_preserved: boolean;
  governance_approved: boolean;
  constitutional_approved: boolean;
  operator_authority_preserved: boolean;
  circular_delegation: boolean;
  replay_evidence: string;
}>;

export type GovernanceBinding = Readonly<{
  governance_context_id: string;
  constitution_version: string;
  policy_version: string;
  authority_version: string;
  tenant_context: string;
  risk_profile: string;
  confidence_profile: string;
  certification_level: string;
}>;

export type LifecycleEvent = Readonly<{
  event_id: string;
  contract_id: string;
  session_id: string;
  agent_id: string;
  event_type: string;
  old_state: CoordinationState;
  new_state: CoordinationState;
  authority_reference: string;
  governance_reference: string;
  timestamp: string;
  hash: string;
}>;

export type CoordinationContract = Readonly<{
  coordination_contract_id: string;
  coordination_session_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  participating_agents: readonly AgentIdentity[];
  mission_scope: MissionScope;
  role_assignments: readonly RoleAssignment[];
  authority_profiles: readonly string[];
  communication_policy: readonly CommunicationPermission[];
  delegation_policy: readonly DelegationPolicy[];
  governance_binding: GovernanceBinding;
  replay_policy: readonly string[];
  integrity_policy: readonly string[];
  coordination_constraints: readonly string[];
  shared_state_policy: readonly string[];
  operator_visibility_policy: readonly string[];
  lifecycle_events: readonly LifecycleEvent[];
  created_timestamp: string;
  version: "multi-agent-coordination-contract/v8ALT.7.1";
  immutable: true;
  append_only: true;
  hidden_participant_detected: boolean;
  integrity_hash: string;
  contract_hash: string;
}>;

export type CoordinationInput = Readonly<{
  scenario?: CoordinationScenario;
  tenant_id?: string;
  mission_id?: string;
  contract?: CoordinationContract;
}>;

export type CoordinationValidationResult = Readonly<{
  contract_id: string | null;
  valid: boolean;
  schema_valid: boolean;
  immutable: boolean;
  session_identity_unique: boolean;
  agents_declared: boolean;
  certified_agents_only: boolean;
  mission_scope_valid: boolean;
  roles_deterministic: boolean;
  authority_valid: boolean;
  communication_valid: boolean;
  delegation_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly CoordinationFailure[];
  validation_hash: string;
}>;

export type CoordinationReplayResult = Readonly<{
  replay_reference: string;
  contract_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type CoordinationObservabilitySurface = Readonly<{
  contract_id: string;
  tenant_id: string;
  mission_id: string;
  agent_count: number;
  role_count: number;
  state: CoordinationState;
  append_only: true;
  contract_hash: string;
}>;

export type MultiAgentCoordinationContractBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "multi-agent-coordination-contract/v8ALT.7.1";
    principles: readonly string[];
    roles: readonly AgentRole[];
    authority_categories: readonly AuthorityCategory[];
    communication_types: readonly CommunicationType[];
    states: readonly CoordinationState[];
    final_state: "MULTI_AGENT_COORDINATION_CONTRACT_CERTIFIED";
  }>;
  contract: CoordinationContract;
  validation: CoordinationValidationResult;
  replay: CoordinationReplayResult;
  observability: CoordinationObservabilitySurface;
}>;
