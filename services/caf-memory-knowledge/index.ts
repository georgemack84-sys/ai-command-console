import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runRuntimeOrchestration, validateRuntimeOrchestration } from "@/services/caf-runtime-orchestration";
import type {
  MemoryEvidenceEntry,
  MemoryKnowledgeBundle,
  MemoryKnowledgeFailure,
  MemoryKnowledgeInput,
  MemoryKnowledgeResult,
  MemoryKnowledgeScenario,
  MemoryKnowledgeValidation,
  MemoryCertificationOutcome,
  MemoryKind,
  MemoryLifecycleState,
  RetrievalMode,
} from "@/types/caf-memory-knowledge";

const VERSION = "caf-memory-knowledge/v3.4" as const;
const IDENTIFIER = "CafMemoryKnowledge" as const;
const KINDS: readonly MemoryKind[] = Object.freeze(["WORKING", "EPISODIC", "SEMANTIC"]);
const LIFECYCLE: readonly MemoryLifecycleState[] = Object.freeze(["CREATED", "INDEXED", "ACTIVE", "REFERENCED", "UPDATED", "SUPERSEDED", "ARCHIVED", "RETIRED"]);
const MODES: readonly RetrievalMode[] = Object.freeze(["EXACT", "SEMANTIC", "HYBRID", "GRAPH", "LINEAGE", "EPISODIC", "TEMPORAL"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: MemoryKnowledgeScenario): MemoryKnowledgeFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly MemoryKnowledgeFailure[], failure: MemoryKnowledgeFailure): boolean { return failures.includes(failure); }
function certOutcome(failures: readonly MemoryKnowledgeFailure[]): MemoryCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildEvidence(memoryRefs: readonly string[], failures: readonly MemoryKnowledgeFailure[]): readonly MemoryEvidenceEntry[] {
  const missing = has(failures, "EVIDENCE_LINEAGE_MISSING");
  const events: readonly MemoryEvidenceEntry["event_type"][] = freezeArray(["CREATED", "INDEXED", "RETRIEVED", "UPDATED", "SUPERSEDED", "ARCHIVED", "RETIRED", "REPLAY_VALIDATED", "SHARED", "CERTIFIED"]);
  return freezeArray(events.filter((event) => !(missing && event === "UPDATED")).map((event_type, index) => nested({
    evidence_id: `P3.4-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    event_type,
    memory_ref: memoryRefs[index % memoryRefs.length],
    evidence_refs: missing && event_type === "SHARED" ? freezeArray([]) : freezeArray([`evidence:p3.4:${event_type.toLowerCase()}`]),
    lineage_ref: missing && event_type === "ARCHIVED" ? "" : `lineage:p3.4:${event_type.toLowerCase()}`,
    sequence: index + 1,
    immutable: true,
    replayable: true,
  })));
}

function resultReplayHash(result: Omit<MemoryKnowledgeResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    architecture: result.architecture.integrity_hash,
    memory_objects: result.memory_objects.map((memory) => memory.integrity_hash),
    knowledge_index: result.knowledge_index.integrity_hash,
    retrieval: result.retrieval.integrity_hash,
    governance: result.governance.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    storage: result.storage.integrity_hash,
    sharing: result.sharing.integrity_hash,
    evidence: result.evidence.map((entry) => entry.integrity_hash),
    replay_validation: result.replay_validation.integrity_hash,
    observability: result.observability.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<MemoryKnowledgeResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runMemoryKnowledge(input: MemoryKnowledgeInput = {}): MemoryKnowledgeResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<MemoryKnowledgeFailure>(direct ? [direct] : []);
  const p33 = runRuntimeOrchestration();
  const p33Valid = validateRuntimeOrchestration(p33).valid && !has(scenarioFailures, "P3_3_RUNTIME_ORCHESTRATION_INVALID");
  const failures = freezeArray<MemoryKnowledgeFailure>(p33Valid ? scenarioFailures : [...scenarioFailures, "P3_3_RUNTIME_ORCHESTRATION_INVALID"]);
  const tenant_id = has(failures, "TENANT_ISOLATION_VIOLATION") ? "tenant:cross-boundary" : input.tenant_id ?? "tenant:caf-primary";

  const architecture = nested({
    architecture_id: "P3.4-MEMORY-ARCHITECTURE-001",
    memory_hierarchy: has(failures, "MEMORY_HIERARCHY_INCOMPLETE") ? freezeArray(["WORKING" as const, "EPISODIC" as const]) : KINDS,
    memory_taxonomy_refs: freezeArray(["taxonomy:p3.4:working", "taxonomy:p3.4:episodic", "taxonomy:p3.4:semantic"]),
    storage_contract_refs: freezeArray(["contract:p3.4:working-memory", "contract:p3.4:persistent-knowledge"]),
    retrieval_boundary_refs: freezeArray(["boundary:p3.4:authorized-retrieval"]),
    governance_boundary_refs: freezeArray(["boundary:p3.4:tenant-isolation", "boundary:p3.4:hidden-mutation-prevention"]),
    complete: !has(failures, "MEMORY_HIERARCHY_INCOMPLETE"),
  });
  const memory_objects = freezeArray(KINDS.map((kind, index) => nested({
    memory_id: `P3.4-MEMORY-${kind}-001`,
    kind,
    lifecycle_state: "ACTIVE" as const,
    owner_agent_ref: p33.orchestrator.active_agent_refs[0] ?? "agent:unknown",
    tenant_id,
    content_ref: `content:p3.4:${kind.toLowerCase()}`,
    promoted_from_working_memory: kind !== "WORKING" || !has(failures, "WORKING_MEMORY_PERSISTED_WITHOUT_PROMOTION"),
    immutable_history: kind !== "EPISODIC" || !has(failures, "EPISODIC_HISTORY_MUTATED"),
    structured_knowledge: kind !== "SEMANTIC" || !has(failures, "SEMANTIC_KNOWLEDGE_UNSTRUCTURED"),
    evidence_refs: has(failures, "EVIDENCE_LINEAGE_MISSING") && index === 1 ? freezeArray([]) : freezeArray([`evidence:p3.4:${kind.toLowerCase()}`]),
    lineage_refs: has(failures, "EVIDENCE_LINEAGE_MISSING") && index === 2 ? freezeArray([]) : freezeArray([`lineage:p3.4:${kind.toLowerCase()}`]),
  })));
  const memoryRefs = memory_objects.map((memory) => memory.memory_id);
  const knowledge_index = nested({
    index_id: "P3.4-KNOWLEDGE-INDEX-001",
    indexed_memory_refs: has(failures, "KNOWLEDGE_INDEX_INCOMPLETE") ? freezeArray(memoryRefs.slice(0, 2)) : freezeArray(memoryRefs),
    metadata_indexed: true,
    semantic_indexed: !has(failures, "KNOWLEDGE_INDEX_INCOMPLETE"),
    relationship_indexed: true,
    version_indexed: true,
    evidence_indexed: !has(failures, "KNOWLEDGE_INDEX_INCOMPLETE"),
    deterministic: true,
  });
  const retrieval = nested({
    retrieval_id: "P3.4-RETRIEVAL-SERVICE-001",
    modes: MODES,
    query_ref: "query:p3.4:governed-context",
    result_order: has(failures, "RETRIEVAL_NON_DETERMINISTIC") ? freezeArray([memoryRefs[2], memoryRefs[0]]) : freezeArray(memoryRefs),
    ranking_deterministic: !has(failures, "RETRIEVAL_NON_DETERMINISTIC"),
    filtering_deterministic: true,
    authorization_enforced: !has(failures, "RETRIEVAL_AUTHORIZATION_BYPASS"),
    retrieval_evidence_refs: has(failures, "EVIDENCE_LINEAGE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p3.4:retrieval"]),
    replayable: !has(failures, "RETRIEVAL_NON_DETERMINISTIC"),
  });
  const governance = nested({
    governance_id: "P3.4-MEMORY-GOVERNANCE-001",
    authorization_validated: !has(failures, "MEMORY_GOVERNANCE_BYPASS") && !has(failures, "RETRIEVAL_AUTHORIZATION_BYPASS"),
    ownership_validated: true,
    visibility_validated: !has(failures, "UNAUTHORIZED_KNOWLEDGE_SHARING"),
    approval_policy_validated: !has(failures, "MEMORY_GOVERNANCE_BYPASS"),
    constitutional_validation: p33Valid,
    tenant_isolation: !has(failures, "TENANT_ISOLATION_VIOLATION"),
    immutable_evidence_protected: !has(failures, "EPISODIC_HISTORY_MUTATED"),
    hidden_mutation_prevented: !has(failures, "MEMORY_GOVERNANCE_BYPASS"),
  });
  const lifecycle = nested({
    lifecycle_id: "P3.4-MEMORY-LIFECYCLE-001",
    states: LIFECYCLE,
    legal_transitions: freezeArray(["CREATED->INDEXED", "INDEXED->ACTIVE", "ACTIVE->REFERENCED", "REFERENCED->UPDATED", "UPDATED->SUPERSEDED", "SUPERSEDED->ARCHIVED", "ARCHIVED->RETIRED"]),
    attempted_transition: has(failures, "ILLEGAL_MEMORY_LIFECYCLE_TRANSITION") ? "RETIRED->ACTIVE" : "ACTIVE->REFERENCED",
    transition_legal: !has(failures, "ILLEGAL_MEMORY_LIFECYCLE_TRANSITION"),
    retention_policy_enforced: true,
    archival_validated: true,
    retirement_validated: !has(failures, "ILLEGAL_MEMORY_LIFECYCLE_TRANSITION"),
    supersession_deterministic: true,
  });
  const storage = nested({
    storage_id: "P3.4-STORAGE-INTEGRATION-001",
    cci_storage_ref: "program-2:cci-storage-services",
    persistence_validated: !has(failures, "CCI_STORAGE_INTEGRATION_INVALID"),
    storage_abstraction_validated: !has(failures, "CCI_STORAGE_INTEGRATION_INVALID"),
    replication_validated: true,
    durability_confirmed: !has(failures, "CCI_STORAGE_INTEGRATION_INVALID"),
    encryption_operational: true,
    integrity_validated: !has(failures, "CCI_STORAGE_INTEGRATION_INVALID"),
    recovery_validated: !has(failures, "CCI_STORAGE_INTEGRATION_INVALID"),
  });
  const sharing = nested({
    sharing_id: "P3.4-KNOWLEDGE-SHARING-001",
    shared_knowledge_refs: freezeArray(["P3.4-MEMORY-SEMANTIC-001"]),
    publication_governed: !has(failures, "UNAUTHORIZED_KNOWLEDGE_SHARING"),
    subscriptions_governed: !has(failures, "UNAUTHORIZED_KNOWLEDGE_SHARING"),
    ownership_preserved: true,
    lineage_preserved: !has(failures, "EVIDENCE_LINEAGE_MISSING"),
    tenant_isolation_preserved: !has(failures, "TENANT_ISOLATION_VIOLATION"),
    unauthorized_propagation_prevented: !has(failures, "UNAUTHORIZED_KNOWLEDGE_SHARING"),
  });
  const evidence = buildEvidence(memoryRefs, failures);
  const evidenceComplete = evidence.length === 10 && evidence.every((entry) => entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && entry.lineage_ref);
  const replay_validation = nested({
    replay_validation_id: "P3.4-MEMORY-REPLAY-VALIDATION-001",
    working_memory_reconstructed: true,
    episodic_memory_reconstructed: memory_objects.find((memory) => memory.kind === "EPISODIC")?.immutable_history === true,
    semantic_memory_reconstructed: memory_objects.find((memory) => memory.kind === "SEMANTIC")?.structured_knowledge === true,
    retrieval_reconstructed: retrieval.replayable,
    temporal_consistency: true,
    version_resolution_deterministic: true,
    snapshot_recovery_validated: storage.recovery_validated,
    deterministic: !has(failures, "REPLAY_RECONSTRUCTION_FAILED"),
  });
  const observability = nested({
    observability_id: "P3.4-MEMORY-OBSERVABILITY-001",
    metrics: Object.freeze({
      memory_usage: memory_objects.length,
      retrieval_latency_ms: 8,
      cache_efficiency: 0.94,
      indexing_health: failures.length ? "BLOCKED" as const : "HEALTHY" as const,
      retrieval_success: retrieval.authorization_enforced ? 1 : 0,
      lifecycle_events: evidence.length,
      governance_violations: failures.length,
    }),
    dashboards_validated: !has(failures, "OBSERVABILITY_GAP"),
    audit_logging_complete: !has(failures, "OBSERVABILITY_GAP"),
    complete_visibility: !has(failures, "OBSERVABILITY_GAP"),
  });
  const memoryTypesIntegrated = memory_objects.every((memory) => memory.promoted_from_working_memory && memory.immutable_history && memory.structured_knowledge && memory.evidence_refs.length > 0 && memory.lineage_refs.length > 0);
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!p33Valid ? ["P3_3_RUNTIME_ORCHESTRATION_INVALID" as const] : []),
    ...(!architecture.complete ? ["MEMORY_HIERARCHY_INCOMPLETE" as const] : []),
    ...(memory_objects.some((memory) => memory.kind === "WORKING" && !memory.promoted_from_working_memory) ? ["WORKING_MEMORY_PERSISTED_WITHOUT_PROMOTION" as const] : []),
    ...(memory_objects.some((memory) => memory.kind === "EPISODIC" && !memory.immutable_history) ? ["EPISODIC_HISTORY_MUTATED" as const] : []),
    ...(memory_objects.some((memory) => memory.kind === "SEMANTIC" && !memory.structured_knowledge) ? ["SEMANTIC_KNOWLEDGE_UNSTRUCTURED" as const] : []),
    ...(knowledge_index.indexed_memory_refs.length !== memory_objects.length || !knowledge_index.semantic_indexed || !knowledge_index.evidence_indexed ? ["KNOWLEDGE_INDEX_INCOMPLETE" as const] : []),
    ...(!retrieval.ranking_deterministic || !retrieval.replayable ? ["RETRIEVAL_NON_DETERMINISTIC" as const] : []),
    ...(!retrieval.authorization_enforced ? ["RETRIEVAL_AUTHORIZATION_BYPASS" as const] : []),
    ...(!governance.authorization_validated || !governance.hidden_mutation_prevented ? ["MEMORY_GOVERNANCE_BYPASS" as const] : []),
    ...(!lifecycle.transition_legal ? ["ILLEGAL_MEMORY_LIFECYCLE_TRANSITION" as const] : []),
    ...(!evidenceComplete || !memoryTypesIntegrated ? ["EVIDENCE_LINEAGE_MISSING" as const] : []),
    ...(!storage.persistence_validated || !storage.recovery_validated ? ["CCI_STORAGE_INTEGRATION_INVALID" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_RECONSTRUCTION_FAILED" as const] : []),
    ...(!sharing.unauthorized_propagation_prevented ? ["UNAUTHORIZED_KNOWLEDGE_SHARING" as const] : []),
    ...(!observability.complete_visibility ? ["OBSERVABILITY_GAP" as const] : []),
    ...(!governance.tenant_isolation || !sharing.tenant_isolation_preserved ? ["TENANT_ISOLATION_VIOLATION" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.4-MEMORY-CERTIFICATION-GATE-001",
    outcome: certOutcome(derivedFailures),
    certified: certOutcome(derivedFailures) === "PASS",
    architecture_complete: architecture.complete,
    memory_types_integrated: memoryTypesIntegrated,
    retrieval_deterministic: retrieval.ranking_deterministic && retrieval.replayable,
    retrieval_authorized: retrieval.authorization_enforced,
    governance_enforced: governance.authorization_validated && governance.constitutional_validation,
    evidence_lineage_complete: evidenceComplete,
    lifecycle_governed: lifecycle.transition_legal && lifecycle.retirement_validated,
    storage_certified: storage.persistence_validated && storage.integrity_validated,
    replay_compatible: replay_validation.deterministic,
    knowledge_sharing_governed: sharing.unauthorized_propagation_prevented && sharing.ownership_preserved,
    observability_complete: observability.complete_visibility,
    tenant_isolation_preserved: governance.tenant_isolation && sharing.tenant_isolation_preserved,
    failures: derivedFailures,
  });
  const base: Omit<MemoryKnowledgeResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    runtime_orchestration_ref: "caf-runtime-orchestration/v3.3",
    cci_registry_ref: "Program 2 - CCI Registry",
    cci_evidence_ref: "Program 2 - CCI Evidence",
    cci_storage_ref: "Program 2 - CCI Storage",
    architecture,
    memory_objects,
    knowledge_index,
    retrieval,
    governance,
    lifecycle,
    storage,
    sharing,
    evidence,
    replay_validation,
    observability,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMemoryKnowledge(result?: MemoryKnowledgeResult): MemoryKnowledgeValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, architecture_valid: false, memory_valid: false, retrieval_valid: false, governance_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const architecture_valid = verifyHashedRecord(result.architecture) && result.architecture.complete && result.architecture.memory_hierarchy.length === 3;
  const memory_valid = result.memory_objects.every((memory) => verifyHashedRecord(memory) && memory.promoted_from_working_memory && memory.immutable_history && memory.structured_knowledge && memory.evidence_refs.length > 0 && memory.lineage_refs.length > 0);
  const retrieval_valid = verifyHashedRecord(result.retrieval) && result.retrieval.ranking_deterministic && result.retrieval.authorization_enforced && result.retrieval.replayable;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.authorization_validated && result.governance.tenant_isolation && result.governance.hidden_mutation_prevented;
  const evidence_valid = result.evidence.length === 10 && result.evidence.every((entry) => verifyHashedRecord(entry) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && Boolean(entry.lineage_ref));
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && architecture_valid && memory_valid && retrieval_valid && governance_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, architecture_valid, memory_valid, retrieval_valid, governance_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayMemoryKnowledge(result = runMemoryKnowledge()): boolean {
  const replayed = runMemoryKnowledge();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMemoryKnowledge(result).valid;
}

export function getMemoryKnowledgeBundle(): MemoryKnowledgeBundle {
  const result = runMemoryKnowledge();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      consumes_runtime_orchestration: true,
      consumes_cci_registry_evidence_storage: true,
      uncontrolled_learning_prohibited: true,
      deterministic_retrieval_required: true,
      immutable_memory_lineage_required: true,
      cross_tenant_intelligence_prohibited: true,
    }),
    result,
    validation: validateMemoryKnowledge(result),
  });
}

export const MemoryKnowledgeService = Object.freeze({
  run: runMemoryKnowledge,
  validate: validateMemoryKnowledge,
  replay: replayMemoryKnowledge,
});
