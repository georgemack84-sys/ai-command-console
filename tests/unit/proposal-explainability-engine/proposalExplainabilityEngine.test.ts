import { describe, expect, it } from "vitest";
import {
  explainAdaptationProposals,
  getProposalExplainabilityFoundation,
  replayProposalExplanations,
} from "@/services/proposal-explainability-engine";
import type {
  ProposalExplainabilityFailure,
  ProposalExplainabilityScenario,
  ProposalExplanationComponentType,
} from "@/types/proposal-explainability-engine";

describe("Mission Control Phase 10.10.10 Proposal Explainability Engine", () => {
  const expectedComponents: readonly ProposalExplanationComponentType[] = [
    "GENERATION_RATIONALE",
    "EVIDENCE_USED",
    "PATTERNS_DETECTED",
    "FEEDBACK_CONSIDERED",
    "EXPECTED_IMPROVEMENTS",
    "EXPECTED_RISKS",
    "GOVERNANCE_EFFECTS",
    "CONSTITUTIONAL_EFFECTS",
    "AUTHORITY_EFFECTS",
    "OPERATOR_EFFECTS",
    "SIMULATION_REQUIREMENTS",
    "CERTIFICATION_REQUIREMENTS",
    "ROLLBACK_REQUIREMENTS",
  ];

  it("publishes the proposal explainability contract", () => {
    const foundation = getProposalExplainabilityFoundation();

    expect(foundation.proposal_explainability_engine_version).toBe("proposal-explainability-engine/v1");
    expect(foundation.api_surface.explain_proposals).toBe("POST /proposal-explainability-engine/explain");
    expect(foundation.api_surface.reasoning_fabrication_supported).toBe(false);
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.supported_components).toEqual(expectedComponents);
    expect(foundation.result.explainability_state).toBe("EXPLAINED");
  });

  it("generates explanations deterministically", () => {
    const first = explainAdaptationProposals({ scenario: "ROLLBACK_PATH" });
    const second = explainAdaptationProposals({ scenario: "ROLLBACK_PATH" });

    expect(first.explanations[0]?.integrity_hash).toBe(second.explanations[0]?.integrity_hash);
    expect(first.explanations[0]?.components.map((component) => component.integrity_hash)).toEqual(second.explanations[0]?.components.map((component) => component.integrity_hash));
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("includes every canonical explanation component", () => {
    const explanation = explainAdaptationProposals().explanations[0];

    expect(explanation?.components.map((component) => component.component_type)).toEqual(expectedComponents);
    expect(explanation?.proposal_summary).toContain("immutable lifecycle");
    expect(explanation?.complete).toBe(true);
    expect(explanation?.can_advance_to_approval).toBe(true);
  });

  it("grounds every component in evidence and replay references", () => {
    const explanation = explainAdaptationProposals().explanations[0];

    expect(explanation?.replay_references.length).toBeGreaterThan(0);
    explanation?.components.forEach((component) => {
      expect(component.evidence_references.length).toBeGreaterThan(0);
      expect(component.replay_references.length).toBeGreaterThan(0);
      expect(component.machine_verifiable_claims).toContain("advisory_only_explanation");
      expect(component.machine_verifiable_claims).toContain("no_implementation_authority_granted");
      expect(component.complete).toBe(true);
    });
  });

  it("explains governance, constitutional, authority, operator, simulation, certification, and rollback effects", () => {
    const explanation = explainAdaptationProposals({ scenario: "ROLLBACK_PATH" }).explanations[0];
    const byType = new Map(explanation?.components.map((component) => [component.component_type, component]));

    expect(byType.get("GOVERNANCE_EFFECTS")?.narrative).toContain("policy impacts");
    expect(byType.get("CONSTITUTIONAL_EFFECTS")?.narrative).toContain("constraints");
    expect(byType.get("AUTHORITY_EFFECTS")?.narrative).toContain("boundary");
    expect(byType.get("OPERATOR_EFFECTS")?.narrative).toContain("review effort");
    expect(byType.get("SIMULATION_REQUIREMENTS")?.narrative).toContain("objectives");
    expect(byType.get("CERTIFICATION_REQUIREMENTS")?.narrative).toContain("prerequisites");
    expect(byType.get("ROLLBACK_REQUIREMENTS")?.narrative).toContain("triggers");
  });

  it("publishes explanation quality metrics", () => {
    const result = explainAdaptationProposals();

    expect(result.metrics.proposals_explained).toBe(1);
    expect(result.metrics.explanation_completeness).toBe(1);
    expect(result.metrics.evidence_attribution_coverage).toBe(1);
    expect(result.metrics.governance_explanation_coverage).toBe(1);
    expect(result.metrics.operator_explanation_coverage).toBe(1);
    expect(result.metrics.simulation_explanation_coverage).toBe(1);
    expect(result.metrics.certification_explanation_coverage).toBe(1);
    expect(result.metrics.rollback_explanation_coverage).toBe(1);
    expect(result.metrics.explanation_generation_latency_ms).toBe(0);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it("keeps explanations advisory-only and non-mutating", () => {
    const result = explainAdaptationProposals();
    const explanation = result.explanations[0];

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.modifies_scores).toBe(false);
    expect(result.approves_proposals).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
    expect(explanation?.modifies_proposal).toBe(false);
    expect(explanation?.modifies_scores).toBe(false);
    expect(explanation?.approves_proposal).toBe(false);
    expect(explanation?.authorizes_implementation).toBe(false);
  });

  it.each([
    ["PROPOSAL_VALIDATION_FAILURE", "PROPOSAL_VALIDATION_FAILED"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_ANALYSIS_UNAVAILABLE"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_ANALYSIS_UNAVAILABLE"],
    ["MISSING_AUTHORITY", "AUTHORITY_ANALYSIS_UNAVAILABLE"],
    ["MISSING_OPERATOR", "OPERATOR_ANALYSIS_UNAVAILABLE"],
    ["MISSING_SIMULATION", "SIMULATION_REQUIREMENTS_UNAVAILABLE"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REQUIREMENTS_UNAVAILABLE"],
    ["MISSING_ROLLBACK", "ROLLBACK_REQUIREMENTS_UNAVAILABLE"],
    ["IMPACTS_UNEXPLAINED", "REQUIRED_IMPACTS_UNEXPLAINED"],
    ["INCOMPLETE_EXPLANATION", "EXPLANATION_COMPLETENESS_NOT_ACHIEVED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["NONDETERMINISTIC_EXPLANATION", "DETERMINISTIC_EXPLANATION_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["FABRICATED_REASONING", "REASONING_FABRICATION_ATTEMPT"],
    ["OMITTED_EVIDENCE", "SUPPORTING_EVIDENCE_OMISSION_ATTEMPT"],
    ["HIDE_GOVERNANCE", "GOVERNANCE_IMPACT_HIDE_ATTEMPT"],
    ["HIDE_CONSTITUTIONAL", "CONSTITUTIONAL_IMPACT_HIDE_ATTEMPT"],
    ["HIDE_OPERATOR", "OPERATOR_IMPACT_HIDE_ATTEMPT"],
    ["PROPOSAL_MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["SCORE_MUTATION_ATTEMPT", "PROPOSAL_SCORE_MUTATION_ATTEMPT"],
    ["APPROVAL_ATTEMPT", "PROPOSAL_APPROVAL_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "IMPLEMENTATION_AUTHORIZATION_ATTEMPT"],
  ] as readonly [ProposalExplainabilityScenario, ProposalExplainabilityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = explainAdaptationProposals({ scenario });

    expect(result.explainability_state).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.explanation_validation_failures).toContain(failure);
    expect(result.explanations).toEqual([]);
    expect(result.complete).toBe(false);
    expect(result.approves_proposals).toBe(false);
  });

  it("replays proposal explanations and detects tampering", () => {
    const result = explainAdaptationProposals({ scenario: "ROLLBACK_PATH" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayProposalExplanations(result)).toBe(true);
    expect(replayProposalExplanations(tampered)).toBe(false);
  });
});
