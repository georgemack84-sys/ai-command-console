import type { AgentIdentity, AuthorityCategory } from "@/types/multi-agent-coordination-contract";

export type DelegationState = "INITIALIZING" | "TASK_CLASSIFICATION" | "CAPABILITY_MATCHING" | "AUTHORITY_VALIDATION" | "ROUTING" | "FALLBACK_EVALUATION" | "OWNERSHIP_ASSIGNMENT" | "VALIDATED" | "REPLAY_READY" | "CERTIFIED" | "FAILED";
export type CapabilityCategory = "PLANNING" | "ANALYSIS" | "VALIDATION" | "OBSERVATION" | "COORDINATION" | "SUPERVISION" | "RECOVERY" | "EXPLAINABILITY" | "PREDICTION" | "INTEGRITY" | "CERTIFICATION" | "GOVERNANCE_ADVISORY";
export type BlockingReason = "AUTHORITY_RESTRICTION" | "GOVERNANCE_REJECTION" | "CONSTITUTIONAL_RESTRICTION" | "RESOURCE_UNAVAILABLE" | "CAPABILITY_MISSING" | "TENANT_RESTRICTION" | "DEPENDENCY_FAILURE" | "RUNTIME_BLOCK";
export type DelegationScenario = "BASELINE" | "REPLAY_MISMATCH" | "NONDETERMINISTIC_ASSIGNMENT" | "CAPABILITY_MISMATCH" | "DUPLICATE_OWNERSHIP" | "AUTHORITY_ESCALATION" | "UNAUTHORIZED_DELEGATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_VIOLATION" | "BLOCKED_TASK_DELEGATED" | "FALLBACK_MISMATCH" | "CIRCULAR_DELEGATION" | "MISSING_ACCOUNTABILITY" | "INTEGRITY_FAILURE" | "CROSS_TENANT_DELEGATION" | "HIDDEN_DELEGATION";
export type DelegationFailure = "DELEGATION_REPLAY_MISMATCH" | "NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED" | "CAPABILITY_MISMATCH_DETECTED" | "DUPLICATE_OWNERSHIP_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "UNAUTHORIZED_DELEGATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "BLOCKED_TASK_INCORRECTLY_DELEGATED" | "FALLBACK_ROUTING_MISMATCH_DETECTED" | "CIRCULAR_DELEGATION_DETECTED" | "MISSING_ACCOUNTABILITY_DETECTED" | "INTEGRITY_HASH_INVALID" | "CROSS_TENANT_DELEGATION_DETECTED" | "HIDDEN_DELEGATION_DETECTED";

export type CapabilityProfile = Readonly<{
  agent_id: string;
  capabilities: readonly CapabilityCategory[];
  certification_level: "CERTIFIED" | "UNCERTIFIED";
  authority_scope: AuthorityCategory;
  governance_eligible: boolean;
  tenant_id: string;
  workload_capacity: number;
  mission_compatible: boolean;
  integrity_hash: string;
}>;

