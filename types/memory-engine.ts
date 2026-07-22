export type MemoryEngineDecision = "MEMORY_ENGINE_CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "NOT_CERTIFIED" | "FAIL_CLOSED";
export type MemoryEngineFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "W2_3_CAPABILITY_REGISTRY_INVALID"
  | "W2_4_SKILL_REGISTRY_INVALID"
  | "W2_5_AUTHORITY_VALIDATOR_INVALID"
  | "W2_6_POLICY_GATE_INVALID"
  | "W2_7_SAFETY_GATE_INVALID"
  | "W2_8_PLANNING_ENGINE_INVALID"
  | "WORKING_MEMORY_MISSING"
  | "WORKING_MEMORY_NON_DETERMINISTIC"
  | "RUNTIME_ISOLATION_FAILED"
  | "WORKING_MEMORY_EXPIRATION_MISSING"
  | "SEMANTIC_MEMORY_MISSING"
  | "KNOWLEDGE_VALIDATION_MISSING"
  | "SEMANTIC_RETRIEVAL_NON_DETERMINISTIC"
  | "PROCEDURAL_MEMORY_MISSING"
  | "PROCEDURE_RETRIEVAL_INVALID"
  | "EPISODIC_MEMORY_MISSING"
  | "EPISODIC_REPLAY_INVALID"
  | "PROVENANCE_ENGINE_MISSING"
  | "PROVENANCE_NOT_IMMUTABLE"
  | "SOURCE_ATTRIBUTION_MISSING"
  | "MEMORY_IDENTIFIER_NOT_UNIQUE"
  | "MEMORY_OWNER_MISSING"
  | "MEMORY_TENANT_NAMESPACE_MISSING"
  | "MEMORY_GOVERNANCE_MISSING"
  | "AUTHORITY_POLICY_SAFETY_BYPASSED"
  | "RETENTION_POLICY_MISSING"
  | "DELETION_APPROVAL_BYPASSED"
  | "MEMORY_UPDATE_DESTROYS_HISTORY"
  | "RETRIEVAL_SERVICE_MISSING"
  | "RETRIEVAL_NON_DETERMINISTIC"
  | "RETRIEVAL_EXPLANATION_MISSING"
  | "RETRIEVAL_CONFIDENCE_MISSING"
  | "TENANT_ISOLATION_FAILED"
  | "MEMORY_API_MISSING"
  | "GOVERNANCE_API_MISSING"
  | "RETRIEVAL_API_MISSING"
  | "MEMORY_EVIDENCE_MISSING"
  | "MEMORY_EVIDENCE_NOT_IMMUTABLE"
  | "MEMORY_REPLAY_INVALID"
  | "MEMORY_ENGINE_CERTIFICATION_FAILED";
