import { describe, expect, it, vi } from "vitest";
import {
  buildCognitiveExplainabilityObservabilitySurface,
  computeCognitiveExplainabilityRepositoryHash,
  getCognitiveExplainabilityEngineContract,
  replayCognitiveExplainability,
  runCognitiveExplainability,
  validateCognitiveExplainability,
} from "@/services/cognitive-explainability-engine";
import type { CognitiveExplainabilityFailure, CognitiveExplainabilityScenario } from "@/types/cognitive-explainability-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.6 Cognitive Explainability Engine", () => {
  it("defines the read-only advisory cognitive explainability doctrine", () => {
    const contract = getCognitiveExplainabilityEngineContract();

    expect(contract.doctrine.engine_version).toBe("cognitive-explainability-engine/v8ALT.3.6");
    expect(contract.doctrine.principles).toContain("cognitive-transparency");
    expect(contract.doctrine.principles).toContain("deterministic-explainability");
    expect(contract.doctrine.principles).toContain("read-only-operation");
    expect(contract.doctrine.explainability_levels).toEqual(["EXECUTIVE", "OPERATOR", "ANALYST", "FORENSIC", "CERTIFICATION", "DEVELOPER"]);
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("generates complete cognitive explanations from the prediction knowledge repository", () => {
    const repository = runCognitiveExplainability();
    const validation = validateCognitiveExplainability(repository);

    expect(repository.explanations.length).toBe(10);
    expect(repository.explanations.every((item) => item.pipeline_state === "CERTIFICATION")).toBe(true);
    expect(repository.explanations.every((item) => item.reasoning_graph.nodes.length >= 10)).toBe(true);
    expect(repository.explanations.every((item) => item.causal_chain.length >= 5)).toBe(true);
    expect(repository.explanations.every((item) => item.evidence_hierarchy.length > 0)).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("reproduces reasoning graphs, evidence hierarchy, narratives, and counterfactual analyses deterministically", () => {
    const first = runCognitiveExplainability();
    const second = runCognitiveExplainability();

    expect(first.repository_hash).toBe(second.repository_hash);
    expect(first.reasoning_graphs).toEqual(second.reasoning_graphs);
    expect(first.evidence_hierarchies).toEqual(second.evidence_hierarchies);
    expect(first.confidence_narratives).toEqual(second.confidence_narratives);
    expect(first.counterfactual_analyses).toEqual(second.counterfactual_analyses);
  });

  it("documents evidence weighting, uncertainty, governance, constitutional reasoning, and decision tradeoffs", () => {
    const repository = runCognitiveExplainability();

    expect(repository.explanations.every((item) => item.evidence_hierarchy.every((evidence) => evidence.weight > 0 && evidence.trust_rationale))).toBe(true);
    expect(repository.explanations.every((item) => item.uncertainty_profile.length >= 3)).toBe(true);
    expect(repository.explanations.every((item) => item.governance_reasoning.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.constitutional_reasoning.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.decision_tradeoffs.length > 0)).toBe(true);
  });

  it("preserves lineage, replay narratives, assumptions, limitations, certification evidence, and integrity", () => {
    const repository = runCognitiveExplainability();

    expect(repository.lineage_references.length).toBe(10);
    expect(repository.replay_explanations.length).toBeGreaterThanOrEqual(3);
    expect(repository.certification_evidence.length).toBe(10);
    expect(repository.integrity_hashes.length).toBe(10);
    expect(repository.explanations.every((item) => item.assumptions.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.limitations.length > 0)).toBe(true);
  });

  it("replays and hashes cognitive explanations deterministically", () => {
    const repository = runCognitiveExplainability();
    const replay = replayCognitiveExplainability(repository);

    expect(repository.repository_hash).toBe(computeCognitiveExplainabilityRepositoryHash(repository));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(repository.repository_hash);
  });

  it("enforces read-only advisory behavior", () => {
    const repository = runCognitiveExplainability();
    const validation = validateCognitiveExplainability(repository);

    expect(repository.explanations.every((item) => item.advisory_only && item.read_only)).toBe(true);
    expect(repository.explanations.every((item) => !item.prediction_modified && !item.confidence_modified && !item.governance_modified && !item.mission_execution_modified)).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["HIDDEN_REASONING", "HIDDEN_REASONING_DETECTED"],
    ["UNDOCUMENTED_EVIDENCE_INFLUENCE", "UNDOCUMENTED_EVIDENCE_INFLUENCE_DETECTED"],
    ["UNEXPLAINED_GOVERNANCE_OUTCOME", "UNEXPLAINED_GOVERNANCE_OUTCOME_DETECTED"],
    ["CONSTITUTIONAL_VALIDATION_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING"],
    ["REPLAY_EXPLANATION_MISMATCH", "REPLAY_EXPLANATION_MISMATCH"],
    ["EXPLANATION_MUTATION", "EXPLANATION_MUTATION_DETECTED"],
    ["CROSS_TENANT_ACCESS", "CROSS_TENANT_EXPLANATION_ACCESS_DETECTED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [CognitiveExplainabilityScenario, CognitiveExplainabilityFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = runCognitiveExplainability({ scenario });
    const validation = validateCognitiveExplainability(repository);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible cognitive explainability diagnostics", () => {
    const surface = buildCognitiveExplainabilityObservabilitySurface(runCognitiveExplainability({ level: "ANALYST" }));

    expect(surface.explanation_count).toBe(10);
    expect(surface.reasoning_graph_count).toBe(10);
    expect(surface.evidence_item_count).toBeGreaterThan(10);
    expect(surface.counterfactual_count).toBeGreaterThan(10);
    expect(surface.level).toBe("ANALYST");
    expect(surface.advisory_only).toBe(true);
    expect(surface.read_only).toBe(true);
  });
});
