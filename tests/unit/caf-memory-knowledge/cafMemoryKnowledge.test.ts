import { describe, expect, it } from "vitest";
import {
  getMemoryKnowledgeBundle,
  replayMemoryKnowledge,
  runMemoryKnowledge,
  validateMemoryKnowledge,
} from "@/services/caf-memory-knowledge";
import type { MemoryKnowledgeScenario } from "@/types/caf-memory-knowledge";

describe("Program 3 P3.4 Agent Memory and Knowledge", () => {
  it("publishes doctrine that consumes runtime orchestration and CCI memory infrastructure", () => {
    const bundle = getMemoryKnowledgeBundle();

    expect(bundle.doctrine.version).toBe("caf-memory-knowledge/v3.4");
    expect(bundle.doctrine.consumes_runtime_orchestration).toBe(true);
    expect(bundle.doctrine.consumes_cci_registry_evidence_storage).toBe(true);
    expect(bundle.doctrine.uncontrolled_learning_prohibited).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic memory records and replay hashes", () => {
    const first = runMemoryKnowledge();
    const second = runMemoryKnowledge();

    expect(first.runtime_orchestration_ref).toBe("caf-runtime-orchestration/v3.3");
    expect(first.architecture.memory_hierarchy).toEqual(["WORKING", "EPISODIC", "SEMANTIC"]);
    expect(first.memory_objects).toHaveLength(3);
    expect(first.memory_objects.every((memory) => memory.tenant_id === "tenant:caf-primary")).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMemoryKnowledge(first).valid).toBe(true);
    expect(replayMemoryKnowledge(first)).toBe(true);
  });

  it("validates retrieval, governance, lifecycle, storage, sharing, and evidence", () => {
    const result = runMemoryKnowledge();

    expect(result.knowledge_index.indexed_memory_refs).toHaveLength(3);
    expect(result.retrieval.modes).toEqual(["EXACT", "SEMANTIC", "HYBRID", "GRAPH", "LINEAGE", "EPISODIC", "TEMPORAL"]);
    expect(result.retrieval.ranking_deterministic).toBe(true);
    expect(result.retrieval.authorization_enforced).toBe(true);
    expect(result.governance.hidden_mutation_prevented).toBe(true);
    expect(result.lifecycle.transition_legal).toBe(true);
    expect(result.storage.encryption_operational).toBe(true);
    expect(result.sharing.unauthorized_propagation_prevented).toBe(true);
    expect(result.evidence).toHaveLength(10);
  });

  it("certifies replay, lineage, observability, and tenant isolation", () => {
    const result = runMemoryKnowledge();

    expect(result.replay_validation.deterministic).toBe(true);
    expect(result.replay_validation.retrieval_reconstructed).toBe(true);
    expect(result.observability.complete_visibility).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
    expect(result.certification.tenant_isolation_preserved).toBe(true);
    expect(result.certification.evidence_lineage_complete).toBe(true);
  });

  it.each([
    "P3_3_RUNTIME_ORCHESTRATION_INVALID",
    "MEMORY_HIERARCHY_INCOMPLETE",
    "WORKING_MEMORY_PERSISTED_WITHOUT_PROMOTION",
    "EPISODIC_HISTORY_MUTATED",
    "SEMANTIC_KNOWLEDGE_UNSTRUCTURED",
    "KNOWLEDGE_INDEX_INCOMPLETE",
    "RETRIEVAL_NON_DETERMINISTIC",
    "RETRIEVAL_AUTHORIZATION_BYPASS",
    "MEMORY_GOVERNANCE_BYPASS",
    "ILLEGAL_MEMORY_LIFECYCLE_TRANSITION",
    "EVIDENCE_LINEAGE_MISSING",
    "CCI_STORAGE_INTEGRATION_INVALID",
    "REPLAY_RECONSTRUCTION_FAILED",
    "UNAUTHORIZED_KNOWLEDGE_SHARING",
    "OBSERVABILITY_GAP",
    "TENANT_ISOLATION_VIOLATION",
  ] as const)("fails certification for %s", (scenario: MemoryKnowledgeScenario) => {
    const result = runMemoryKnowledge({ scenario });
    const validation = validateMemoryKnowledge(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runMemoryKnowledge({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
