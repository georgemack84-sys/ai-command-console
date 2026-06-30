import { describe, expect, it, vi } from "vitest";
import {
  analyzeFailure,
  buildFailureAnalysisObservabilitySurface,
  computeFailureAnalysisHash,
  getFailureAnalysisEngineContract,
  replayFailureAnalysis,
  validateFailureAnalysis,
} from "@/services/failure-analysis-engine";
import type { FailureAnalysisCategory, FailureAnalysisFailure, FailureAnalysisScenario } from "@/types/failure-analysis-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.2 Failure Analysis Engine", () => {
  it("defines the advisory-only deterministic analysis doctrine", () => {
    const contract = getFailureAnalysisEngineContract();

    expect(contract.doctrine.engine_version).toBe("failure-analysis-engine/v8ALT.2.2");
    expect(contract.doctrine.principles).toContain("deterministic-analysis");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.supported_categories).toEqual(["EXECUTION", "PLANNING", "ORCHESTRATION", "DEPENDENCY", "SUPERVISION", "INTEGRITY", "CHECKPOINT_CORRUPTION", "RESOURCE_EXHAUSTION", "AUTHORITY_VIOLATION", "GOVERNANCE_VIOLATION"]);
    expect(contract.doctrine.confidence_levels).toEqual(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"]);
    expect(contract.validation.valid).toBe(true);
    expect(contract.recovery_contract_failures).toEqual([]);
  });

  it("creates a complete baseline analysis with evidence, root cause, dependency graph, lineage, confidence, candidates, replay, and recovery contract linkage", () => {
    const analysis = analyzeFailure();
    const validation = validateFailureAnalysis(analysis);

    expect(analysis.analysis_id).toMatch(/^FAA-/);
    expect(analysis.failure_category).toBe("EXECUTION");
    expect(analysis.failure_signal).toBe("execution timeout");
    expect(analysis.root_cause.level).toBe("PRIMARY");
    expect(analysis.contributing_causes.length).toBe(1);
    expect(analysis.dependency_graph.nodes.length).toBe(6);
    expect(analysis.dependency_graph.edges.length).toBe(5);
    expect(analysis.failure_lineage.propagation_chain).toContain(`recovery:${analysis.recovery_id}`);
    expect(analysis.confidence.confidence_level).toBe("VERY_HIGH");
    expect(analysis.recovery_candidates.length).toBe(2);
    expect(analysis.recovery_candidates.every((candidate) => candidate.advisory_only)).toBe(true);
    expect(analysis.replay_reference.replay_version).toBe("failure-analysis-replay/v8ALT.2.2");
    expect(analysis.linked_recovery_contract.identity.recovery_id).toBe(analysis.recovery_id);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["BASELINE_EXECUTION", "EXECUTION"],
    ["PLANNING_FAILURE", "PLANNING"],
    ["ORCHESTRATION_FAILURE", "ORCHESTRATION"],
    ["DEPENDENCY_FAILURE", "DEPENDENCY"],
    ["SUPERVISION_FAILURE", "SUPERVISION"],
    ["INTEGRITY_FAILURE", "INTEGRITY"],
    ["CHECKPOINT_CORRUPTION", "CHECKPOINT_CORRUPTION"],
    ["RESOURCE_EXHAUSTION", "RESOURCE_EXHAUSTION"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_VIOLATION"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION"],
  ] as readonly [FailureAnalysisScenario, FailureAnalysisCategory][])("deterministically detects %s as %s", (scenario, category) => {
    const first = analyzeFailure({ scenario });
    const second = analyzeFailure({ scenario });

    expect(first.failure_category).toBe(category);
    expect(first.analysis_hash).toBe(second.analysis_hash);
    expect(first.root_cause.cause_hash).toBe(second.root_cause.cause_hash);
    expect(first.dependency_graph.graph_hash).toBe(second.dependency_graph.graph_hash);
  });

  it("reconstructs root cause and dependency impact deterministically", () => {
    const analysis = analyzeFailure({ scenario: "DEPENDENCY_FAILURE" });

    expect(analysis.root_cause.cause).toContain("dependency");
    expect(analysis.root_cause.evidence_references.length).toBe(6);
    expect(analysis.dependency_graph.nodes.some((node) => node.layer === "EXECUTION")).toBe(true);
    expect(analysis.dependency_graph.nodes.some((node) => node.layer === "GOVERNANCE")).toBe(true);
    expect(analysis.recovery_candidates.some((candidate) => candidate.candidate_type === "DEPENDENCY_REPAIR")).toBe(true);
  });

  it("calculates reproducible confidence from evidence, replay, integrity, dependency, governance, authority, history, and observability factors", () => {
    const healthy = analyzeFailure();
    const lowEvidence = analyzeFailure({ scenario: "LOW_EVIDENCE" });

    expect(healthy.confidence.confidence_score).toBeGreaterThan(lowEvidence.confidence.confidence_score);
    expect(healthy.confidence.confidence_level).toBe("VERY_HIGH");
    expect(lowEvidence.confidence.confidence_level).toBe("MEDIUM");
    expect(validateFailureAnalysis(lowEvidence).failures).toContain("CONFIDENCE_INSUFFICIENT");
  });

  it.each([
    ["LOW_EVIDENCE", "CONFIDENCE_INSUFFICIENT"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["LINEAGE_BROKEN", "LINEAGE_INVALID"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["AUTONOMOUS_RECOVERY_ATTEMPT", "AUTONOMOUS_RECOVERY_DETECTED"],
    ["GOVERNANCE_MUTATION_ATTEMPT", "GOVERNANCE_MUTATION_DETECTED"],
    ["EVIDENCE_FABRICATION", "EVIDENCE_FABRICATION_DETECTED"],
    ["HIDDEN_RUNTIME_STATE", "HIDDEN_STATE_DETECTED"],
  ] as readonly [FailureAnalysisScenario, FailureAnalysisFailure][])("fails closed for %s", (scenario, failure) => {
    const analysis = analyzeFailure({ scenario });
    const validation = validateFailureAnalysis(analysis);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("preserves advisory-only boundaries and never executes recovery in the baseline", () => {
    const analysis = analyzeFailure();
    const validation = validateFailureAnalysis(analysis);

    expect(analysis.advisory_only).toBe(true);
    expect(analysis.recovery_executed).toBe(false);
    expect(analysis.execution_modified).toBe(false);
    expect(analysis.governance_modified).toBe(false);
    expect(analysis.evidence_fabricated).toBe(false);
    expect(analysis.runtime_state_hidden).toBe(false);
    expect(validation.advisory_only).toBe(true);
  });

  it("replays and hashes analyses deterministically", () => {
    const first = analyzeFailure({ scenario: "RESOURCE_EXHAUSTION" });
    const second = analyzeFailure({ scenario: "RESOURCE_EXHAUSTION" });
    const replay = replayFailureAnalysis(first);

    expect(second.analysis_hash).toBe(first.analysis_hash);
    expect(first.analysis_hash).toBe(computeFailureAnalysisHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.analysis_hash);
  });

  it("exposes operator-visible diagnostics without hidden state", () => {
    const surface = buildFailureAnalysisObservabilitySurface(analyzeFailure({ scenario: "CHECKPOINT_CORRUPTION" }));

    expect(surface.failure_category).toBe("CHECKPOINT_CORRUPTION");
    expect(surface.root_cause).toContain("Checkpoint");
    expect(surface.candidate_count).toBe(2);
    expect(surface.replay_valid).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
