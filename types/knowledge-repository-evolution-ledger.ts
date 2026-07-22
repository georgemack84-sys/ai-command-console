import type { KnowledgeValidationRepository } from "@/types/knowledge-validation-governance-engine";

export type KnowledgeRepositoryLifecycleState = "RECEIVED" | "STORED" | "VERSIONED" | "READY_FOR_OPERATOR_APPROVAL" | "SUPERSEDED" | "RETIRED" | "ARCHIVED" | "REJECTED";
export type KnowledgeLedgerEventType = "ARTIFACT_RECEIVED" | "ARTIFACT_STORED" | "VERSION_RECORDED" | "READY_FOR_OPERATOR_APPROVAL" | "REPOSITORY_OPERATION_REJECTED";
export type KnowledgeRepositoryScenario = "BASELINE" | "DUPLICATE_IDENTIFIER" | "MISSING_VALIDATION" | "MISSING_CERTIFICATION_ELIGIBILITY" | "INCOMPLETE_LINEAGE" | "MISSING_REPLAY_REFERENCE" | "INTEGRITY_FAILURE" | "GOVERNANCE_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_CONFLICT" | "CORRUPTED_VERSION" | "OVERWRITE_ATTEMPT" | "DELETE_ATTEMPT" | "HISTORICAL_REWRITE_ATTEMPT" | "ACTIVATION_ATTEMPT" | "APPROVAL_BYPASS_ATTEMPT" | "CROSS_TENANT_ACCESS_ATTEMPT";
export type KnowledgeRepositoryFailure = "DUPLICATE_IDENTIFIER_DETECTED" | "VALIDATION_MISSING" | "CERTIFICATION_ELIGIBILITY_MISSING" | "INCOMPLETE_LINEAGE_DETECTED" | "REPLAY_REFERENCE_MISSING" | "INTEGRITY_FAILURE_DETECTED" | "GOVERNANCE_VIOLATION_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "AUTHORITY_CONFLICT_DETECTED" | "CORRUPTED_VERSION_DETECTED" | "OVERWRITE_ATTEMPT_REJECTED" | "DELETE_ATTEMPT_REJECTED" | "HISTORICAL_REWRITE_REJECTED" | "ACTIVATION_ATTEMPT_REJECTED" | "APPROVAL_BYPASS_REJECTED" | "CROSS_TENANT_ACCESS_REJECTED";

export type KnowledgeRepositoryRecord = Readonly<{
  knowledge_id: string;
  source_validation_id: string;
  artifact_name: string;
  artifact_type: string;
  semantic_version: string;
  tenant_id: string;
  lifecycle_state: KnowledgeRepositoryLifecycleState;
  certification_state: "READY_FOR_CERTIFICATION";
  approval_state: "OPERATOR_APPROVAL_REQUIRED";
  activation_state: "INACTIVE";
  contributing_missions: readonly string[];
  contributing_patterns: readonly string[];
  contributing_replays: readonly string[];
  parent_version: string | null;
  evidence_chain: readonly string[];
  replay_reference: readonly string[];
  lineage_reference: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  creation_timestamp: "1970-01-01T00:00:00.000Z";
  certification_timestamp: null;
  approval_timestamp: null;
  activation_timestamp: null;
  explanation: readonly string[];
  append_only: true;
  immutable: true;
  activation_authorized: boolean;
  operator_approval_bypass_authorized: boolean;
  governance_modification_authorized: boolean;
  historical_rewrite_authorized: boolean;
  delete_authorized: boolean;
  deterministic_signature: string;
  integrity_hash: string;
}>;

export type EvolutionLedgerEntry = Readonly<{
  ledger_entry_id: string;
  knowledge_id: string | null;
  event_type: KnowledgeLedgerEventType;
  event_sequence: number;
  previous_version: string | null;
  new_version: string | null;
  governance_reference: string;
  replay_reference: string;
  integrity_hash: string;
  operator_reference: "OPERATOR_APPROVAL_REQUIRED";
  timestamp: "1970-01-01T00:00:00.000Z";
}>;

export type KnowledgeLineageEdge = Readonly<{
  lineage_edge_id: string;
  knowledge_id: string;
  source_validation_id: string;
  evidence_chain: readonly string[];
  replay_reference: readonly string[];
  parent_version: string | null;
  integrity_hash: string;
}>;

export type KnowledgeRepositoryAuditRecord = Readonly<{
  audit_id: string;
  knowledge_id: string | null;
  rejection_reason: KnowledgeRepositoryFailure;
  immutable: true;
  append_only: true;
  replay_reference: string;
  integrity_hash: string;
}>;

export type KnowledgeRepositoryProjection = Readonly<{
  repository_id: string;
  source_validation_repository_id: string | null;
  final_state: "KNOWLEDGE_REPOSITORY_STORED" | "KNOWLEDGE_REPOSITORY_REJECTED";
  records: readonly KnowledgeRepositoryRecord[];
  ledger_entries: readonly EvolutionLedgerEntry[];
  lineage_graph: readonly KnowledgeLineageEdge[];
  audit_records: readonly KnowledgeRepositoryAuditRecord[];
  failures: readonly KnowledgeRepositoryFailure[];
  append_only: true;
  read_only_queries: true;
  activation_authorized: false;
  operator_approval_bypass_authorized: false;
  governance_modification_authorized: false;
  historical_rewrite_authorized: false;
  delete_authorized: false;
  integrity_hash: string;
}>;

export type KnowledgeRepositoryValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  identifiers_unique: boolean;
  validation_present: boolean;
  certification_eligible: boolean;
  lineage_complete: boolean;
  replay_ready: boolean;
  integrity_verified: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  append_only: true;
  read_only_queries: true;
  activation_blocked: boolean;
  operator_approval_required: boolean;
  fail_closed: boolean;
  failures: readonly KnowledgeRepositoryFailure[];
  validation_hash: string;
}>;

export type KnowledgeRepositoryObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  record_count: number;
  ledger_count: number;
  lineage_edge_count: number;
  audit_count: number;
  failure_count: number;
  append_only: true;
  read_only_queries: true;
  activation_authorized: false;
  integrity_hash: string;
}>;

export type KnowledgeRepositoryInput = Readonly<{ scenario?: KnowledgeRepositoryScenario; validationRepository?: KnowledgeValidationRepository; repository?: KnowledgeRepositoryProjection }>;

export type KnowledgeRepositoryEvolutionLedgerBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "knowledge-repository-evolution-ledger/v8ALT.9.8";
    final_state: "KNOWLEDGE_REPOSITORY_LEDGER_READY";
    lifecycle_states: readonly KnowledgeRepositoryLifecycleState[];
    event_types: readonly KnowledgeLedgerEventType[];
    principles: readonly string[];
  }>;
  repository: KnowledgeRepositoryProjection;
  validation: KnowledgeRepositoryValidationResult;
  observability: KnowledgeRepositoryObservabilitySurface;
}>;
