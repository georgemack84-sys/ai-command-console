import type { AgentIdentity, AgentRole, AuthorityCategory } from "@/types/multi-agent-coordination-contract";

export type AuthorityState = "INITIALIZING" | "AUTHORITY_VALIDATION" | "ROLE_VALIDATION" | "BOUNDARY_VERIFICATION" | "GOVERNANCE_VALIDATION" | "TENANT_VALIDATION" | "ESCALATION_VALIDATION" | "ACTIVE" | "REPLAY_READY" | "CERTIFIED" | "FAILED";
export type EscalationLevel = "NONE" | "AGENT" | "COORDINATOR" | "SUPERVISOR" | "GOVERNANCE" | "OPERATOR" | "CERTIFICATION";
export type AuthorityScenario = "BASELINE" | "AUTHORITY_OVERLAP" | "AUTHORITY_ESCALATION" | "UNAUTHORIZED_CONTROL_TRANSFER" | "HIDDEN_COMMAND_AUTHORITY" | "PRIVILEGE_LEAKAGE" | "ROLE_MERGING" | "OPERATOR_BYPASS" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_VIOLATION" | "CROSS_TENANT_AUTHORITY" | "UNAUTHORIZED_ESCALATION" | "ADVISORY_EXECUTION" | "REPLAY_MISMATCH" | "INTEGRITY_FAILURE" | "HIDDEN_AUTHORITY_STATE";
export type AuthorityFailure = "AUTHORITY_OVERLAP_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED" | "HIDDEN_COMMAND_AUTHORITY_DETECTED" | "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED" | "ROLE_SEPARATION_VIOLATED" | "OPERATOR_SUPREMACY_VIOLATED" | "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "CROSS_TENANT_AUTHORITY_DETECTED" | "UNAUTHORIZED_ESCALATION_DETECTED" | "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION" | "AUTHORITY_REPLAY_MISMATCH_DETECTED" | "INTEGRITY_HASH_INVALID" | "HIDDEN_AUTHORITY_STATE_DETECTED";

export type AuthorityProfileRecord = Readonly<{
  authority_profile_id: string;
  agent_id: string;
  role: AgentRole;
  authority_level: AuthorityCategory;
  approved_actions: readonly string[];
  restricted_actions: readonly string[];
  delegation_permissions: readonly string[];
  escalation_permissions: readonly EscalationLevel[];
  operator_override: "OPERATOR_ONLY";
  governance_binding: string;
  constitutional_binding: string;
  tenant_scope: string;
  mission_scope: string;
  immutable: true;
  integrity_hash: string;
}>;

export type AuthorityBoundary = Readonly<{
  boundary_id: string;
  agent_id: string;
  authority_scope: AuthorityCategory;
  role_scope: AgentRole;
  mission_scope: string;
  tenant_scope: string;
  governance_scope: string;
  constitutional_scope: string;
  validation_status: "VALID" | "INVALID";
  integrity_hash: string;
}>;

export type AuthorityConflict = Readonly<{
  conflict_id: string;
  affected_agents: readonly string[];
  conflict_type: "OVERLAP" | "ESCALATION" | "CONTROL_TRANSFER" | "HIDDEN_COMMAND" | "PRIVILEGE_LEAKAGE" | "ROLE_MERGING" | "OPERATOR_BYPASS" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL" | "TENANT" | "ADVISORY_EXECUTION" | "REPLAY" | "INTEGRITY" | "HIDDEN_STATE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  authority_reference: string;
  recommended_action: string;
  timestamp: string;
}>;

export type EscalationReview = Readonly<{
  escalation_id: string;
  requesting_agent: string;
  receiving_authority: string;
  escalation_level: EscalationLevel;
  reason: string;
  governance_validation: "VALID" | "INVALID";
  operator_required: boolean;
  status: "APPROVED_FOR_REVIEW" | "REJECTED" | "BLOCKED";
  timestamp: string;
  integrity_hash: string;
}>;

export type BoundaryViolationAlert = Readonly<{
  alert_id: string;
  agent_id: string;
  violation_type: AuthorityFailure;
  authority_reference: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detected_timestamp: string;
  recommended_response: string;
}>;

export type AuthorityEvidence = Readonly<{
  authority_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  agent_ids: readonly string[];
  authority_profiles: readonly string[];
  boundary_evidence: readonly string[];
  role_evidence: readonly string[];
  governance_evidence: readonly string[];
  constitutional_evidence: readonly string[];
  tenant_evidence: readonly string[];
  escalation_evidence: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type AuthorityEvent = Readonly<{
  event_id: string;
  authority_validation_id: string;
  agent_id: string;
  event_type: string;
  authority_state: AuthorityState;
  previous_state: AuthorityState;
  new_state: AuthorityState;
  authority_reference: string;
  governance_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type AuthorityContract = Readonly<{
  authority_contract_id: string;
  authority_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  participating_agents: readonly AgentIdentity[];
  authority_profiles: readonly AuthorityProfileRecord[];
  role_assignments: readonly string[];
  authority_boundaries: readonly AuthorityBoundary[];
  delegation_permissions: readonly string[];
  escalation_policy: readonly string[];
  governance_policy: readonly string[];
  constitutional_policy: readonly string[];
  operator_supremacy_policy: readonly string[];
  advisory_only_policy: readonly string[];
  conflicts: readonly AuthorityConflict[];
  escalation_reviews: readonly EscalationReview[];
  violation_alerts: readonly BoundaryViolationAlert[];
  evidence: AuthorityEvidence;
  events: readonly AuthorityEvent[];
  created_timestamp: string;
  version: "authority-separation-assurance/v8ALT.7.4";
  immutable: true;
  append_only: true;
  operator_visible: boolean;
  integrity_hash: string;
  contract_hash: string;
}>;

export type AuthorityInput = Readonly<{
  scenario?: AuthorityScenario;
  tenant_id?: string;
  mission_id?: string;
  contract?: AuthorityContract;
}>;

export type AuthorityValidationResult = Readonly<{
  authority_contract_id: string | null;
  valid: boolean;
  profiles_deterministic: boolean;
  boundaries_valid: boolean;
  role_separation_valid: boolean;
  operator_supremacy_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  tenant_isolated: boolean;
  escalation_valid: boolean;
  advisory_only_valid: boolean;
  conflict_free: boolean;
  replay_valid: boolean;
  lineage_preserved: boolean;
  integrity_valid: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly AuthorityFailure[];
  validation_hash: string;
}>;

export type AuthorityReplayResult = Readonly<{
  replay_reference: string;
  authority_contract_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type AuthorityObservabilitySurface = Readonly<{
  authority_contract_id: string;
  authority_validation_id: string;
  tenant_id: string;
  mission_id: string;
  profile_count: number;
  boundary_count: number;
  conflict_count: number;
  alert_count: number;
  state: AuthorityState;
  contract_hash: string;
}>;

export type AuthoritySeparationAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "authority-separation-assurance/v8ALT.7.4";
    final_state: "AUTHORITY_SEPARATION_ASSURANCE_CERTIFIED";
    states: readonly AuthorityState[];
    escalation_levels: readonly EscalationLevel[];
    principles: readonly string[];
  }>;
  contract: AuthorityContract;
  validation: AuthorityValidationResult;
  replay: AuthorityReplayResult;
  observability: AuthorityObservabilitySurface;
}>;
