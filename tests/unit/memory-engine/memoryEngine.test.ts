import { describe, expect, it } from "vitest";

import {
  getMemoryEngineBundle,
  replayMemoryEngine,
  runMemoryEngine,
  validateMemoryEngine,
} from "@/services/memory-engine";
import type { MemoryEngineFailure } from "@/types/memory-engine";

const conditionalFailures = [
  "WORKING_MEMORY_MISSING",
  "WORKING_MEMORY_EXPIRATION_MISSING",
  "SEMANTIC_MEMORY_MISSING",
  "PROCEDURAL_MEMORY_MISSING",
  "EPISODIC_MEMORY_MISSING",
  "PROVENANCE_ENGINE_MISSING",
  "MEMORY_GOVERNANCE_MISSING",
  "RETENTION_POLICY_MISSING",
  "RETRIEVAL_SERVICE_MISSING",
  "MEMORY_API_MISSING",
  "GOVERNANCE_API_MISSING",
  "RETRIEVAL_API_MISSING",
  "MEMORY_EVIDENCE_MISSING",
] as const satisfies readonly MemoryEngineFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "W2_6_POLICY_GATE_INVALID",
  "W2_7_SAFETY_GATE_INVALID",
  "W2_8_PLANNING_ENGINE_INVALID",
  "WORKING_MEMORY_NON_DETERMINISTIC",
  "RUNTIME_ISOLATION_FAILED",
  "KNOWLEDGE_VALIDATION_MISSING",
  "SEMANTIC_RETRIEVAL_NON_DETERMINISTIC",
  "PROCEDURE_RETRIEVAL_INVALID",
  "EPISODIC_REPLAY_INVALID",
  "PROVENANCE_NOT_IMMUTABLE",
  "SOURCE_ATTRIBUTION_MISSING",
  "MEMORY_IDENTIFIER_NOT_UNIQUE",
  "MEMORY_OWNER_MISSING",
  "MEMORY_TENANT_NAMESPACE_MISSING",
  "AUTHORITY_POLICY_SAFETY_BYPASSED",
  "DELETION_APPROVAL_BYPASSED",
  "MEMORY_UPDATE_DESTROYS_HISTORY",
  "RETRIEVAL_NON_DETERMINISTIC",
  "RETRIEVAL_EXPLANATION_MISSING",
  "RETRIEVAL_CONFIDENCE_MISSING",
  "TENANT_ISOLATION_FAILED",
  "MEMORY_EVIDENCE_NOT_IMMUTABLE",
  "MEMORY_REPLAY_INVALID",
] as const satisfies readonly MemoryEngineFailure[];

