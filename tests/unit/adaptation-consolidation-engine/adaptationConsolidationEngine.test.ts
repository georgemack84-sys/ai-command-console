import { describe, expect, it } from "vitest";
import {
  consolidateAdaptationProposals,
  getAdaptationConsolidationFoundation,
  replayAdaptationConsolidation,
} from "@/services/adaptation-consolidation-engine";
import type {
  AdaptationConsolidationFailure,
  AdaptationConsolidationScenario,
  AdaptationRelationshipType,
} from "@/types/adaptation-consolidation-engine";

describe("Mission Control Phase 10.10.6 Adaptation Consolidation Engine", () => {
  it("publishes the adaptation consolidation engine contract", () => {
    const foundation = getAdaptationConsolidationFoundation();

    expect(foundation.adaptation_consolidation_engine_version).toBe("adaptation-consolidation-engine/v1");
    expect(foundation.api_surface.consolidate_proposals).toBe("POST /adaptation-consolidation-engine/consolidate");
    expect(foundation.api_surface.retrieve_relationships).toBe("POST /adaptation-consolidation-engine/relationships");
    expect(foundation.api_surface.proposal_mutation_supported).toBe(false);
    expect(foundation.api_surface.approval_supported).toBe(false);
    expect(foundation.supported_relationships).toEqual(["DUPLICATE", "OVERLAPPING", "COMPLEMENTARY", "CONFLICTING", "SEQUENTIAL", "DEPENDENT", "INDEPENDENT"]);
    expect(foundation.supported_actions).toContain("MERGE_CANONICAL");
    expect(foundation.result.consolidation_state).toBe("CONSOLIDATED");
  });

  it("consolidates deterministically", () => {
    const first = consolidateAdaptationProposals({ scenario: "OVERLAPPING" });
    const second = consolidateAdaptationProposals({ scenario: "OVERLAPPING" });

    expect(first.relationships[0]?.integrity_hash).toBe(second.relationships[0]?.integrity_hash);
    expect(first.consolidated_proposals[0]?.integrity_hash).toBe(second.consolidated_proposals[0]?.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("keeps single clean proposals traceable without implying approval", () => {
    const result = consolidateAdaptationProposals();
    const proposal = result.consolidated_proposals[0];

    expect(result.relationships[0]?.relationship_type).toBe("INDEPENDENT");
    expect(proposal?.action).toBe("KEEP_SEPARATE");
    expect(proposal?.source_proposal_ids.length).toBe(1);
    expect(proposal?.preserves_original_intent).toBe(true);
    expect(proposal?.approves_proposals).toBe(false);
    expect(proposal?.implements_proposals).toBe(false);
    expect(proposal?.explanation.non_authority_statement).toContain("does not approve");
  });

  it.each([
    ["DUPLICATE", "DUPLICATE", "MERGE_CANONICAL"],
    ["ANALYSIS_INPUT", "DUPLICATE", "MERGE_CANONICAL"],
    ["OVERLAPPING", "OVERLAPPING", "MERGE_RELATED"],
    ["COMPLEMENTARY", "COMPLEMENTARY", "COORDINATE_RECOMMENDATION"],
    ["CONFLICTING", "CONFLICTING", "KEEP_SEPARATE_WITH_RELATIONSHIP"],
    ["SEQUENTIAL", "SEQUENTIAL", "KEEP_SEPARATE_WITH_RELATIONSHIP"],
    ["DEPENDENT", "DEPENDENT", "KEEP_SEPARATE_WITH_RELATIONSHIP"],
  ] as readonly [AdaptationConsolidationScenario, AdaptationRelationshipType, string][])("classifies %s relationships deterministically", (scenario, relationshipType, action) => {
    const result = consolidateAdaptationProposals({ scenario });
    const relationship = result.relationships[0];
    const proposal = result.consolidated_proposals[0];

    expect(relationship?.relationship_type).toBe(relationshipType);
    expect(relationship?.detection_criteria.length).toBeGreaterThan(0);
    expect(proposal?.action).toBe(action);
    expect(proposal?.source_proposal_ids.length).toBeGreaterThanOrEqual(1);
    expect(proposal?.lineage.original_proposal_ids).toEqual(proposal?.source_proposal_ids);
    expect(proposal?.lineage.evidence_lineage.length).toBeGreaterThan(0);
    expect(proposal?.lineage.replay_lineage.length).toBeGreaterThan(0);
  });

  it("keeps conflicting proposals independent and explicitly linked", () => {
    const result = consolidateAdaptationProposals({ scenario: "CONFLICTING" });
    const relationship = result.relationships[0];
    const proposal = result.consolidated_proposals[0];

    expect(relationship?.merge_allowed).toBe(false);
    expect(relationship?.requires_operator_review).toBe(true);
    expect(relationship?.requires_governance_review).toBe(true);
    expect(proposal?.action).toBe("KEEP_SEPARATE_WITH_RELATIONSHIP");
    expect(proposal?.consolidation_rationale).toContain("independence is preserved");
  });

  it("preserves complete lineage across consolidation", () => {
    const proposal = consolidateAdaptationProposals({ scenario: "DUPLICATE" }).consolidated_proposals[0];

    expect(proposal?.lineage.original_proposal_ids.length).toBeGreaterThan(1);
    expect(proposal?.lineage.generated_proposal_ids.length).toBeGreaterThan(1);
    expect(proposal?.lineage.evidence_lineage.length).toBeGreaterThan(0);
    expect(proposal?.lineage.replay_lineage.length).toBeGreaterThan(0);
    expect(proposal?.lineage.governance_lineage.length).toBeGreaterThan(0);
    expect(proposal?.lineage.scoring_lineage.length).toBeGreaterThan(0);
    expect(proposal?.lineage.suppression_history.length).toBeGreaterThan(0);
    expect(proposal?.lineage.prioritization_history.length).toBeGreaterThan(0);
  });

  it("publishes consolidation metrics", () => {
    const result = consolidateAdaptationProposals({ scenario: "OVERLAPPING" });

    expect(result.metrics.proposals_evaluated).toBe(2);
    expect(result.metrics.proposals_eligible).toBe(2);
    expect(result.metrics.overlapping_relationships).toBe(1);
    expect(result.metrics.evidence_references_merged).toBeGreaterThan(0);
    expect(result.metrics.consolidation_latency_ms).toBe(0);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it("keeps consolidation advisory-only and non-mutating", () => {
    const result = consolidateAdaptationProposals({ scenario: "COMPLEMENTARY" });
    const proposal = result.consolidated_proposals[0];

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.mutates_historical_records).toBe(false);
    expect(result.approves_proposals).toBe(false);
    expect(result.rejects_proposals).toBe(false);
    expect(result.suppresses_proposals).toBe(false);
    expect(result.implements_proposals).toBe(false);
    expect(proposal?.modifies_proposals).toBe(false);
    expect(proposal?.approves_proposals).toBe(false);
    expect(proposal?.rejects_proposals).toBe(false);
    expect(proposal?.suppresses_proposals).toBe(false);
    expect(proposal?.implements_proposals).toBe(false);
  });

  it.each([
    ["SUPPRESSED_INPUT", "NO_ELIGIBLE_PROPOSALS"],
    ["REWORK_INPUT", "NO_ELIGIBLE_PROPOSALS"],
    ["INVALID_PROPOSAL", "PROPOSAL_VALIDATION_FAILED"],
    ["MISSING_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_LINEAGE_INCOMPLETE"],
    ["GOVERNANCE_UNAVAILABLE", "GOVERNANCE_ANALYSIS_UNAVAILABLE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["NONDETERMINISTIC_CONSOLIDATION", "DETERMINISTIC_CONSOLIDATION_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["INTENT_MUTATION_ATTEMPT", "PROPOSAL_INTENT_MUTATION_ATTEMPT"],
    ["HISTORICAL_MUTATION_ATTEMPT", "HISTORICAL_RECORD_MUTATION_ATTEMPT"],
    ["CONFLICT_MERGE_ATTEMPT", "CONFLICTING_PROPOSALS_MERGE_ATTEMPT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPT"],
    ["OPERATOR_REVIEW_BYPASS", "OPERATOR_REVIEW_BYPASS_ATTEMPT"],
    ["APPROVAL_ATTEMPT", "PROPOSAL_APPROVAL_ATTEMPT"],
    ["REJECTION_ATTEMPT", "PROPOSAL_REJECTION_ATTEMPT"],
    ["SUPPRESSION_ATTEMPT", "PROPOSAL_SUPPRESSION_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "PROPOSAL_IMPLEMENTATION_ATTEMPT"],
  ] as readonly [AdaptationConsolidationScenario, AdaptationConsolidationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = consolidateAdaptationProposals({ scenario });

    expect(result.consolidation_state).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.validation_failures).toContain(failure);
    expect(result.consolidated_proposals).toEqual([]);
    expect(result.modifies_proposals).toBe(false);
    expect(result.approves_proposals).toBe(false);
  });

  it("replays consolidation and detects tampering", () => {
    const result = consolidateAdaptationProposals({ scenario: "DUPLICATE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationConsolidation(result)).toBe(true);
    expect(replayAdaptationConsolidation(tampered)).toBe(false);
  });
});
