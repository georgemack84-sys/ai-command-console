export type MemoryKind = "WORKING" | "EPISODIC" | "SEMANTIC";
export type RetrievalMode = "EXACT" | "SEMANTIC" | "HYBRID" | "GRAPH" | "LINEAGE" | "EPISODIC" | "TEMPORAL";
export type MemoryLifecycleState = "CREATED" | "INDEXED" | "ACTIVE" | "REFERENCED" | "UPDATED" | "SUPERSEDED" | "ARCHIVED" | "RETIRED";
export type MemoryCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type MemoryKnowledgeFailure =
  | "P3_3_RUNTIME_ORCHESTRATION_INVALID"
  | "MEMORY_HIERARCHY_INCOMPLETE"
  | "WORKING_MEMORY_PERSISTED_WITHOUT_PROMOTION"
  | "EPISODIC_HISTORY_MUTATED"
  | "SEMANTIC_KNOWLEDGE_UNSTRUCTURED"
  | "KNOWLEDGE_INDEX_INCOMPLETE"
  | "RETRIEVAL_NON_DETERMINISTIC"
  | "RETRIEVAL_AUTHORIZATION_BYPASS"
  | "MEMORY_GOVERNANCE_BYPASS"
  | "ILLEGAL_MEMORY_LIFECYCLE_TRANSITION"
  | "EVIDENCE_LINEAGE_MISSING"
  | "CCI_STORAGE_INTEGRATION_INVALID"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "UNAUTHORIZED_KNOWLEDGE_SHARING"
  | "OBSERVABILITY_GAP"
  | "TENANT_ISOLATION_VIOLATION"
  | "CERTIFICATION_PRUNED";

export type MemoryKnowledgeScenario = "BASELINE" | MemoryKnowledgeFailure;
export type MemoryKnowledgeInput = Readonly<{ scenario?: MemoryKnowledgeScenario; tenant_id?: string }>;

