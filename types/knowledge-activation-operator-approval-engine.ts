import type { KnowledgeRepositoryProjection } from "@/types/knowledge-repository-evolution-ledger";

export type KnowledgeActivationState = "CANDIDATE" | "CERTIFIED" | "PENDING_GOVERNANCE" | "PENDING_OPERATOR_APPROVAL" | "APPROVED" | "ACTIVATED" | "SUPERSEDED" | "ROLLED_BACK" | "RETIRED" | "ARCHIVED" | "REJECTED";
export type OperatorApprovalStatus = "APPROVED" | "REJECTED" | "DEFERRED" | "ADDITIONAL_REVIEW_REQUESTED" | "MISSING";
export type KnowledgeActivationLedgerEventType = "ACTIVATION_REQUESTED" | "GOVERNANCE_AUTHORIZED" | "OPERATOR_APPROVED" | "OPERATOR_REJECTED" | "ACTIVATION_RECORDED" | "ROLLBACK_RECORDED" | "SUPERSESSION_RECORDED" | "RETIREMENT_RECORDED" | "ACTIVATION_REJECTED";
export type KnowledgeActivationScenario = "BASELINE" | "INCOMPLETE_CERTIFICATION" | "VALIDATION_FAILURE" | "REPLAY_MISMATCH" | "INTEGRITY_FAILURE" | "GOVERNANCE_REJECTION" | "CONSTITUTIONAL_FAILURE" | "AUTHORITY_CONFLICT" | "OPERATOR_REJECTION" | "MISSING_OPERATOR_APPROVAL" | "UNSATISFIED_DEPENDENCIES" | "DUPLICATE_ACTIVATION" | "AUTONOMOUS_APPROVAL_ATTEMPT" | "AUTONOMOUS_ACTIVATION_ATTEMPT" | "REPOSITORY_MUTATION_ATTEMPT" | "HISTORY_REWRITE_ATTEMPT" | "ACTIVATION_HISTORY_DELETION_ATTEMPT" | "CROSS_TENANT_ACTIVATION";
export type KnowledgeActivationFailure = "CERTIFICATION_INCOMPLETE" | "VALIDATION_FAILED" | "REPLAY_MISMATCH_DETECTED" | "INTEGRITY_FAILURE_DETECTED" | "GOVERNANCE_REJECTED" | "CONSTITUTIONAL_VALIDATION_FAILED" | "AUTHORITY_CONFLICT_DETECTED" | "OPERATOR_REJECTED" | "OPERATOR_APPROVAL_MISSING" | "DEPENDENCIES_UNSATISFIED" | "DUPLICATE_ACTIVATION_DETECTED" | "AUTONOMOUS_APPROVAL_ATTEMPTED" | "AUTONOMOUS_ACTIVATION_ATTEMPTED" | "REPOSITORY_MUTATION_ATTEMPTED" | "HISTORY_REWRITE_ATTEMPTED" | "ACTIVATION_HISTORY_DELETION_ATTEMPTED" | "CROSS_TENANT_ACTIVATION_DETECTED";

export type KnowledgeActivationRecord = Readonly<{
  activation_id: string;
  knowledge_id: string;
  artifact_version: string;
  activation_version: "knowledge-activation-operator-approval-engine/v8ALT.9.9";
  artifact_type: string;
  artifact_category: string;
  repository_reference: string;
  tenant_id: string;
  operator_id: string;
  approval_status: OperatorApprovalStatus;
  approval_timestamp: "1970-01-01T00:00:00.000Z";
  approval_reason: string;
  governance_reference: string;
  constitutional_reference: string;
  authority_reference: string;
  replay_validation: "PASS" | "FAIL";
  integrity_validation: "PASS" | "FAIL";
  dependency_validation: "PASS" | "FAIL";
  activation_state: KnowledgeActivationState;
  supersession_state: "NONE" | "SUPERSEDED";
  rollback_reference: string | null;
  replay_reference: readonly string[];
  lineage_reference: readonly string[];
  evidence_chain: readonly string[];
  explanation: readonly string[];
  human_authorized: boolean;
  autonomous_activation_authorized: false;
  autonomous_approval_authorized: false;
  runtime_behavior_modification_authorized: false;
  repository_mutation_authorized: boolean;
  history_rewrite_authorized: boolean;
  activation_history_deletion_authorized: boolean;
  integrity_hash: string;
}>;

