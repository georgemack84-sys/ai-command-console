import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { AutonomyStateContext } from "@/types/autonomy-state-machine";

export type AutonomyAuthorityLevel = 0 | 1 | 2 | 3 | 4;
export type AutonomyAuthorityState = "UNASSIGNED" | "ASSIGNED" | "VALIDATED" | "AUTHORIZED" | "LIMITED" | "SUSPENDED" | "REVOKED";
export type AutonomyAuthorityDecisionState = "APPROVED" | "DENIED";
export type AutonomyAuthorityScenario =
  | "BASELINE"
  | "SELF_ASSIGNED"
  | "IMPLICIT_PERMISSION"
  | "AUTHORITY_ESCALATION"
  | "MISSING_OPERATOR_APPROVAL"
  | "GOVERNANCE_BYPASS"
  | "POLICY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "UNAUTHORIZED_EXECUTION"
  | "UNAUTHORIZED_DELEGATION"
  | "PRIVILEGE_INHERITANCE"
  | "CROSS_TENANT_AUTHORITY"
  | "OUTSIDE_MISSION_SCOPE"
  | "AUTHORITY_MODIFIED_DURING_EXECUTION"
  | "EMERGENCY_BYPASS"
  | "HASH_MISMATCH";

export type AutonomyAuthorityFailureReason =
  | "AUTHORITY_ASSIGNMENT_MISSING"
  | "UNKNOWN_AUTHORITY_STATE"
  | "SELF_ASSIGNED_AUTHORITY"
  | "IMPLICIT_PERMISSION"
  | "AUTHORITY_ESCALATION"
  | "OPERATOR_UNAUTHORIZED"
  | "OPERATOR_APPROVAL_MISSING"
  | "GOVERNANCE_BYPASS"
  | "GOVERNANCE_CONFLICT"
  | "POLICY_VIOLATION"
  | "POLICY_EXPIRED"
  | "CONSTITUTIONAL_VIOLATION"
  | "CONSTITUTIONAL_CONFLICT"
  | "UNAUTHORIZED_EXECUTION"
  | "UNAUTHORIZED_DELEGATION"
  | "PRIVILEGE_INHERITANCE"
  | "CROSS_TENANT_AUTHORITY"
  | "MISSION_SCOPE_VIOLATION"
  | "AUTHORITY_MODIFIED_DURING_EXECUTION"
  | "REPLAY_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "EMERGENCY_AUTHORITY_UNBOUNDED"
  | "FAIL_CLOSED";

export type AutonomyActionType =
  | "OBSERVE_MISSION"
  | "COLLECT_TELEMETRY"
  | "GENERATE_RECOMMENDATION"
  | "PREPARE_WORKFLOW"
  | "QUEUE_EXECUTION_REQUEST"
  | "EXECUTE_APPROVED_WORKFLOW"
  | "COORDINATE_APPROVED_AGENTS"
  | "PAUSE_AUTONOMY"
  | "SUSPEND_SERVICE"
  | "ISOLATE_COMPONENT"
  | "DELEGATE_TASK"
  | "MODIFY_GOVERNANCE_POLICY";

export type AutonomyAuthorityAssignment = Readonly<{
  assignment_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  authority_level: AutonomyAuthorityLevel;
  authority_scope: AutonomyAuthorityScope;
  authority_state: AutonomyAuthorityState;
  permissions: readonly AutonomyActionType[];
  restrictions: readonly string[];
  approval_required: boolean;
  assigned_by: string;
  governance_profile: string;
  policy_profile: string;
  constitutional_profile: string;
  replay_reference: string;
  created_timestamp: string;
  assignment_hash: string;
}>;

export type AutonomyAuthorityRequest = Readonly<{
  requested_action: AutonomyActionType;
  requested_authority_level: AutonomyAuthorityLevel;
  operator_reference: string;
  operator_role: "OBSERVER" | "OPERATOR" | "GOVERNANCE_ADMIN" | "EMERGENCY_CONTROLLER";
  operator_approved: boolean;
  governance_approved: boolean;
  policy_approved: boolean;
  constitutional_approved: boolean;
  mission_approved: boolean;
  replay_reference: string;
  tenant_id: string;
  mission_id: string;
  self_assigned?: boolean;
  implicit_permission?: boolean;
  delegated?: boolean;
  inherited_privilege?: boolean;
  modified_during_execution?: boolean;
}>;

export type AutonomyAuthorityDecision = Readonly<{
  authority_decision_id: string;
  autonomy_id: string;
  authority_level: AutonomyAuthorityLevel;
  requested_action: AutonomyActionType;
  mission_id: string;
  tenant_id: string;
  operator_reference: string;
  governance_profile: string;
  policy_profile: string;
  constitutional_profile: string;
  approval_results: Readonly<{
    operator: boolean;
    governance: boolean;
    policy: boolean;
    constitution: boolean;
    mission: boolean;
    execution: boolean;
  }>;
  decision: AutonomyAuthorityDecisionState;
  denial_reason: AutonomyAuthorityFailureReason | null;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type AutonomyAuthorityValidationResult = Readonly<{
  validation_id: string;
  autonomy_id: string;
  decision: AutonomyAuthorityDecisionState;
  failures: readonly AutonomyAuthorityFailureReason[];
  operator_validated: boolean;
  governance_validated: boolean;
  policy_validated: boolean;
  constitution_validated: boolean;
  execution_validated: boolean;
  mission_scope_validated: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type AutonomyAuthorityAuditLedger = Readonly<{
  ledger_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  decisions: readonly AutonomyAuthorityDecision[];
  approval_chain: readonly string[];
  denied_requests: readonly AutonomyAuthorityDecision[];
  replay_references: readonly string[];
  ledger_hash: string;
}>;

export type AutonomyAuthorityReplayResult = Readonly<{
  replay_id: string;
  autonomy_id: string;
  reconstructed_outcomes: readonly AutonomyAuthorityDecisionState[];
  denial_reasons: readonly (AutonomyAuthorityFailureReason | null)[];
  replay_references: readonly string[];
  validation_state: "PASS" | "FAIL";
  failure_reason: AutonomyAuthorityFailureReason | null;
  replay_hash: string;
}>;

export type AutonomyAuthorityVisibilitySurface = Readonly<{
  autonomy_id: string;
  assigned_authority_level: AutonomyAuthorityLevel;
  current_authority_status: AutonomyAuthorityState;
  validation_results: readonly AutonomyAuthorityDecisionState[];
  denied_requests: readonly AutonomyAuthorityDecision[];
  approval_chain: readonly string[];
  governance_influence: string;
  constitutional_influence: string;
  policy_influence: string;
  execution_permissions: readonly AutonomyActionType[];
  replay_references: readonly string[];
  authority_history: readonly AutonomyAuthorityDecision[];
  hidden_decisions_visible: false;
}>;

export type AutonomyAuthorityFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  state_context: AutonomyStateContext;
  assignment: AutonomyAuthorityAssignment;
  decision: AutonomyAuthorityDecision;
  validation: AutonomyAuthorityValidationResult;
  ledger: AutonomyAuthorityAuditLedger;
  replay: AutonomyAuthorityReplayResult;
  visibility: AutonomyAuthorityVisibilitySurface;
}>;
