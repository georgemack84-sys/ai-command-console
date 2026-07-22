import { describe, expect, it } from "vitest";
import {
  generateStrategyImprovementProposals,
  getStrategyImprovementProposalFoundation,
  replayStrategyImprovementProposalGeneration,
} from "@/services/strategy-improvement-proposal-generator";
import type { StrategyImprovementProposalFailure, StrategyImprovementProposalScenario } from "@/types/strategy-improvement-proposal-generator";

describe("Mission Control Phase 10.5.5 Strategy Improvement Proposal Generator", () => {
  it("publishes the strategy improvement proposal foundation", () => {
    const foundation = getStrategyImprovementProposalFoundation();

    expect(foundation.strategy_improvement_proposal_generator_version).toBe("strategy-improvement-proposal-generator/v1");
    expect(foundation.api_surface.generate_proposals).toBe("POST /strategy-improvement-proposal-generator/generate");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("generates proposals deterministically", () => {
    const first = generateStrategyImprovementProposals();
    const second = generateStrategyImprovementProposals();

    expect(first.proposals[0].proposal_id).toBe(second.proposals[0].proposal_id);
    expect(first.proposals[0].priority_score).toBe(second.proposals[0].priority_score);
    expect(first.proposals[0].priority_rank).toBe(1);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports advisory recommendation states", () => {
    expect(generateStrategyImprovementProposals({ scenario: "ADVANCE" }).proposals[0].recommendation).toBe("ADVANCE");
    expect(generateStrategyImprovementProposals({ scenario: "DEFER" }).proposals[0].recommendation).toBe("DEFER");
    expect(generateStrategyImprovementProposals({ scenario: "REVISE" }).proposals[0].recommendation).toBe("REVISE");
    expect(generateStrategyImprovementProposals({ scenario: "REJECT" }).proposals[0].recommendation).toBe("REJECT");
  });

  it("attaches mandatory evidence, benefits, risks, governance, constitutional, operator, replay, and rollback fields", () => {
    const proposal = generateStrategyImprovementProposals().proposals[0];

    expect(proposal.supporting_pattern_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(proposal.expected_benefits.length).toBeGreaterThan(0);
    expect(proposal.expected_risks.length).toBeGreaterThan(0);
    expect(proposal.governance_implications.length).toBeGreaterThan(0);
    expect(proposal.constitutional_implications.length).toBeGreaterThan(0);
    expect(proposal.operator_impact.length).toBeGreaterThan(0);
    expect(proposal.replay_refs.length).toBeGreaterThan(0);
    expect(proposal.rollback_plan_ref.length).toBeGreaterThan(0);
  });

  it("requires simulation, approval, and certification before adoption", () => {
    const proposal = generateStrategyImprovementProposals().proposals[0];

    expect(proposal.simulation_required).toBe(true);
    expect(proposal.approval_required).toBe(true);
    expect(proposal.certification_required).toBe(true);
  });

  it("keeps proposals advisory-only and does not mutate strategy or directly approve", () => {
    const result = generateStrategyImprovementProposals();
    const proposal = result.proposals[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_strategy).toBe(false);
    expect(result.direct_approval).toBe(false);
    expect(proposal.advisory_only).toBe(true);
    expect(proposal.mutates_strategy).toBe(false);
  });

  it("records immutable append-only proposal registry entries", () => {
    const result = generateStrategyImprovementProposals();
    const proposal = result.proposals[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.proposal_refs).toEqual([proposal.proposal_id]);
    expect(result.registry.priority_index).toEqual([proposal.proposal_id]);
    expect(result.registry.recommendation_index[proposal.recommendation]).toEqual([proposal.proposal_id]);
  });

  it("replays proposal generation", () => {
    const result = generateStrategyImprovementProposals();

    expect(replayStrategyImprovementProposalGeneration(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_UPSTREAM", "UPSTREAM_INTELLIGENCE_UNCERTIFIED"],
    ["MISSING_HISTORICAL_EVIDENCE", "HISTORICAL_EVIDENCE_MISSING"],
    ["MISSING_PATTERN_REFS", "RECURRING_PATTERN_REFERENCES_MISSING"],
    ["MISSING_BENEFITS", "EXPECTED_BENEFITS_MISSING"],
    ["MISSING_RISKS", "EXPECTED_RISKS_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_ANALYSIS_INCOMPLETE"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_ANALYSIS_INCOMPLETE"],
    ["MISSING_OPERATOR_IMPACT", "OPERATOR_IMPACT_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_ROLLBACK", "ROLLBACK_PLAN_MISSING"],
    ["SIMULATION_DISABLED", "SIMULATION_REQUIREMENT_DISABLED"],
    ["APPROVAL_DISABLED", "APPROVAL_REQUIREMENT_DISABLED"],
    ["CERTIFICATION_DISABLED", "CERTIFICATION_REQUIREMENT_DISABLED"],
    ["HIDDEN_REASONING", "HIDDEN_REASONING_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["NONDETERMINISTIC_PRIORITY", "PRIORITY_NONDETERMINISTIC"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["STRATEGY_MUTATION", "STRATEGY_MUTATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategyImprovementProposalScenario, StrategyImprovementProposalFailure][])("fails closed for %s", (scenario, failure) => {
    const result = generateStrategyImprovementProposals({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.direct_approval).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = generateStrategyImprovementProposals({ scenario: "MISSING_HISTORICAL_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects proposal tampering during replay", () => {
    const result = generateStrategyImprovementProposals();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategyImprovementProposalGeneration(tampered)).toBe(false);
  });
});
