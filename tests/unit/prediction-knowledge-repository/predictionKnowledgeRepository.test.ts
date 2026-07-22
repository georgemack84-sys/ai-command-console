import { describe, expect, it, vi } from "vitest";
import {
  buildPredictionKnowledgeObservabilitySurface,
  computePredictionKnowledgeRepositoryHash,
  getPredictionKnowledgeRepositoryContract,
  replayPredictionKnowledgeRepository,
  runPredictionKnowledgeRepository,
  validatePredictionKnowledgeRepository,
} from "@/services/prediction-knowledge-repository";
import type { PredictionKnowledgeFailure, PredictionKnowledgeScenario } from "@/types/prediction-knowledge-repository";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.5 Prediction Knowledge Repository", () => {
  it("defines the advisory-only prediction knowledge repository doctrine", () => {
    const contract = getPredictionKnowledgeRepositoryContract();

    expect(contract.doctrine.repository_version).toBe("prediction-knowledge-repository/v8ALT.3.5");
    expect(contract.doctrine.principles).toContain("immutable-knowledge-preservation");
    expect(contract.doctrine.principles).toContain("deterministic-retrieval");
    expect(contract.doctrine.autonomous_learning).toBe(false);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.doctrine.knowledge_types).toContain("PREDICTION_HISTORY");
    expect(contract.doctrine.knowledge_types).toContain("CERTIFICATION_KNOWLEDGE");
    expect(contract.validation.valid).toBe(true);
  });

  it("preserves complete prediction knowledge across repository domains", () => {
    const repository = runPredictionKnowledgeRepository();
    const validation = validatePredictionKnowledgeRepository(repository);

    expect(repository.knowledge_objects.length).toBe(10);
    expect(repository.knowledge_objects.map((object) => object.knowledge_type)).toContain("PREDICTION_MODEL");
    expect(repository.knowledge_objects.map((object) => object.knowledge_type)).toContain("HISTORICAL_ACCURACY");
    expect(repository.knowledge_objects.every((object) => object.prediction_history.length >= 3)).toBe(true);
    expect(repository.knowledge_objects.every((object) => object.behavior_profile.length >= 3)).toBe(true);
    expect(repository.knowledge_objects.every((object) => object.mitigation_results.length > 0)).toBe(true);
    expect(repository.knowledge_objects.every((object) => object.operator_decisions.length > 0)).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("constructs deterministic relationship graphs and retrieval indexes", () => {
    const first = runPredictionKnowledgeRepository();
    const second = runPredictionKnowledgeRepository();

    expect(first.repository_hash).toBe(second.repository_hash);
    expect(first.knowledge_graph.graph_hash).toBe(second.knowledge_graph.graph_hash);
    expect(first.knowledge_graph.relationships.map((item) => item.relationship_hash)).toEqual(second.knowledge_graph.relationships.map((item) => item.relationship_hash));
    expect(first.retrieval_indexes.prediction).toEqual([...first.retrieval_indexes.prediction].sort());
    expect(first.retrieval_indexes.certification.length).toBe(10);
  });

  it("preserves replay artifacts, lineage references, certification evidence, governance metadata, constitutional metadata, and integrity hashes", () => {
    const repository = runPredictionKnowledgeRepository();

    expect(repository.replay_artifacts.length).toBe(10);
    expect(repository.lineage_references.length).toBe(10);
    expect(repository.certification_evidence.length).toBe(10);
    expect(repository.integrity_hashes.length).toBe(10);
    expect(repository.knowledge_objects.every((object) => object.governance_metadata.length > 0)).toBe(true);
    expect(repository.knowledge_objects.every((object) => object.constitutional_metadata.length > 0)).toBe(true);
  });

  it("replays and hashes the repository deterministically", () => {
    const repository = runPredictionKnowledgeRepository();
    const replay = replayPredictionKnowledgeRepository(repository);

    expect(repository.repository_hash).toBe(computePredictionKnowledgeRepositoryHash(repository));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(repository.repository_hash);
  });

  it("enforces advisory-only behavior and rejects autonomous learning", () => {
    const repository = runPredictionKnowledgeRepository();
    const validation = validatePredictionKnowledgeRepository(repository);

    expect(repository.knowledge_objects.every((object) => object.advisory_only)).toBe(true);
    expect(repository.knowledge_objects.every((object) => !object.autonomous_learning_performed)).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION_DETECTED"],
    ["KNOWLEDGE_DELETION", "KNOWLEDGE_DELETION_DETECTED"],
    ["RELATIONSHIP_CORRUPTION", "RELATIONSHIP_CORRUPTION_DETECTED"],
    ["CROSS_TENANT_ACCESS", "CROSS_TENANT_ACCESS_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["LINEAGE_BROKEN", "LINEAGE_REFERENCES_MUTABLE"],
    ["GOVERNANCE_INVALID", "GOVERNANCE_METADATA_MISSING"],
    ["CONSTITUTIONAL_INVALID", "CONSTITUTIONAL_METADATA_MISSING"],
    ["AUTONOMOUS_LEARNING_ATTEMPT", "AUTONOMOUS_LEARNING_DETECTED"],
  ] as readonly [PredictionKnowledgeScenario, PredictionKnowledgeFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = runPredictionKnowledgeRepository({ scenario });
    const validation = validatePredictionKnowledgeRepository(repository);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible repository diagnostics", () => {
    const surface = buildPredictionKnowledgeObservabilitySurface(runPredictionKnowledgeRepository());

    expect(surface.knowledge_object_count).toBe(10);
    expect(surface.relationship_count).toBeGreaterThanOrEqual(10);
    expect(surface.active_objects).toBe(10);
    expect(surface.certified_objects).toBe(10);
    expect(surface.advisory_only).toBe(true);
  });
});
