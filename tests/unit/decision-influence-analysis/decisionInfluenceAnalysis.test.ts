import { describe, expect, it, vi } from "vitest";
import {
  analyzeDecisionInfluence,
  buildDecisionInfluenceObservabilitySurface,
  buildInfluenceGraph,
  calculateInfluenceContributions,
  computeDecisionInfluenceHash,
  detectInfluenceConflicts,
  explainDecisionInfluence,
  getDecisionInfluenceContract,
  resolveInfluenceDependencies,
  runDecisionInfluenceAnalysis,
  validateDecisionInfluenceAnalysis,
  verifyInfluenceReplay,
} from "@/services/decision-influence-analysis";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7G.3 Decision Influence Analysis", () => {
  it("defines deterministic decision influence doctrine", () => {
    const contract = getDecisionInfluenceContract();
    expect(contract.doctrine.principles).toContain("constitution-aware");
    expect(contract.doctrine.principles).toContain("no-hidden-reasoning");
    expect(contract.doctrine.supported_relationships).toContain("DEPENDENT_ON");
    expect(contract.doctrine.constitutional_precedence[0]).toBe("CONSTITUTION");
    expect(contract.validation.validation_state).toBe("VALID");
    expect(contract.replay.replay_state).toBe("REPRODUCED");
  }, 20000);

  it("analyzes every influence category for a governance conclusion", () => {
    const analysis = analyzeDecisionInfluence();
    expect(analysis.schema_version).toBe("decision-influence-analysis/v7G.3");
    expect(analysis.influences.map((item) => item.source_type)).toEqual(["CONSTITUTION", "AUTHORITY", "POLICY", "COMPLIANCE", "RISK", "EVIDENCE", "RECOMMENDATION", "ESCALATION"]);
    expect(analysis.source_governance_lineage_id).toBeTruthy();
    expect(analysis.source_policy_reconstruction_id).toBeTruthy();
    expect(validateDecisionInfluenceAnalysis(analysis).validation_state).toBe("VALID");
  });

  it("orders contributions by constitutional precedence and weight", () => {
    const analysis = analyzeDecisionInfluence();
    const contributions = calculateInfluenceContributions(analysis.influences);
    expect(contributions[0]!.source_type).toBe("CONSTITUTION");
    expect(contributions[0]!.contribution_level).toBe("MANDATORY");
    expect(contributions.every((item) => item.weight > 0)).toBe(true);
  });

  it("builds deterministic influence graph and dependencies", () => {
    const analysis = analyzeDecisionInfluence();
    const graph = buildInfluenceGraph(analysis.influences);
    expect(graph.length).toBe(analysis.influences.length - 1);
    expect(graph[0]!.dependency_type).toBe("PRECEDENCE");
    expect(resolveInfluenceDependencies(analysis)).toEqual(analysis.dependencies);
    expect(graph[0]!.edge_hash).toBe(buildInfluenceGraph(analysis.influences)[0]!.edge_hash);
  });

  it("detects and records resolved influence conflicts", () => {
    const analysis = analyzeDecisionInfluence();
    const conflicts = detectInfluenceConflicts(analysis.influences);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.every((conflict) => conflict.resolution_state === "RESOLVED")).toBe(true);
    expect(conflicts[0]!.constitutional_resolution_applied).toBe(true);
  });

  it("hashes and replays deterministically", () => {
    const analysis = analyzeDecisionInfluence();
    expect(computeDecisionInfluenceHash(analysis)).toBe(analysis.analysis_hash);
    const replay = verifyInfluenceReplay(analysis);
    expect(replay.replay_state).toBe("REPRODUCED");
    expect(replay.reconstructed_hash).toBe(analysis.analysis_hash);
  });

  it("explains decision influence for downstream explainability", () => {
    const explanation = explainDecisionInfluence(analyzeDecisionInfluence());
    expect(explanation.summary).toContain("constitutional");
    expect(explanation.mandatory_influences.length).toBeGreaterThan(0);
    expect(explanation.policy_basis.length).toBeGreaterThan(0);
    expect(explanation.confidence_basis).toContain("WEIGHTED_INFLUENCE_CONFIDENCE_V1");
  });

  it("fails closed for identity, source, target, and relationship faults", () => {
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "MISSING_INFLUENCE_ID" })).errors.some((error) => error.error_code === "DIA-001")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "MISSING_SOURCE" })).errors.some((error) => error.error_code === "DIA-002")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "MISSING_TARGET" })).errors.some((error) => error.error_code === "DIA-003")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "INVALID_RELATIONSHIP" })).errors.some((error) => error.error_code === "DIA-004")).toBe(true);
  }, 20000);

  it("fails closed for dependency, circularity, precedence, hidden influence, and contribution faults", () => {
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "DEPENDENCY_INCOMPLETE" })).errors.some((error) => error.error_code === "DIA-005")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "CIRCULAR_DEPENDENCY" })).errors.some((error) => error.error_code === "DIA-006")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "PRECEDENCE_VIOLATION" })).errors.some((error) => error.error_code === "DIA-007")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "HIDDEN_INFLUENCE" })).errors.some((error) => error.error_code === "DIA-008")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "CONTRIBUTION_FAILED" })).errors.some((error) => error.error_code === "DIA-009")).toBe(true);
  }, 30000);

  it("fails closed for conflict, replay, tenant, immutability, and confidence faults", () => {
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "UNRESOLVED_CONFLICT" })).errors.some((error) => error.error_code === "DIA-010")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "CROSS_TENANT" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "IMMUTABLE_MUTATION" })).errors.some((error) => error.error_code === "DIA-013")).toBe(true);
    expect(validateDecisionInfluenceAnalysis(analyzeDecisionInfluence({ scenario: "CONFIDENCE_MISMATCH" })).errors.some((error) => error.error_code === "DIA-014")).toBe(true);
  }, 30000);

  it("runs the engine and operator observability surface", () => {
    const result = runDecisionInfluenceAnalysis();
    expect(result.validation.validation_state).toBe("VALID");
    expect(result.replay.replay_state).toBe("REPRODUCED");
    const surface = buildDecisionInfluenceObservabilitySurface();
    expect(surface.influence_count).toBe(8);
    expect(surface.mandatory_influences.length).toBeGreaterThan(0);
    expect(surface.advisory_only_notice).toContain("advisory-only");
  }, 20000);
});
