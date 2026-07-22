import { describe, expect, it } from "vitest";
import {
  analyzeStrategicOpportunities,
  getStrategicOpportunityAnalyzerFoundation,
  replayStrategicOpportunityAnalysis,
} from "@/services/strategic-opportunity-analyzer";
import type { StrategicOpportunityFailure, StrategicOpportunityScenario } from "@/types/strategic-opportunity-analyzer";

describe("Mission Control Phase 10.5.2 Strategic Opportunity Analyzer", () => {
  it("publishes the strategic opportunity analyzer foundation", () => {
    const foundation = getStrategicOpportunityAnalyzerFoundation();

    expect(foundation.strategic_opportunity_analyzer_version).toBe("strategic-opportunity-analyzer/v1");
    expect(foundation.api_surface.analyze_opportunities).toBe("POST /strategic-opportunity-analyzer/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("identifies repeatable strategic opportunities deterministically", () => {
    const first = analyzeStrategicOpportunities();
    const second = analyzeStrategicOpportunities();

    expect(first.opportunities[0].opportunity_id).toBe(second.opportunities[0].opportunity_id);
    expect(first.opportunities[0].opportunity_score).toBe(second.opportunities[0].opportunity_score);
    expect(first.opportunities[0].ranking_position).toBe(1);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported opportunity categories", () => {
    expect(analyzeStrategicOpportunities({ scenario: "SUCCESS_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("SUCCESS_OPPORTUNITY");
    expect(analyzeStrategicOpportunities({ scenario: "RISK_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("RISK_OPPORTUNITY");
    expect(analyzeStrategicOpportunities({ scenario: "DECISION_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("DECISION_OPPORTUNITY");
    expect(analyzeStrategicOpportunities({ scenario: "EVIDENCE_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("EVIDENCE_OPPORTUNITY");
    expect(analyzeStrategicOpportunities({ scenario: "GOVERNANCE_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("GOVERNANCE_OPPORTUNITY");
    expect(analyzeStrategicOpportunities({ scenario: "OPERATOR_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("OPERATOR_OPPORTUNITY");
    expect(analyzeStrategicOpportunities({ scenario: "SIMULATION_OPPORTUNITY" }).opportunities[0].opportunity_category).toBe("SIMULATION_OPPORTUNITY");
  });

  it("attaches evidence, governance, and replay lineage to every opportunity", () => {
    const opportunity = analyzeStrategicOpportunities().opportunities[0];

    expect(opportunity.supporting_pattern_refs.length).toBeGreaterThan(0);
    expect(opportunity.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(opportunity.supporting_recommendation_refs.length).toBeGreaterThan(0);
    expect(opportunity.supporting_decision_refs.length).toBeGreaterThan(0);
    expect(opportunity.supporting_governance_refs.length).toBeGreaterThan(0);
    expect(opportunity.supporting_replay_refs.length).toBeGreaterThan(0);
  });

  it("keeps opportunities advisory-only and does not generate proposals", () => {
    const result = analyzeStrategicOpportunities();
    const opportunity = result.opportunities[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_strategy).toBe(false);
    expect(result.generates_proposals).toBe(false);
    expect(opportunity.advisory_only).toBe(true);
    expect(opportunity.mutates_strategy).toBe(false);
  });

  it("records immutable append-only opportunity registry entries", () => {
    const result = analyzeStrategicOpportunities();
    const opportunity = result.opportunities[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.opportunity_refs).toEqual([opportunity.opportunity_id]);
    expect(result.registry.ranking_index).toEqual([opportunity.opportunity_id]);
  });

  it("replays strategic opportunity analysis", () => {
    const result = analyzeStrategicOpportunities();

    expect(replayStrategicOpportunityAnalysis(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_CONTRACT", "STRATEGY_CONTRACT_UNCERTIFIED"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_PATTERN_INTELLIGENCE", "PATTERN_INTELLIGENCE_UNAVAILABLE"],
    ["REPLAY_FAILURE", "REPLAY_VERIFICATION_FAILED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["NOT_REPRODUCIBLE", "OPPORTUNITY_NOT_REPRODUCIBLE"],
    ["NONDETERMINISTIC_RANKING", "RANKING_NONDETERMINISTIC"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["SINGLE_SUCCESS", "SINGLE_SUCCESS_INSUFFICIENT"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["STRATEGY_MUTATION", "STRATEGY_MUTATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategicOpportunityScenario, StrategicOpportunityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeStrategicOpportunities({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.generates_proposals).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = analyzeStrategicOpportunities({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects strategic opportunity tampering during replay", () => {
    const result = analyzeStrategicOpportunities();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategicOpportunityAnalysis(tampered)).toBe(false);
  });
});