export type MemoryArchitecture = Readonly<{
  architecture_id: string;
  memory_hierarchy: readonly MemoryKind[];
  memory_taxonomy_refs: readonly string[];
  storage_contract_refs: readonly string[];
  retrieval_boundary_refs: readonly string[];
  governance_boundary_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type MemoryObject = Readonly<{
  memory_id: string;
  kind: MemoryKind;
  lifecycle_state: MemoryLifecycleState;
  owner_agent_ref: string;
  tenant_id: string;
  content_ref: string;
  promoted_from_working_memory: boolean;
  immutable_history: boolean;
  structured_knowledge: boolean;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type KnowledgeIndex = Readonly<{
  index_id: string;
  indexed_memory_refs: readonly string[];
  metadata_indexed: boolean;
  semantic_indexed: boolean;
  relationship_indexed: boolean;
  version_indexed: boolean;
  evidence_indexed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type RetrievalServiceRecord = Readonly<{
  retrieval_id: string;
  modes: readonly RetrievalMode[];
  query_ref: string;
  result_order: readonly string[];
  ranking_deterministic: boolean;
  filtering_deterministic: boolean;
  authorization_enforced: boolean;
  retrieval_evidence_refs: readonly string[];
  replayable: boolean;
  integrity_hash: string;
}>;

export type MemoryGovernanceRecord = Readonly<{
  governance_id: string;
  authorization_validated: boolean;
  ownership_validated: boolean;
  visibility_validated: boolean;
  approval_policy_validated: boolean;
  constitutional_validation: boolean;
  tenant_isolation: boolean;
  immutable_evidence_protected: boolean;
  hidden_mutation_prevented: boolean;
  integrity_hash: string;
}>;

export type MemoryLifecycleRecord = Readonly<{
  lifecycle_id: string;
  states: readonly MemoryLifecycleState[];
  legal_transitions: readonly string[];
  attempted_transition: string;
  transition_legal: boolean;
  retention_policy_enforced: boolean;
  archival_validated: boolean;
  retirement_validated: boolean;
  supersession_deterministic: boolean;
  integrity_hash: string;
}>;

export type StorageIntegrationRecord = Readonly<{
  storage_id: string;
  cci_storage_ref: string;
  persistence_validated: boolean;
  storage_abstraction_validated: boolean;
  replication_validated: boolean;
  durability_confirmed: boolean;
  encryption_operational: boolean;
  integrity_validated: boolean;
  recovery_validated: boolean;
  integrity_hash: string;
}>;

export type KnowledgeSharingRecord = Readonly<{
  sharing_id: string;
  shared_knowledge_refs: readonly string[];
  publication_governed: boolean;
  subscriptions_governed: boolean;
  ownership_preserved: boolean;
  lineage_preserved: boolean;
  tenant_isolation_preserved: boolean;
  unauthorized_propagation_prevented: boolean;
  integrity_hash: string;
}>;

export type MemoryEvidenceEntry = Readonly<{
  evidence_id: string;
  event_type: "CREATED" | "INDEXED" | "RETRIEVED" | "UPDATED" | "SUPERSEDED" | "ARCHIVED" | "RETIRED" | "REPLAY_VALIDATED" | "SHARED" | "CERTIFIED";
  memory_ref: string;
  evidence_refs: readonly string[];
  lineage_ref: string;
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type MemoryReplayValidation = Readonly<{
  replay_validation_id: string;
  working_memory_reconstructed: boolean;
  episodic_memory_reconstructed: boolean;
  semantic_memory_reconstructed: boolean;
  retrieval_reconstructed: boolean;
  temporal_consistency: boolean;
  version_resolution_deterministic: boolean;
  snapshot_recovery_validated: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type MemoryObservabilityRecord = Readonly<{
  observability_id: string;
  metrics: Readonly<{
    memory_usage: number;
    retrieval_latency_ms: number;
    cache_efficiency: number;
    indexing_health: "HEALTHY" | "DEGRADED" | "BLOCKED";
    retrieval_success: number;
    lifecycle_events: number;
    governance_violations: number;
  }>;
  dashboards_validated: boolean;
  audit_logging_complete: boolean;
  complete_visibility: boolean;
  integrity_hash: string;
}>;

export type MemoryCertification = Readonly<{
  certification_id: string;
  outcome: MemoryCertificationOutcome;
  certified: boolean;
  architecture_complete: boolean;
  memory_types_integrated: boolean;
  retrieval_deterministic: boolean;
  retrieval_authorized: boolean;
  governance_enforced: boolean;
  evidence_lineage_complete: boolean;
  lifecycle_governed: boolean;
  storage_certified: boolean;
  replay_compatible: boolean;
  knowledge_sharing_governed: boolean;
  observability_complete: boolean;
  tenant_isolation_preserved: boolean;
  failures: readonly MemoryKnowledgeFailure[];
  integrity_hash: string;
}>;

export type MemoryKnowledgeResult = Readonly<{
  phase_version: "caf-memory-knowledge/v3.4";
  phase_identifier: "CafMemoryKnowledge";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  runtime_orchestration_ref: "caf-runtime-orchestration/v3.3";
  cci_registry_ref: "Program 2 - CCI Registry";
  cci_evidence_ref: "Program 2 - CCI Evidence";
  cci_storage_ref: "Program 2 - CCI Storage";
  architecture: MemoryArchitecture;
  memory_objects: readonly MemoryObject[];
  knowledge_index: KnowledgeIndex;
  retrieval: RetrievalServiceRecord;
  governance: MemoryGovernanceRecord;
  lifecycle: MemoryLifecycleRecord;
  storage: StorageIntegrationRecord;
  sharing: KnowledgeSharingRecord;
  evidence: readonly MemoryEvidenceEntry[];
  replay_validation: MemoryReplayValidation;
  observability: MemoryObservabilityRecord;
  certification: MemoryCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MemoryKnowledgeValidation = Readonly<{
  valid: boolean;
  outcome: MemoryCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  architecture_valid: boolean;
  memory_valid: boolean;
  retrieval_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly MemoryKnowledgeFailure[];
  integrity_hash: string;
}>;

export type MemoryKnowledgeBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-memory-knowledge/v3.4";
    consumes_runtime_orchestration: true;
    consumes_cci_registry_evidence_storage: true;
    uncontrolled_learning_prohibited: true;
    deterministic_retrieval_required: true;
    immutable_memory_lineage_required: true;
    cross_tenant_intelligence_prohibited: true;
  }>;
  result: MemoryKnowledgeResult;
  validation: MemoryKnowledgeValidation;
}>;