export type KnowledgeActivationLedgerEntry = Readonly<{
  activation_ledger_entry_id: string;
  activation_id: string | null;
  knowledge_id: string | null;
  event_type: KnowledgeActivationLedgerEventType;
  event_sequence: number;
  operator_id: string;
  governance_reference: string;
  replay_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type KnowledgeActivationAuditRecord = Readonly<{
  audit_id: string;
  activation_id: string | null;
  rejection_reason: KnowledgeActivationFailure;
  immutable: true;
  append_only: true;
  replay_reference: string;
  integrity_hash: string;
}>;

export type KnowledgeActivationRepository = Readonly<{
  repository_id: string;
  source_repository_id: string | null;
  final_state: "KNOWLEDGE_ACTIVATION_RECORDED" | "KNOWLEDGE_ACTIVATION_REJECTED";
  activation_records: readonly KnowledgeActivationRecord[];
  active_records: readonly KnowledgeActivationRecord[];
  approval_records: readonly KnowledgeActivationRecord[];
  rollback_records: readonly KnowledgeActivationRecord[];
  ledger_entries: readonly KnowledgeActivationLedgerEntry[];
  audit_records: readonly KnowledgeActivationAuditRecord[];
  failures: readonly KnowledgeActivationFailure[];
  human_authorization_required: true;
  autonomous_activation_authorized: false;
  autonomous_approval_authorized: false;
  runtime_behavior_modification_authorized: false;
  repository_mutation_authorized: false;
  history_rewrite_authorized: false;
  integrity_hash: string;
}>;

export type KnowledgeActivationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  certification_complete: boolean;
  validation_passed: boolean;
  replay_valid: boolean;
  integrity_verified: boolean;
  governance_authorized: boolean;
  constitutional_valid: boolean;
  authority_preserved: boolean;
  operator_approved: boolean;
  dependencies_satisfied: boolean;
  duplicate_activations_absent: boolean;
  tenant_isolated: boolean;
  autonomous_activation_blocked: boolean;
  autonomous_approval_blocked: boolean;
  runtime_behavior_unchanged: boolean;
  repository_immutable: boolean;
  fail_closed: boolean;
  failures: readonly KnowledgeActivationFailure[];
  validation_hash: string;
}>;

export type KnowledgeActivationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  activation_count: number;
  active_count: number;
  approval_count: number;
  rollback_count: number;
  ledger_count: number;
  audit_count: number;
  failure_count: number;
  human_authorization_required: true;
  autonomous_activation_authorized: false;
  runtime_behavior_modification_authorized: false;
  integrity_hash: string;
}>;

export type KnowledgeActivationInput = Readonly<{ scenario?: KnowledgeActivationScenario; repository?: KnowledgeActivationRepository; knowledgeRepository?: KnowledgeRepositoryProjection; operatorId?: string }>;

export type KnowledgeActivationOperatorApprovalEngineBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "knowledge-activation-operator-approval-engine/v8ALT.9.9";
    final_state: "KNOWLEDGE_ACTIVATION_OPERATOR_APPROVAL_READY";
    activation_states: readonly KnowledgeActivationState[];
    event_types: readonly KnowledgeActivationLedgerEventType[];
    principles: readonly string[];
  }>;
  repository: KnowledgeActivationRepository;
  validation: KnowledgeActivationValidationResult;
  observability: KnowledgeActivationObservabilitySurface;
}>;