export type MemoryEngineScenario = "BASELINE" | "CERTIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | MemoryEngineFailure;
export type MemoryEngineInput = Readonly<{ scenario?: MemoryEngineScenario; seed?: string }>;
export type MemoryKind = "Working" | "Semantic" | "Procedural" | "Episodic";
export type WorkingMemory = Readonly<{ service_id: string; active_context: boolean; execution_state: boolean; temporary_variables: boolean; active_conversation: boolean; runtime_facts: boolean; planning_context: boolean; reasoning_context: boolean; task_context: boolean; execution_cache: boolean; low_latency: boolean; deterministic_updates: boolean; scoped_lifetime: boolean; automatic_expiration: boolean; runtime_isolation: boolean; integrity_hash: string }>;
export type SemanticMemory = Readonly<{ store_id: string; concepts: boolean; entities: boolean; relationships: boolean; ontologies: boolean; knowledge_graphs: boolean; embeddings: boolean; structured_knowledge: boolean; validated_facts: boolean; semantic_retrieval: boolean; similarity_search: boolean; relationship_traversal: boolean; concept_discovery: boolean; knowledge_validation: boolean; integrity_hash: string }>;
export type ProceduralMemory = Readonly<{ repository_id: string; workflows: boolean; procedures: boolean; playbooks: boolean; execution_patterns: boolean; learned_methods: boolean; reusable_plans: boolean; operational_recipes: boolean; procedure_retrieval: boolean; execution_guidance: boolean; workflow_reuse: boolean; capability_recommendations: boolean; integrity_hash: string }>;
export type EpisodicMemory = Readonly<{ store_id: string; conversations: boolean; completed_tasks: boolean; decisions: boolean; mission_history: boolean; execution_outcomes: boolean; observations: boolean; operational_events: boolean; reasoning_history: boolean; historical_retrieval: boolean; timeline_navigation: boolean; experience_search: boolean; replay_support: boolean; integrity_hash: string }>;
export type ProvenanceEngine = Readonly<{ registry_id: string; globally_unique_identifier: boolean; owner: boolean; creator: boolean; originating_agent: boolean; originating_capability: boolean; originating_skill: boolean; authority: boolean; policy: boolean; evidence: boolean; timestamp: boolean; tenant: boolean; namespace: boolean; trust_level: boolean; confidence: boolean; source_references: boolean; validation_history: boolean; immutable_lineage: boolean; source_attribution: boolean; dependency_tracing: boolean; integrity_hash: string }>;
export type MemoryGovernance = Readonly<{ engine_id: string; ownership: boolean; authority_enforcement: boolean; policy_enforcement: boolean; retention: boolean; expiration: boolean; archival: boolean; deletion_approval: boolean; modification_approval: boolean; trust_validation: boolean; replay_validation: boolean; lifecycle_governance: boolean; retention_management: boolean; authority_policy_safety_required: boolean; tenant_isolation: boolean; integrity_hash: string }>;
export type RetrievalService = Readonly<{ engine_id: string; keyword_search: boolean; semantic_search: boolean; vector_search: boolean; hybrid_search: boolean; contextual_retrieval: boolean; authority_aware_retrieval: boolean; tenant_aware_retrieval: boolean; replay_retrieval: boolean; ranking: boolean; filtering: boolean; explainable_retrieval: boolean; deterministic_replay: boolean; confidence_scoring: boolean; provenance_chain: boolean; policy_evaluation: boolean; authority_evaluation: boolean; integrity_hash: string }>;
export type MemoryRegistry = Readonly<{ registry_id: string; memory_metadata: boolean; versions: boolean; ownership: boolean; lineage: boolean; evidence: boolean; classifications: boolean; lifecycle_state: boolean; immutable_history: boolean; version_history: boolean; deterministic_lookup: boolean; integrity_hash: string }>;
export type MemoryEngineApis = Readonly<{ api_id: string; create: boolean; retrieve: boolean; update: boolean; archive: boolean; restore: boolean; expire: boolean; validate: boolean; certify: boolean; semantic_search: boolean; keyword_search: boolean; vector_search: boolean; hybrid_search: boolean; timeline_query: boolean; contextual_query: boolean; authority_validation: boolean; policy_validation: boolean; retention_checks: boolean; lifecycle_management: boolean; provenance_verification: boolean; stable: boolean; integrity_hash: string }>;
export type MemoryEvidence = Readonly<{ ledger_id: string; records: readonly string[]; creation_records: boolean; retrieval_records: boolean; provenance_records: boolean; governance_decisions: boolean; retention_decisions: boolean; version_histories: boolean; lineage_graphs: boolean; replay_evidence: boolean; audit_events: boolean; validation_reports: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type MemoryEngineReadiness = Readonly<{ readiness_id: string; decision: MemoryEngineDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; capability_registry_ready: boolean; skill_registry_ready: boolean; authority_validator_ready: boolean; policy_gate_ready: boolean; safety_gate_ready: boolean; planning_engine_ready: boolean; working_ready: boolean; semantic_ready: boolean; procedural_ready: boolean; episodic_ready: boolean; provenance_ready: boolean; governance_ready: boolean; retrieval_ready: boolean; registry_ready: boolean; apis_ready: boolean; evidence_ready: boolean; retrieval_gate_enforced: boolean; tenant_isolation_preserved: boolean; failures: readonly MemoryEngineFailure[]; integrity_hash: string }>;
export type MemoryEngineResult = Readonly<{ phase_version: "memory-engine/w2.9"; phase_identifier: "MemoryEngine"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; capability_registry_ref: "capability-registry/w2.3"; skill_registry_ref: "skill-registry/w2.4"; authority_validator_ref: "authority-validator/w2.5"; policy_gate_ref: "policy-gate/w2.6"; safety_gate_ref: "safety-gate/w2.7"; planning_engine_ref: "planning-engine/w2.8"; memory_kinds: readonly MemoryKind[]; working: WorkingMemory; semantic: SemanticMemory; procedural: ProceduralMemory; episodic: EpisodicMemory; provenance: ProvenanceEngine; governance: MemoryGovernance; retrieval: RetrievalService; registry: MemoryRegistry; apis: MemoryEngineApis; evidence: MemoryEvidence; readiness: MemoryEngineReadiness; replay_hash: string; integrity_hash: string }>;
export type MemoryEngineValidation = Readonly<{ valid: boolean; decision: MemoryEngineDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; working_valid: boolean; semantic_valid: boolean; procedural_valid: boolean; episodic_valid: boolean; provenance_valid: boolean; governance_valid: boolean; retrieval_valid: boolean; registry_valid: boolean; apis_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly MemoryEngineFailure[]; integrity_hash: string }>;
export type MemoryEngineBundle = Readonly<{ doctrine: Readonly<{ version: "memory-engine/w2.9"; owns_working_memory: true; owns_semantic_memory: true; owns_procedural_memory: true; owns_episodic_memory: true; owns_memory_provenance: true; owns_memory_governance: true; owns_retrieval_services: true; owns_memory_registry: true; owns_memory_evidence: true; authoritative_memory_subsystem: true; certification_gate: "Memory Engine Certification Gate" }>; result: MemoryEngineResult; validation: MemoryEngineValidation }>;
