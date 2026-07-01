import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceExplanationObservabilitySurface,
  computeGovernanceExplanationHash,
  explainEscalation,
  explainGovernanceDecision,
  explainPolicyInfluence,
  explainRecommendation,
  explainRiskContribution,
  generateGovernanceExplanation,
  getGovernanceExplainabilityContract,
  runGovernanceExplainability,
  validateGovernanceExplanation,
  verifyExplanationReplay,
} from "@/services/governance-explainability";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7G.4 Governance Explainability Engine", () => {
  it("defines deterministic evidence-backed explainability doctrine", () => {
    const contract = getGovernanceExplainabilityContract();
    expect(contract.doctrine.principles).toContain("constitution-first");
    expect(contract.doctrine.principles).toContain("operator-centric");
    expect(contract.doctrine.supported_layers).toEqual(["EXECUTIVE_SUMMARY", "DETAILED_REASONING", "TECHNICAL_TRACE"]);
    expect(contract.validation.validation_state).toBe("VALID");
    expect(contract.replay.replay_state).toBe("REPRODUCED");
  }, 20000);

  it("generates immutable multi-layer explanations from verified artifacts", () => {
    const explanation = generateGovernanceExplanation();
    expect(explanation.version).toBe("governance-explainability/v7G.4");
    expect(explanation.layers.map((item) => item.layer_type)).toEqual(["EXECUTIVE_SUMMARY", "DETAILED_REASONING", "TECHNICAL_TRACE"]);
    expect(explanation.source_governance_lineage_id).toBeTruthy();
    expect(explanation.source_policy_reconstruction_id).toBeTruthy();
    expect(explanation.source_decision_influence_analysis_id).toBeTruthy();
    expect(validateGovernanceExplanation(explanation).validation_state).toBe("VALID");
  });

  it("produces executive, governance, audit, and technical views", () => {
    const explanation = generateGovernanceExplanation();
    expect(explanation.views.executive_view.summary).toContain("Governance conclusion");
    expect(explanation.views.governance_view.policy_history.length).toBeGreaterThan(0);
    expect(explanation.views.audit_view.evidence_chain.length).toBeGreaterThan(0);
    expect(explanation.views.technical_view.replay_metadata.length).toBeGreaterThan(0);
  });

  it("answers required recommendation, decision, policy, risk, and escalation questions", () => {
    const explanation = generateGovernanceExplanation();
    expect(explainRecommendation(explanation).policies_applied.length).toBeGreaterThan(0);
    expect(explainGovernanceDecision(explanation).authority.length).toBeGreaterThan(0);
    expect(explainPolicyInfluence(explanation).constitutional_authority.length).toBeGreaterThan(0);
    expect(explainRiskContribution(explanation).risks.length).toBeGreaterThan(0);
    expect(explainEscalation(explanation).authority.length).toBeGreaterThan(0);
  });

  it("hashes and replays explanations deterministically", () => {
    const explanation = generateGovernanceExplanation();
    expect(computeGovernanceExplanationHash(explanation)).toBe(explanation.explanation_hash);
    const replay = verifyExplanationReplay(explanation);
    expect(replay.replay_state).toBe("REPRODUCED");
    expect(replay.reconstructed_hash).toBe(explanation.explanation_hash);
  });

  it("fails closed for identity, object, lineage, policy, evidence, influence, constitution, confidence, and replay faults", () => {
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_EXPLANATION_ID" })).errors.some((error) => error.error_code === "GEE-001")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_OBJECT" })).errors.some((error) => error.error_code === "GEE-002")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_LINEAGE" })).errors.some((error) => error.error_code === "GEE-003")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_POLICY" })).errors.some((error) => error.error_code === "GEE-004")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_EVIDENCE" })).errors.some((error) => error.error_code === "GEE-005")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_INFLUENCE_GRAPH" })).errors.some((error) => error.error_code === "GEE-006")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_CONSTITUTION" })).errors.some((error) => error.error_code === "GEE-007")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_CONFIDENCE" })).errors.some((error) => error.error_code === "GEE-008")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "MISSING_REPLAY" })).errors.some((error) => error.error_code === "GEE-009")).toBe(true);
  }, 40000);

  it("fails closed for hidden influence, tenant leaks, replay mismatch, inference, and immutability", () => {
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "HIDDEN_INFLUENCE" })).errors.some((error) => error.error_code === "GEE-010")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "CROSS_TENANT" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "UNSUPPORTED_INFERENCE" })).errors.some((error) => error.error_code === "GEE-013")).toBe(true);
    expect(validateGovernanceExplanation(generateGovernanceExplanation({ scenario: "IMMUTABLE_MUTATION" })).errors.some((error) => error.error_code === "GEE-014")).toBe(true);
  }, 30000);

  it("runs the engine and operator observability surface", () => {
    const result = runGovernanceExplainability();
    expect(result.validation.validation_state).toBe("VALID");
    expect(result.replay.replay_state).toBe("REPRODUCED");
    const surface = buildGovernanceExplanationObservabilitySurface();
    expect(surface.layer_count).toBe(3);
    expect(surface.advisory_only_notice).toContain("advisory-only");
  }, 20000);
});