export type DelegationRecord = Readonly<{
  delegation_id: string;
  task_id: string;
  delegating_agent: string;
  assigned_agent: string;
  authority_level: AuthorityCategory;
  capability_profile: CapabilityCategory;
  routing_reason: string;
  fallback_used: boolean;
  delegation_state: DelegationState;
  timestamp: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type TaskOwnershipRecord = Readonly<{
  ownership_id: string;
  task_id: string;
  owner_agent: string;
  ownership_state: "ASSIGNED" | "BLOCKED" | "FAILED";
  authority_reference: string;
  governance_reference: string;
  assignment_reason: string;
  created_timestamp: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type BlockedTaskRecord = Readonly<{
  task_id: string;
  blocking_reason: BlockingReason;
  retained_owner: string;
  action: "RETAIN_OWNERSHIP" | "DEFER_DELEGATION" | "ESCALATE_TO_OPERATOR" | "REQUEST_GOVERNANCE_REVIEW" | "RECOMMEND_RECOVERY_PATH";
  delegated: boolean;
  fallback_reference: string;
  integrity_hash: string;
}>;

export type FallbackRoute = Readonly<{
  fallback_id: string;
  task_id: string;
  primary_agent: string;
  fallback_agent: string;
  trigger: string;
  preserves_authority: boolean;
  preserves_governance: boolean;
  deterministic_order: number;
  replay_reference: string;
  integrity_hash: string;
}>;

export type DelegationReplayTrace = Readonly<{
  replay_id: string;
  delegation_id: string;
  routing_sequence: readonly string[];
  authority_validation: "VALID" | "INVALID";
  governance_validation: "VALID" | "INVALID";
  fallback_path: readonly string[];
  ownership_validation: "VALID" | "INVALID";
  result: "REPRODUCED" | "MISMATCH";
  timestamp: string;
  replay_hash: string;
}>;

export type RoutingJustification = Readonly<{
  justification_id: string;
  task_id: string;
  selected_agent: string;
  capability_match: boolean;
  authority_validation: boolean;
  governance_validation: boolean;
  constraint_analysis: readonly string[];
  confidence_score: number;
  risk_score: number;
  integrity_hash: string;
}>;

export type DelegationConflict = Readonly<{
  conflict_id: string;
  conflict_type: "ASSIGNMENT" | "OWNERSHIP" | "AUTHORITY" | "GOVERNANCE" | "CONSTITUTION" | "CIRCULAR" | "ACCOUNTABILITY" | "REPLAY" | "FALLBACK" | "TENANT" | "VISIBILITY" | "INTEGRITY" | "BLOCKED_TASK" | "CAPABILITY";
  task_id: string;
  assigned_agents: readonly string[];
  expected_agent: string;
  observed_agent: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  authority_review: string;
  replay_reference: string;
}>;

export type DelegationEvent = Readonly<{
  event_id: string;
  delegation_session_id: string;
  task_id: string;
  delegating_agent: string;
  assigned_agent: string;
  event_type: string;
  delegation_state: DelegationState;
  authority_reference: string;
  governance_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DelegationEvidence = Readonly<{
  delegation_session_id: string;
  coordination_session_id: string;
  mission_id: string;
  task_ids: readonly string[];
  delegation_map: readonly DelegationRecord[];
  ownership_records: readonly TaskOwnershipRecord[];
  authority_evidence: readonly string[];
  governance_evidence: readonly string[];
  routing_evidence: readonly string[];
  fallback_evidence: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type DelegationContract = Readonly<{
  delegation_contract_id: string;
  delegation_session_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  planning_graph_id: string;
  participating_agents: readonly AgentIdentity[];
  capability_profiles: readonly CapabilityProfile[];
  delegation_policy: readonly string[];
  authority_policy: readonly string[];
  governance_policy: readonly string[];
  constitutional_policy: readonly string[];
  routing_policy: readonly string[];
  fallback_policy: readonly string[];
  delegation_records: readonly DelegationRecord[];
  ownership_ledger: readonly TaskOwnershipRecord[];
  blocked_tasks: readonly BlockedTaskRecord[];
  fallback_routes: readonly FallbackRoute[];
  replay_traces: readonly DelegationReplayTrace[];
  routing_justifications: readonly RoutingJustification[];
  conflicts: readonly DelegationConflict[];
  events: readonly DelegationEvent[];
  evidence: DelegationEvidence;
  created_timestamp: string;
  version: "deterministic-delegation-assurance/v8ALT.7.3";
  immutable: true;
  append_only: true;
  operator_visible: boolean;
  integrity_hash: string;
  contract_hash: string;
}>;

export type DelegationInput = Readonly<{
  scenario?: DelegationScenario;
  tenant_id?: string;
  mission_id?: string;
  contract?: DelegationContract;
}>;

export type DelegationValidationResult = Readonly<{
  delegation_contract_id: string | null;
  valid: boolean;
  reproducible: boolean;
  capability_valid: boolean;
  ownership_unique: boolean;
  authority_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  blocked_task_handling_valid: boolean;
  fallback_valid: boolean;
  circular_free: boolean;
  accountability_valid: boolean;
  replay_valid: boolean;
  lineage_preserved: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly DelegationFailure[];
  validation_hash: string;
}>;

export type DelegationReplayResult = Readonly<{
  delegation_replay_status: "REPRODUCIBLE" | "MISMATCH";
  reproducibility_score: number;
  replay_hash: string;
  validation_timestamp: string;
}>;

export type DelegationObservabilitySurface = Readonly<{
  delegation_contract_id: string;
  delegation_session_id: string;
  tenant_id: string;
  mission_id: string;
  delegation_count: number;
  ownership_count: number;
  blocked_task_count: number;
  conflict_count: number;
  state: DelegationState;
  contract_hash: string;
}>;

export type DeterministicDelegationAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "deterministic-delegation-assurance/v8ALT.7.3";
    final_state: "DETERMINISTIC_DELEGATION_ASSURANCE_CERTIFIED";
    states: readonly DelegationState[];
    capabilities: readonly CapabilityCategory[];
    blocking_reasons: readonly BlockingReason[];
    principles: readonly string[];
  }>;
  contract: DelegationContract;
  validation: DelegationValidationResult;
  replay: DelegationReplayResult;
  observability: DelegationObservabilitySurface;
}>;
