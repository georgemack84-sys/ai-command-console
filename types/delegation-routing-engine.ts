import type { AuthorityValidationFailureReason, AuthorityValidationPackage } from "@/types/authority-validation-engine";
import type { TaskExecutionCategory } from "@/types/task-classification-engine";

export type DelegationRoutingState =
  | "PLANNING"
  | "OWNER_SELECTED"
  | "ROUTING_GENERATED"
  | "CONTINGENCY_PREPARED"
  | "EXPLANATION_GENERATED"
  | "VALIDATED"
  | "READY_FOR_EXECUTION"
  | "BLOCKED"
  | "WAITING_OPERATOR"
  | "ROUTING_FAILED"
  | "AUTHORITY_FAILURE"
  | "DEPENDENCY_FAILURE"
  | "FAILED";

export type DelegationRoutingFailureReason =
  | "MULTIPLE_PRIMARY_EXECUTION_OWNERS"
  | "NONDETERMINISTIC_ROUTING"
  | "UNRESOLVED_DEPENDENCIES"
  | "UNAUTHORIZED_DELEGATE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "PRIVILEGE_ESCALATION"
  | "UNCERTIFIED_FALLBACK_DELEGATE"
  | "INVALID_ROLLBACK_PLAN"
  | "REPLAY_INCONSISTENCY"
  | "MISSING_EXPLAINABILITY"
  | "TENANT_ISOLATION_VIOLATION"
  | "INVALID_AUTHORITY_VALIDATION"
  | "INTEGRITY_HASH_MISMATCH";

export type DelegationRoutingScenario =
  | "BASELINE"
  | "OPERATOR_ROUTE"
  | "EXTERNAL_ROUTE"
  | "BLOCKED_AUTHORITY"
  | "UNRESOLVED_DEPENDENCIES"
  | "MULTIPLE_OWNERS"
  | "NONDETERMINISTIC_ROUTING"
  | "UNAUTHORIZED_DELEGATE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "PRIVILEGE_ESCALATION"
  | "UNCERTIFIED_FALLBACK"
  | "INVALID_ROLLBACK"
  | "REPLAY_INCONSISTENCY"
  | "MISSING_EXPLAINABILITY"
  | "TENANT_VIOLATION"
  | "HASH_MISMATCH";

export type DelegationPlan = Readonly<{
  plan_id: string;
  task_id: string;
  delegate_id: string;
  delegate_type: TaskExecutionCategory;
  authority_reference: string;
  dependencies: readonly string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  replay_reference: string;
  lineage_reference: string;
  immutable: true;
  plan_hash: string;
}>;

export type RoutingDecision = Readonly<{
  routing_id: string;
  primary_execution_owner: string;
  primary_owner_type: TaskExecutionCategory;
  routing_sequence: readonly string[];
  escalation_path: readonly string[];
  fallback_delegate: string | null;
  fallback_authority_ceiling: string;
  governance_reference: string;
  tenant_id: string;
  route_state: DelegationRoutingState;
  replay_reference: string;
  lineage_reference: string;
  routing_hash: string;
}>;

export type ContingencyPlan = Readonly<{
  contingency_id: string;
  alternate_delegate: string | null;
  operator_takeover: Readonly<{
    takeover_required: boolean;
    operator_reference: string;
    trigger: string;
  }>;
  rollback_path: Readonly<{
    rollback_trigger: string;
    rollback_scope: readonly string[];
    rollback_sequence: readonly string[];
    authority_required: string;
    protected_checkpoints: readonly string[];
    recovery_boundaries: readonly string[];
  }>;
  retry_strategy: Readonly<{
    retry_conditions: readonly string[];
    retry_limit: number;
    retry_delay_ms: number;
    validation_before_retry: boolean;
    escalation_threshold: number;
    termination_conditions: readonly string[];
  }>;
  governance_policy_modified: false;
  constitutional_policy_modified: false;
  contingency_hash: string;
}>;

export type RoutingExplainabilityRecord = Readonly<{
  explanation_id: string;
  why_delegated: string;
  authority_used: readonly string[];
  policies_satisfied: readonly string[];
  risks_evaluated: readonly string[];
  confidence_rationale: string;
  dependency_explanation: string;
  governance_evidence: readonly string[];
  explanation_hash: string;
}>;

export type DelegationRoutingValidationResult = Readonly<{
  validation_id: string;
  routing_package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly DelegationRoutingFailureReason[];
  exactly_one_primary_owner: boolean;
  authority_valid: boolean;
  dependencies_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  contingency_valid: boolean;
  explainability_complete: boolean;
  tenant_isolated: boolean;
  replay_ready: boolean;
  integrity_verified: boolean;
  ready_for_delegation_certification: boolean;
  validation_hash: string;
}>;

export type DelegationRoutingReplayResult = Readonly<{
  replay_id: string;
  routing_package_id: string;
  reconstructed_owner: string;
  reconstructed_sequence: readonly string[];
  reconstructed_fallback_delegate: string | null;
  reconstructed_contingency_hash: string;
  reconstructed_explanation_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: DelegationRoutingFailureReason | null;
  replay_hash: string;
}>;

export type DelegationRoutingPackage = Readonly<{
  package_id: string;
  engine_version: "delegation-routing-engine/v8D.4";
  source_authority_validation: AuthorityValidationPackage;
  delegation_plan: DelegationPlan;
  routing_decision: RoutingDecision;
  contingency_plan: ContingencyPlan;
  explainability: RoutingExplainabilityRecord;
  validation: DelegationRoutingValidationResult;
  replay: DelegationRoutingReplayResult;
  mapped_authority_failures: readonly AuthorityValidationFailureReason[];
  package_hash: string;
}>;

export type DelegationRoutingVisibilitySurface = Readonly<{
  package_id: string;
  task_id: string;
  primary_execution_owner: string;
  route_state: DelegationRoutingState;
  fallback_delegate: string | null;
  operator_takeover_required: boolean;
  validation_state: "PASS" | "FAIL";
  failure_reasons: readonly DelegationRoutingFailureReason[];
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type DelegationRoutingFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "delegation-routing-engine/v8D.4";
    states: readonly DelegationRoutingState[];
  }>;
  package: DelegationRoutingPackage;
  visibility: DelegationRoutingVisibilitySurface;
}>;
