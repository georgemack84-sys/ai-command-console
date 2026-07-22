import type { ArbitrationResult, ArbitrationRulesEngineResult } from "@/types/decision-arbitration-rules-engine";
import type { TradeoffExplanationGeneratorResult } from "@/types/decision-tradeoff-explanation-generator";

export type EscalationDestination =
  | "Operator"
  | "Governance"
  | "Certification"
  | "Simulation"
  | "Mission Review"
  | "Recovery Review";

export type EscalationRuleId =
  | "low_confidence_rule"
  | "policy_disagreement_rule"
  | "authority_uncertainty_rule"
  | "certification_dependency_rule"
  | "mission_ambiguity_rule"
  | "constitutional_uncertainty_rule"
  | "resource_exhaustion_rule";

export type EscalationDecisionType = "NO_ESCALATION_REQUIRED" | "SINGLE_ESCALATION" | "MULTIPLE_COORDINATED_ESCALATIONS";

export type EscalationLifecycleState = "PENDING" | "VALIDATED" | "ROUTED" | "ACKNOWLEDGED" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";

export type EscalationRuleEvaluation = Readonly<{
  rule_id: EscalationRuleId;
  triggered: boolean;
  destination?: EscalationDestination;
  reason: string;
  priority: number;
  integrity_hash: string;
}>;

export type EscalationRequest = Readonly<{
  escalation_id: string;
  arbitration_id: string;
  conflict_id: string;
  escalation_reason: string;
  escalation_destination: EscalationDestination;
  triggering_rules: readonly EscalationRuleId[];
  supporting_evidence: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  operator_action_required: boolean;
  advisory_only: true;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type EscalationQueueEntry = Readonly<{
  queue_id: string;
  escalation_id: string;
  conflict_id: string;
  arbitration_id: string;
  destination: EscalationDestination;
  lifecycle_state: EscalationLifecycleState;
  constitutional_priority: number;
  governance_priority: number;
  severity_priority: number;
  destination_priority: number;
  mission_priority: number;
  conflict_order_key: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type EscalationLifecycleTransition = Readonly<{
  transition_id: string;
  escalation_id: string;
  previous_state: EscalationLifecycleState;
  new_state: EscalationLifecycleState;
  transition_valid: boolean;
  replay_ref: string;
  transition_timestamp: string;
  integrity_hash: string;
}>;

export type EscalationRecord = Readonly<{
  escalation_id: string;
  conflict_id: string;
  arbitration_id: string;
  destination: EscalationDestination;
  escalation_reason: string;
  lifecycle_state: EscalationLifecycleState;
  routing_path: readonly EscalationDestination[];
  decision_refs: readonly string[];
  replay_ref: string;
  created_timestamp: string;
  closed_timestamp?: string;
  integrity_hash: string;
}>;

export type EscalationWorkflowFailureReason =
  | "NO_ESCALATION_REQUIRED"
  | "MISSING_ARBITRATION_RECORDS"
  | "INVALID_ESCALATION_DESTINATION"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_CONSTITUTIONAL_METADATA"
  | "INVALID_AUTHORITY_ASSIGNMENT"
  | "REPLAY_CORRUPTION"
  | "QUEUE_ORDERING_INCONSISTENT"
  | "INTEGRITY_HASH_MISMATCH"
  | "UNAUTHORIZED_ROUTING_ATTEMPT"
  | "CROSS_TENANT_ROUTING"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "ADVISORY_ONLY_VIOLATION"
  | "ESCALATION_LEDGER_FAILED";

export type EscalationValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly EscalationWorkflowFailureReason[];
  checks: Readonly<{
    destination_valid: boolean;
    governance_valid: boolean;
    constitutional_valid: boolean;
    authority_valid: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    lifecycle_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type EscalationWorkflowInput = Readonly<{
  arbitration_result?: ArbitrationRulesEngineResult;
  explanation_result?: TradeoffExplanationGeneratorResult;
  arbitrations?: readonly ArbitrationResult[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type EscalationWorkflowResult = Readonly<{
  escalation_status: "PASS" | "NO_ESCALATION" | "FAIL";
  fail_closed: boolean;
  decision_type: EscalationDecisionType;
  rule_evaluations: readonly EscalationRuleEvaluation[];
  requests: readonly EscalationRequest[];
  queue: readonly EscalationQueueEntry[];
  transitions: readonly EscalationLifecycleTransition[];
  validations: readonly EscalationValidation[];
  ledger_records: readonly EscalationRecord[];
  replay_hash: string;
  failures: readonly EscalationWorkflowFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type EscalationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  escalation_refs: readonly string[];
  queue_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly EscalationWorkflowFailureReason[];
  integrity_hash: string;
}>;

export type EscalationObservability = Readonly<{
  escalations_generated: number;
  escalations_by_destination: Readonly<Record<EscalationDestination, number>>;
  escalation_reasons: Readonly<Record<EscalationRuleId, number>>;
  governance_escalations: number;
  operator_escalations: number;
  certification_escalations: number;
  simulation_requests: number;
  mission_review_requests: number;
  recovery_review_requests: number;
  queue_depth: number;
  average_routing_latency: number;
  replay_success_rate: number;
  validation_failures: number;
  integrity_failures: number;
}>;

export type EscalationWorkflowFoundation = Readonly<{
  workflow_version: "conflict-escalation-workflow/v1";
  destinations: readonly EscalationDestination[];
  destination_priority: readonly EscalationDestination[];
  lifecycle_states: readonly EscalationLifecycleState[];
  result: EscalationWorkflowResult;
  replay: EscalationReplay;
  observability: EscalationObservability;
}>;
