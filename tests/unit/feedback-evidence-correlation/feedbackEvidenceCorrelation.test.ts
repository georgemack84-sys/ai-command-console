import { describe, expect, it } from "vitest";
import {
  correlateFeedbackEvidence,
  getFeedbackEvidenceCorrelationFoundation,
  replayFeedbackEvidenceCorrelation,
} from "@/services/feedback-evidence-correlation";
import type { FeedbackEvidenceCorrelationFailure, FeedbackEvidenceCorrelationScenario } from "@/types/feedback-evidence-correlation";

describe("Mission Control Phase 10.9.6 Feedback Evidence Correlation", () => {
  it("publishes an evidence-only correlation contract", () => {
    const foundation = getFeedbackEvidenceCorrelationFoundation();

    expect(foundation.feedback_evidence_correlation_version).toBe("feedback-evidence-correlation/v1");
    expect(foundation.api_surface.correlate_feedback_evidence).toBe("POST /feedback-evidence-correlation/correlate");
    expect(foundation.api_surface.adaptive_proposal_generation_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.result.correlation_state).toBe("CORRELATED");
  });

  it("correlates feedback evidence deterministically", () => {
    const first = correlateFeedbackEvidence({ scenario: "BASELINE" });
    const second = correlateFeedbackEvidence({ scenario: "BASELINE" });

    expect(first.lifecycle_correlation?.correlation_id).toBe(second.lifecycle_correlation?.correlation_id);
    expect(first.graph?.integrity_hash).toBe(second.graph?.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("builds the canonical lifecycle from feedback to adaptive proposal evidence", () => {
    const result = correlateFeedbackEvidence({ scenario: "BASELINE" });

    expect(result.lifecycle_correlation?.feedback_ref).toBeTruthy();
    expect(result.lifecycle_correlation?.decision_ref).toBeTruthy();
    expect(result.lifecycle_correlation?.recommendation_ref).toBeTruthy();
    expect(result.lifecycle_correlation?.outcome_ref).toBeTruthy();
    expect(result.lifecycle_correlation?.simulation_ref).toBeTruthy();
    expect(result.lifecycle_correlation?.replay_ref).toBeTruthy();
    expect(result.lifecycle_correlation?.adaptive_proposal_ref).toContain("adaptive_proposal_evidence");
    expect(result.adaptive_proposal_traceable).toBe(true);
  });

  it("constructs immutable graph nodes and lifecycle edges", () => {
    const result = correlateFeedbackEvidence({ scenario: "BASELINE" });
    const nodeTypes = result.graph?.nodes.map((node) => node.node_type) ?? [];
    const edgeTypes = result.graph?.edges.map((edge) => edge.edge_type) ?? [];

    expect(nodeTypes).toEqual(expect.arrayContaining(["FEEDBACK", "DECISION", "RECOMMENDATION", "OUTCOME", "SIMULATION", "REPLAY", "ADAPTIVE_PROPOSAL", "EVIDENCE", "GOVERNANCE_REVIEW"]));
    expect(edgeTypes).toEqual(expect.arrayContaining(["GENERATED_BY", "INFLUENCED", "RESULTED_IN", "SIMULATED_BY", "REPLAYED_BY", "REFERENCED_BY"]));
    expect(result.graph?.immutable).toBe(true);
    expect(result.graph?.append_only).toBe(true);
  });

  it("maintains an authoritative lineage registry", () => {
    const result = correlateFeedbackEvidence({ scenario: "REJECTION_FEEDBACK" });

    expect(result.lineage_registry_record?.schema_version).toBe("feedback-evidence-lineage/v1");
    expect(result.lineage_registry_record?.evidence_refs.length).toBeGreaterThan(0);
    expect(result.lineage_registry_record?.replay_refs.length).toBeGreaterThan(0);
    expect(result.lineage_registry_record?.adaptive_proposal_refs.length).toBe(1);
    expect(result.lineage_registry_record?.cryptographically_verifiable).toBe(true);
  });

  it.each([
    ["SUCCESSFUL_EXECUTION", "SUCCESSFUL_EXECUTION"],
    ["PARTIAL_SUCCESS", "PARTIAL_SUCCESS"],
    ["UNSUCCESSFUL_EXECUTION", "UNSUCCESSFUL_EXECUTION"],
    ["AVOIDED_FAILURE", "AVOIDED_FAILURE"],
    ["UNEXPECTED_OUTCOME", "UNEXPECTED_OUTCOME"],
    ["MISSION_IMPROVEMENT", "MISSION_IMPROVEMENT"],
    ["MISSION_DEGRADATION", "MISSION_DEGRADATION"],
  ] as const)("maps %s to outcome category", (scenario, outcome) => {
    const result = correlateFeedbackEvidence({ scenario });

    expect(result.lifecycle_correlation?.outcome_category).toBe(outcome);
    expect(result.explanation.operational_outcome).toBe(outcome);
  });

  it("correlates simulation variance metrics without executing simulations", () => {
    const result = correlateFeedbackEvidence({ scenario: "SIMULATION_VARIANCE" });

    expect(result.lifecycle_correlation?.prediction_accuracy).toBe(0.58);
    expect(result.lifecycle_correlation?.variance_magnitude).toBe(0.42);
    expect(result.executes_simulations).toBe(false);
  });

  it("links override and rejection patterns when present", () => {
    const overrideResult = correlateFeedbackEvidence({ scenario: "PATTERN_OVERRIDE" });
    const rejectionResult = correlateFeedbackEvidence({ scenario: "PATTERN_REJECTION" });

    expect(overrideResult.graph?.nodes.some((node) => node.node_type === "PATTERN")).toBe(true);
    expect(rejectionResult.graph?.nodes.some((node) => node.node_type === "PATTERN")).toBe(true);
  });

  it("keeps all correlations explanatory and non-mutating", () => {
    const result = correlateFeedbackEvidence({ scenario: "BASELINE" });

    expect(result.evidence_only).toBe(true);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.generates_adaptive_proposals).toBe(false);
    expect(result.executes_simulations).toBe(false);
    expect(result.overrides_governance).toBe(false);
    expect(result.alters_historical_evidence).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
  });

  it.each([
    ["MISSING_FEEDBACK_REFERENCE", "FEEDBACK_REFERENCE_MISSING"],
    ["MISSING_DECISION", "DECISION_UNAVAILABLE"],
    ["MISSING_RECOMMENDATION", "RECOMMENDATION_UNAVAILABLE"],
    ["MISSING_OUTCOME", "OUTCOME_UNAVAILABLE"],
    ["MISSING_REPLAY_LINEAGE", "REPLAY_LINEAGE_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_UNAVAILABLE"],
    ["MISSING_GOVERNANCE_METADATA", "GOVERNANCE_METADATA_INCOMPLETE"],
    ["INVALID_RULE_VERSION", "CORRELATION_RULE_VERSION_INVALID"],
    ["NORMALIZATION_REJECTED", "NORMALIZED_FEEDBACK_REJECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_FAILED"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT", "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT"],
  ] as readonly [FeedbackEvidenceCorrelationScenario, FeedbackEvidenceCorrelationFailure][])("rejects %s", (scenario, failure) => {
    const result = correlateFeedbackEvidence({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.correlation_state).toBe("REJECTED");
    expect(result.graph).toBeNull();
    expect(result.replayable).toBe(false);
  });

  it("maintains append-only immutable audit entries", () => {
    const result = correlateFeedbackEvidence({ scenario: "BASELINE" });

    expect(result.immutable_lineage).toBe(true);
    expect(result.append_only_audit).toBe(true);
    expect(result.audit_events.every((event) => event.append_only && event.immutable)).toBe(true);
  });

  it("replays correlation output and detects tampering", () => {
    const result = correlateFeedbackEvidence({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayFeedbackEvidenceCorrelation(result)).toBe(true);
    expect(replayFeedbackEvidenceCorrelation(tampered)).toBe(false);
  });
});