describe("Memory Engine W2.9", () => {
  it("publishes the W2.9 memory doctrine and certification bundle", () => {
    const bundle = getMemoryEngineBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "memory-engine/w2.9",
      owns_working_memory: true,
      owns_semantic_memory: true,
      owns_procedural_memory: true,
      owns_episodic_memory: true,
      owns_memory_provenance: true,
      owns_memory_governance: true,
      owns_retrieval_services: true,
      owns_memory_registry: true,
      owns_memory_evidence: true,
      authoritative_memory_subsystem: true,
      certification_gate: "Memory Engine Certification Gate",
    });
    expect(bundle.result.memory_kinds).toEqual(["Working", "Semantic", "Procedural", "Episodic"]);
    expect(bundle.result.readiness.decision).toBe("MEMORY_ENGINE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic memory services to W2.0 through W2.8", () => {
    const first = runMemoryEngine();
    const second = runMemoryEngine();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.skill_registry_ref).toBe("skill-registry/w2.4");
    expect(first.authority_validator_ref).toBe("authority-validator/w2.5");
    expect(first.policy_gate_ref).toBe("policy-gate/w2.6");
    expect(first.safety_gate_ref).toBe("safety-gate/w2.7");
    expect(first.planning_engine_ref).toBe("planning-engine/w2.8");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMemoryEngine(first).valid).toBe(true);
    expect(replayMemoryEngine(first)).toBe(true);
  });

  it("operates working, semantic, procedural, and episodic memory stores", () => {
    const result = runMemoryEngine();

    expect(result.working).toMatchObject({
      active_context: true,
      execution_state: true,
      temporary_variables: true,
      active_conversation: true,
      runtime_facts: true,
      planning_context: true,
      reasoning_context: true,
      task_context: true,
      execution_cache: true,
      low_latency: true,
      deterministic_updates: true,
      scoped_lifetime: true,
      automatic_expiration: true,
      runtime_isolation: true,
    });
    expect(result.semantic).toMatchObject({
      concepts: true,
      entities: true,
      relationships: true,
      ontologies: true,
      knowledge_graphs: true,
      embeddings: true,
      structured_knowledge: true,
      validated_facts: true,
      semantic_retrieval: true,
      similarity_search: true,
      relationship_traversal: true,
      concept_discovery: true,
      knowledge_validation: true,
    });
    expect(result.procedural.procedure_retrieval).toBe(true);
    expect(result.episodic.replay_support).toBe(true);
  });

  it("preserves provenance invariants and governed immutable memory history", () => {
    const result = runMemoryEngine();

    expect(result.provenance).toMatchObject({
      globally_unique_identifier: true,
      owner: true,
      creator: true,
      originating_agent: true,
      originating_capability: true,
      originating_skill: true,
      authority: true,
      policy: true,
      evidence: true,
      tenant: true,
      namespace: true,
      trust_level: true,
      confidence: true,
      source_references: true,
      validation_history: true,
      immutable_lineage: true,
      source_attribution: true,
      dependency_tracing: true,
    });
    expect(result.registry).toMatchObject({
      memory_metadata: true,
      versions: true,
      ownership: true,
      lineage: true,
      evidence: true,
      classifications: true,
      immutable_history: true,
      version_history: true,
      deterministic_lookup: true,
    });
  });

  it("enforces governance and deterministic authority-aware retrieval", () => {
    const result = runMemoryEngine();

    expect(result.governance).toMatchObject({
      ownership: true,
      authority_enforcement: true,
      policy_enforcement: true,
      retention: true,
      expiration: true,
      archival: true,
      deletion_approval: true,
      modification_approval: true,
      trust_validation: true,
      replay_validation: true,
      lifecycle_governance: true,
      retention_management: true,
      authority_policy_safety_required: true,
      tenant_isolation: true,
    });
    expect(result.retrieval).toMatchObject({
      keyword_search: true,
      semantic_search: true,
      vector_search: true,
      hybrid_search: true,
      contextual_retrieval: true,
      authority_aware_retrieval: true,
      tenant_aware_retrieval: true,
      replay_retrieval: true,
      ranking: true,
      filtering: true,
      explainable_retrieval: true,
      deterministic_replay: true,
      confidence_scoring: true,
      provenance_chain: true,
      policy_evaluation: true,
      authority_evaluation: true,
    });
    expect(result.readiness.retrieval_gate_enforced).toBe(true);
    expect(result.readiness.tenant_isolation_preserved).toBe(true);
  });

  it("exposes memory APIs and immutable audit evidence", () => {
    const result = runMemoryEngine();

    expect(result.apis).toMatchObject({
      create: true,
      retrieve: true,
      update: true,
      archive: true,
      restore: true,
      expire: true,
      validate: true,
      certify: true,
      semantic_search: true,
      keyword_search: true,
      vector_search: true,
      hybrid_search: true,
      timeline_query: true,
      contextual_query: true,
      authority_validation: true,
      policy_validation: true,
      retention_checks: true,
      lifecycle_management: true,
      provenance_verification: true,
      stable: true,
    });
    expect(result.evidence.records).toHaveLength(10);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional certification for %s", (failure) => {
    const result = runMemoryEngine({ scenario: failure });
    const validation = validateMemoryEngine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_CERTIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_CERTIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runMemoryEngine({ scenario: failure });
    const validation = validateMemoryEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit certification failure as not certified", () => {
    const result = runMemoryEngine({ scenario: "MEMORY_ENGINE_CERTIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_CERTIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateMemoryEngine(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runMemoryEngine({ scenario: "CERTIFIED_WITH_OBSERVATIONS" });
    const followup = runMemoryEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_CERTIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_CERTIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
