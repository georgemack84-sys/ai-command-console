import { describe, expect, it } from "vitest";
import {
  replayGovernanceConstitutionalStrategyReview,
  reviewGovernanceConstitutionalStrategy,
  getGovernanceConstitutionalStrategyReviewFoundation,
} from "@/services/governance-constitutional-strategy-review";
import { recordStrategyEvolutionLedger } from "@/services/strategy-evolution-ledger";
import { generateStrategyImprovementProposals } from "@/services/strategy-improvement-proposal-generator";
import type {
  GovernanceConstitutionalStrategyReviewFailure,
  GovernanceConstitutionalStrategyReviewScenario,
} from "@/types/governance-constitutional-strategy-review";

const proposal_result = generateStrategyImprovementProposals();
const ledger_result = recordStrategyEvolutionLedger({ proposal_result });

describe("Mission Control Phase 10.5.7 Governance & Constitutional Strategy Review", () => {
  it("publishes the governance constitutional strategy review foundation", () => {
    const foundation = getGovernanceConstitutionalStrategyReviewFoundation();

    expect(foundation.governance_constitutional_strategy_review_version).toBe("governance-constitutional-strategy-review/v1");
    expect(foundation.api_surface.review_proposal).toBe("POST /governance-constitutional-strategy-review/review");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("reviews proposals deterministically", () => {
    const first = reviewGovernanceConstitutionalStrategy({ ledger_result });
    const second = reviewGovernanceConstitutionalStrategy({ ledger_result });

    expect(first.reviews[0].review_id).toBe(second.reviews[0].review_id);
    expect(first.reviews[0].review_outcome).toBe("APPROVED_FOR_SIMULATION");
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports deterministic review outcomes", () => {
    expect(reviewGovernanceConstitutionalStrategy({ ledger_result, scenario: "APPROVED_FOR_SIMULATION" }).reviews[0].review_outcome).toBe("APPROVED_FOR_SIMULATION");
    expect(reviewGovernanceConstitutionalStrategy({ ledger_result, scenario: "REVISION_REQUIRED" }).reviews[0].review_outcome).toBe("REVISION_REQUIRED");
    expect(reviewGovernanceConstitutionalStrategy({ ledger_result, scenario: "GOVERNANCE_REJECTED" }).reviews[0].review_outcome).toBe("GOVERNANCE_REJECTED");
    expect(reviewGovernanceConstitutionalStrategy({ ledger_result, scenario: "CONSTITUTIONAL_REJECTED" }).reviews[0].review_outcome).toBe("CONSTITUTIONAL_REJECTED");
  });

  it("attaches governance, policy, regulatory, and replay findings", () => {
    const review = reviewGovernanceConstitutionalStrategy({ ledger_result }).reviews[0];

    expect(review.supporting_governance_refs.length).toBeGreaterThan(0);
    expect(review.supporting_policy_refs.length).toBeGreaterThan(0);
    expect(review.regulatory_implications.length).toBeGreaterThan(0);
    expect(review.supporting_replay_refs.length).toBeGreaterThan(0);
    expect(review.reviewer_identity).toBe("governance_constitutional_strategy_review_engine");
  });

  it("only permits simulation entry after certified approval", () => {
    const approved = reviewGovernanceConstitutionalStrategy({ ledger_result });
    const revision = reviewGovernanceConstitutionalStrategy({ ledger_result, scenario: "REVISION_REQUIRED" });

    expect(approved.validation.certified).toBe(true);
    expect(approved.simulation_entry_permitted).toBe(true);
    expect(revision.validation.certified).toBe(true);
    expect(revision.simulation_entry_permitted).toBe(false);
  });

  it("does not mutate strategy or directly approve proposals", () => {
    const result = reviewGovernanceConstitutionalStrategy({ ledger_result });
    const review = result.reviews[0];

    expect(result.mutates_strategy).toBe(false);
    expect(result.direct_approval).toBe(false);
    expect(review.mutates_strategy).toBe(false);
    expect(review.direct_approval).toBe(false);
  });

  it("records immutable append-only review registry entries", () => {
    const result = reviewGovernanceConstitutionalStrategy({ ledger_result });
    const review = result.reviews[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.review_refs).toEqual([review.review_id]);
    expect(result.registry.outcome_index[review.review_outcome]).toEqual([review.review_id]);
  });

  it("replays governance constitutional strategy review", () => {
    const result = reviewGovernanceConstitutionalStrategy({ ledger_result });

    expect(replayGovernanceConstitutionalStrategyReview(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_LEDGER", "LEDGER_UNCERTIFIED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_COMPLIANCE_INCOMPLETE"],
    ["CONSTITUTIONAL_FAIL", "CONSTITUTIONAL_COMPLIANCE_FAILED"],
    ["AUTHORITY_FAIL", "AUTHORITY_VERIFICATION_FAILED"],
    ["TENANT_ISOLATION_FAIL", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATED"],
    ["POLICY_CONFLICT", "POLICY_CONFLICT_UNRESOLVED"],
    ["MISSING_REGULATORY", "REGULATORY_ANALYSIS_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["CROSS_TENANT", "CROSS_TENANT_PROPOSAL_DETECTED"],
    ["NONDETERMINISTIC_OUTCOME", "REVIEW_OUTCOME_NONDETERMINISTIC"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["SIMULATION_BYPASS", "SIMULATION_BYPASS_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [GovernanceConstitutionalStrategyReviewScenario, GovernanceConstitutionalStrategyReviewFailure][])("fails closed for %s", (scenario, failure) => {
    const result = reviewGovernanceConstitutionalStrategy({ ledger_result, scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.simulation_entry_permitted).toBe(false);
  });

  it("keeps incomplete review inputs pending instead of certified", () => {
    const result = reviewGovernanceConstitutionalStrategy({ ledger_result, scenario: "MISSING_REGULATORY" });

    expect(result.validation.state).toBe("PENDING_REVIEW");
    expect(result.validation.regulatory_complete).toBe(false);
  });

  it("detects review tampering during replay", () => {
    const result = reviewGovernanceConstitutionalStrategy({ ledger_result });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceConstitutionalStrategyReview(tampered)).toBe(false);
  });
});
