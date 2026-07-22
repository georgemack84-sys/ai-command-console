import { describe, expect, it } from "vitest";
import {
  getAdaptationPrioritizationFoundation,
  prioritizeAdaptationProposals,
  replayAdaptationPrioritization,
} from "@/services/adaptation-prioritization-engine";
import type { AdaptationPrioritizationFailure, AdaptationPrioritizationScenario } from "@/types/adaptation-prioritization-engine";

describe("Mission Control Phase 10.10.4 Adaptation Prioritization Engine", () => {
  it("publishes the adaptation prioritization engine contract", () => {
    const foundation = getAdaptationPrioritizationFoundation();

    expect(foundation.adaptation_prioritization_engine_version).toBe("adaptation-prioritization-engine/v1");
    expect(foundation.api_surface.prioritize_proposals).toBe("POST /adaptation-prioritization-engine/prioritize");
    expect(foundation.api_surface.approval_supported).toBe(false);
    expect(foundation.api_surface.implementation_supported).toBe(false);
    expect(foundation.priority_levels).toEqual(["CRITICAL", "HIGH", "MEDIUM", "LOW", "DEFERRED"]);
    expect(foundation.supported_factors).toEqual([
      "EXPECTED_BENEFIT",
      "URGENCY",
      "RECURRENCE",
      "MISSION_IMPACT",
      "OPERATOR_IMPACT",
      "GOVERNANCE_IMPACT",
      "CONSTITUTIONAL_IMPORTANCE",
      "EVIDENCE_STRENGTH",
      "SIMULATION_READINESS",
      "CERTIFICATION_READINESS",
    ]);
    expect(foundation.result.prioritization_state).toBe("PRIORITIZED");
  });

  it("prioritizes proposals deterministically", () => {
    const first = prioritizeAdaptationProposals({ scenario: "BASELINE" });
    const second = prioritizeAdaptationProposals({ scenario: "BASELINE" });

    expect(first.prioritized_proposals[0]?.priority_score).toBe(second.prioritized_proposals[0]?.priority_score);
    expect(first.prioritized_proposals[0]?.priority_level).toBe(second.prioritized_proposals[0]?.priority_level);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("calculates every prioritization factor", () => {
    const priority = prioritizeAdaptationProposals().prioritized_proposals[0];

    expect(priority?.factor_scores.map((factor) => factor.factor)).toEqual([
      "EXPECTED_BENEFIT",
      "URGENCY",
      "RECURRENCE",
      "MISSION_IMPACT",
      "OPERATOR_IMPACT",
      "GOVERNANCE_IMPACT",
      "CONSTITUTIONAL_IMPORTANCE",
      "EVIDENCE_STRENGTH",
      "SIMULATION_READINESS",
      "CERTIFICATION_READINESS",
    ]);
    expect(priority?.factor_scores.every((factor) => factor.weight > 0 && factor.weighted_score >= 0)).toBe(true);
  });

  it("assigns deterministic priority levels", () => {
    expect(prioritizeAdaptationProposals({ scenario: "CRITICAL" }).prioritized_proposals[0]?.priority_level).toBe("CRITICAL");
    expect(prioritizeAdaptationProposals({ scenario: "HIGH" }).prioritized_proposals[0]?.priority_level).toBe("HIGH");
    expect(prioritizeAdaptationProposals({ scenario: "MEDIUM" }).prioritized_proposals[0]?.priority_level).toBe("MEDIUM");
    expect(prioritizeAdaptationProposals({ scenario: "LOW" }).prioritized_proposals[0]?.priority_level).toBe("LOW");
    expect(prioritizeAdaptationProposals({ scenario: "DEFERRED" }).prioritized_proposals[0]?.priority_level).toBe("DEFERRED");
  });

  it("provides complete priority explanations", () => {
    const priority = prioritizeAdaptationProposals().prioritized_proposals[0];

    expect(priority?.explanation.calculation_version).toBe("adaptation-prioritization-rules/v1");
    expect(priority?.explanation.contributing_factors.length).toBeGreaterThan(0);
    expect(priority?.explanation.evidence_references.length).toBeGreaterThan(0);
    expect(priority?.explanation.replay_references.length).toBeGreaterThan(0);
    expect(priority?.explanation.governance_considerations.length).toBeGreaterThan(0);
    expect(priority?.explanation.constitutional_considerations.length).toBeGreaterThan(0);
    expect(priority?.explanation.readiness_assessment).toContain("simulation=");
  });

  it("records deterministic ranks and tie-break values", () => {
    const result = prioritizeAdaptationProposals({ scenario: "TIE_BREAK" });
    const priority = result.prioritized_proposals[0];

    expect(priority?.rank).toBe(1);
    expect(priority?.tie_break_values).toHaveLength(6);
    expect(priority?.tie_break_values[5]).toBe(priority?.proposal_id);
  });

  it("publishes prioritization metrics", () => {
    const result = prioritizeAdaptationProposals();

    expect(result.metrics.proposals_prioritized).toBe(1);
    expect(result.metrics.priority_distribution[result.prioritized_proposals[0]?.priority_level ?? "MEDIUM"]).toBe(1);
    expect(result.metrics.average_prioritization_latency_ms).toBe(0);
    expect(result.metrics.benefit_distribution.length).toBe(1);
    expect(result.metrics.urgency_distribution.length).toBe(1);
    expect(result.metrics.mission_impact_distribution.length).toBe(1);
    expect(result.metrics.evidence_strength_distribution.length).toBe(1);
    expect(result.metrics.governance_sensitivity_distribution.length).toBe(1);
    expect(result.metrics.simulation_readiness_distribution.length).toBe(1);
    expect(result.metrics.certification_readiness_distribution.length).toBe(1);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it("keeps prioritization advisory-only and non-mutating", () => {
    const result = prioritizeAdaptationProposals();
    const priority = result.prioritized_proposals[0];

    expect(result.advisory_only).toBe(true);
    expect(result.approves_proposals).toBe(false);
    expect(result.rejects_proposals).toBe(false);
    expect(result.implements_proposals).toBe(false);
    expect(result.suppresses_proposals).toBe(false);
    expect(result.mutates_proposals).toBe(false);
    expect(result.alters_governance_workflows).toBe(false);
    expect(priority?.approves_proposal).toBe(false);
    expect(priority?.rejects_proposal).toBe(false);
    expect(priority?.implements_proposal).toBe(false);
    expect(priority?.suppresses_proposal).toBe(false);
    expect(priority?.mutates_proposal).toBe(false);
  });

  it.each([
    ["MISSING_SCORE", "PROPOSAL_SCORE_UNAVAILABLE"],
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["GOVERNANCE_MISSING", "GOVERNANCE_ANALYSIS_MISSING"],
    ["CONSTITUTIONAL_MISSING", "CONSTITUTIONAL_ANALYSIS_MISSING"],
    ["INVALID_PROPOSAL", "PROPOSAL_VALIDATION_FAILED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["ORDERING_FAILURE", "DETERMINISTIC_ORDERING_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["APPROVAL_ATTEMPT", "PROPOSAL_APPROVAL_ATTEMPT"],
    ["REJECTION_ATTEMPT", "PROPOSAL_REJECTION_ATTEMPT"],
    ["SUPPRESSION_ATTEMPT", "PROPOSAL_SUPPRESSION_ATTEMPT"],
    ["GOVERNANCE_WORKFLOW_ALTERATION", "GOVERNANCE_WORKFLOW_ALTERATION_ATTEMPT"],
  ] as readonly [AdaptationPrioritizationScenario, AdaptationPrioritizationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = prioritizeAdaptationProposals({ scenario });

    expect(result.prioritization_state).not.toBe("PRIORITIZED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.prioritization_validation_failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.approves_proposals).toBe(false);
  });

  it("defers missing evidence rather than prioritizing it", () => {
    const result = prioritizeAdaptationProposals({ scenario: "MISSING_EVIDENCE" });

    expect(result.prioritization_state).toBe("DEFERRED");
    expect(result.evidence_validated).toBe(false);
    expect(result.prioritized_proposals[0]?.priority_level).toBe("DEFERRED");
  });

  it("replays prioritization and detects tampering", () => {
    const result = prioritizeAdaptationProposals();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationPrioritization(result)).toBe(true);
    expect(replayAdaptationPrioritization(tampered)).toBe(false);
  });
});
