import { describe, expect, it } from "vitest";
import {
  computeImprovementOpportunityHash,
  generateImprovementOpportunities,
  getImprovementOpportunityFoundation,
  IMPROVEMENT_CLASSIFICATIONS,
  IMPROVEMENT_OPPORTUNITY_CATEGORIES,
  replayImprovementOpportunityGeneration,
} from "@/services/improvement-opportunity-generator";
import type { ImprovementOpportunityFailure, ImprovementOpportunityScenario, ImprovementPriority } from "@/types/improvement-opportunity-generator";

describe("Mission Control Phase 10.3.8 Improvement Opportunity Generator", () => {
  it("publishes the improvement opportunity generator foundation", () => {
    const foundation = getImprovementOpportunityFoundation();

    expect(foundation.improvement_opportunity_generator_version).toBe("improvement-opportunity-generator/v1");
    expect(foundation.categories).toEqual(IMPROVEMENT_OPPORTUNITY_CATEGORIES);
    expect(foundation.classifications).toEqual(IMPROVEMENT_CLASSIFICATIONS);
    expect(foundation.api_surface.generate_opportunities).toBe("POST /improvement-opportunity-generator/generate");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("generates advisory proposals without automatic adaptation or recommendation modification", () => {
    const result = generateImprovementOpportunities();

    expect(result.advisory_only).toBe(true);
    expect(result.governance_controlled).toBe(true);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.implementation_authorized).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.recommendation_modification_supported).toBe(false);
    expect(result.opportunities.every((opportunity) => opportunity.implementation_authorized === false)).toBe(true);
  });

  it("creates evidence-backed opportunities from dimension evaluation results", () => {
    const result = generateImprovementOpportunities({ scenario: "WEAK_EVIDENCE_ONLY" });
    const opportunity = result.opportunities[0];

    expect(opportunity.category).toBe("EVIDENCE");
    expect(opportunity.classification).toBe("EVIDENCE_SUFFICIENCY");
    expect(opportunity.supporting_evidence.length).toBeGreaterThan(0);
    expect(opportunity.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(opportunity.source_dimension_score_refs.length).toBe(1);
    expect(opportunity.rationale).toContain("evidence evaluation");
  });

  it.each([
    ["WEAK_EVIDENCE_ONLY", "EVIDENCE", "HIGH"],
    ["WEAK_RISK_ONLY", "RISK", "HIGH"],
    ["WEAK_CONFIDENCE_ONLY", "CONFIDENCE", "HIGH"],
    ["WEAK_GOVERNANCE_ONLY", "GOVERNANCE", "HIGH"],
    ["WEAK_EXPLAINABILITY_ONLY", "EXPLAINABILITY", "HIGH"],
    ["WEAK_ALTERNATIVES_ONLY", "DECISION_PACKAGE", "HIGH"],
    ["WEAK_ROLLBACK_ONLY", "DECISION_PACKAGE", "HIGH"],
  ] as const)("classifies and prioritizes %s deterministically", (scenario, category, priority) => {
    const result = generateImprovementOpportunities({ scenario });
    const opportunity = result.opportunities[0];

    expect(opportunity.category).toBe(category);
    expect(opportunity.implementation_priority).toBe(priority);
    expect(opportunity.expected_benefit).toBeGreaterThan(0);
    expect(opportunity.governance_required).toBe(true);
  });

  it.each([
    ["POOR", "CRITICAL"],
    ["WEAK_RISK_ONLY", "HIGH"],
    ["LIMITED", "MEDIUM"],
    ["ADEQUATE", "LOW"],
    ["GOOD", "MAINTAIN"],
  ] as readonly [ImprovementOpportunityScenario, ImprovementPriority][])("orders %s by deterministic priority", (scenario, priority) => {
    const result = generateImprovementOpportunities({ scenario });

    expect(result.opportunities[0].implementation_priority).toBe(priority);
  });

  it("creates stable opportunity hashes and replay output", () => {
    const result = generateImprovementOpportunities();

    expect(result.opportunities.every((opportunity) => computeImprovementOpportunityHash(opportunity) === opportunity.integrity_hash)).toBe(true);
    expect(replayImprovementOpportunityGeneration(result)).toBe(true);
  });

  it("records append-only tenant-isolated registry and Truth Ledger bindings", () => {
    const result = generateImprovementOpportunities();

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.update_supported).toBe(false);
    expect(result.registry.delete_supported).toBe(false);
    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.opportunity_refs).toEqual(result.opportunities.map((opportunity) => opportunity.improvement_id));
    expect(result.validation.ledger_recorded).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
  });

  it("validates governance, replay, lineage, integrity, and no-adaptation controls", () => {
    const result = generateImprovementOpportunities();

    expect(result.validation.governance_ready).toBe(true);
    expect(result.validation.governance_approval_required).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.lineage_complete).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
    expect(result.validation.advisory_only).toBe(true);
    expect(result.validation.no_automatic_adaptation).toBe(true);
  });

  it.each([
    ["MISSING_RECOMMENDATION", "ORIGINATING_RECOMMENDATION_UNAVAILABLE"],
    ["MISSING_EVALUATION", "EVALUATION_RESULTS_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["EVIDENCE_UNAVAILABLE", "SUPPORTING_EVIDENCE_UNAVAILABLE"],
    ["EVALUATION_VERIFICATION_FAILURE", "EVALUATION_VERIFICATION_FAILED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["ADAPTATION_ATTEMPT", "AUTOMATIC_ADAPTATION_ATTEMPTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ImprovementOpportunityScenario, ImprovementOpportunityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = generateImprovementOpportunities({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.implementation_authorized).toBe(false);
  });

  it("keeps missing or unavailable evidence pending instead of certified", () => {
    expect(generateImprovementOpportunities({ scenario: "MISSING_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
    expect(generateImprovementOpportunities({ scenario: "EVIDENCE_UNAVAILABLE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects opportunity generation tampering during replay", () => {
    const result = generateImprovementOpportunities();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayImprovementOpportunityGeneration(tampered)).toBe(false);
  });
});
