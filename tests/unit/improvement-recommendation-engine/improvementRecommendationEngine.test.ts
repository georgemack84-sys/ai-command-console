import { describe, expect, it } from "vitest";
import {
  buildImprovementRecommendationObservabilitySurface,
  generateImprovementRecommendations,
  getImprovementRecommendationEngineBundle,
  listRecommendationEvidenceChains,
  listRecommendationGuidance,
  listRecommendationLedger,
  listRecommendationRules,
  validateImprovementRecommendations,
} from "@/services/improvement-recommendation-engine";
import type { ImprovementRecommendationFailure, ImprovementRecommendationScenario } from "@/types/improvement-recommendation-engine";

describe("improvement recommendation engine", () => {
  it("publishes the deterministic advisory-only recommendation bundle", () => {
    const bundle = getImprovementRecommendationEngineBundle();

    expect(bundle.doctrine.engine_version).toBe("improvement-recommendation-engine/v8ALT.11.7");
    expect(bundle.doctrine.final_state).toBe("IMPROVEMENT_RECOMMENDATION_ENGINE_READY");
    expect(bundle.repository.final_state).toBe("IMPROVEMENT_RECOMMENDATIONS_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.automatic_implementation_authorized).toBe(false);
    expect(bundle.repository.runtime_behavior_modification_authorized).toBe(false);
    expect(bundle.repository.governance_policy_modification_authorized).toBe(false);
    expect(bundle.repository.constitutional_rule_modification_authorized).toBe(false);
    expect(bundle.repository.implementation_approval_authorized).toBe(false);
  });

  it("generates recommendations from readiness gaps with evidence and guidance", () => {
    const repository = generateImprovementRecommendations();

    expect(repository.recommendations).toHaveLength(repository.readiness.gaps.length);
    expect(repository.rules).toHaveLength(6);
    expect(repository.ledger).toHaveLength(repository.recommendations.length);
    expect(repository.report.recommendation_count).toBe(repository.recommendations.length);
    expect(repository.recommendations.every((item) => item.state === "REVIEW_READY")).toBe(true);
    expect(repository.recommendations.every((item) => item.evidence_chain.complete && item.evidence_chain.replay_references.length > 0)).toBe(true);
    expect(repository.recommendations.every((item) => item.implementation_guidance.advisory_only && item.implementation_guidance.operator_approval_required)).toBe(true);
    expect(repository.failures).toEqual([]);
  });

  it("keeps runtime recommendations mapped to canonical domains", () => {
    const repository = generateImprovementRecommendations();
    const domains = repository.recommendations.flatMap((item) => item.affected_domains);

    expect(repository.readiness.history.domain_improvements).toHaveLength(10);
    expect(domains).toContain("RESILIENCE");
    expect(domains).not.toContain("RUNTIME_ASSURANCE");
    expect(repository.report.category_summary).toEqual(expect.arrayContaining(["RESILIENCE:1", "CERTIFICATION:1", "GOVERNANCE:1", "REPLAY:1"]));
  });

  it("keeps recommendations deterministic and exposes slices", () => {
    const first = generateImprovementRecommendations();
    const second = generateImprovementRecommendations();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.report.integrity_hash).toBe(first.report.integrity_hash);
    expect(listRecommendationRules()).toHaveLength(6);
    expect(listRecommendationEvidenceChains()).toHaveLength(7);
    expect(listRecommendationGuidance()).toHaveLength(7);
    expect(listRecommendationLedger()).toHaveLength(7);
  });

  it.each([
    ["NONDETERMINISTIC_RECOMMENDATIONS", "RECOMMENDATIONS_NONDETERMINISTIC"],
    ["NONDETERMINISTIC_PRIORITIES", "RECOMMENDATION_PRIORITIES_NONDETERMINISTIC"],
    ["INCOMPLETE_SUPPORTING_EVIDENCE", "SUPPORTING_EVIDENCE_INCOMPLETE"],
    ["INCONSISTENT_IMPLEMENTATION_GUIDANCE", "IMPLEMENTATION_GUIDANCE_INCONSISTENT"],
    ["GOVERNANCE_VALIDATION_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_RECOMMENDATION_LOGIC", "HIDDEN_RECOMMENDATION_LOGIC_DETECTED"],
    ["AUTOMATIC_IMPLEMENTATION_ATTEMPT", "AUTOMATIC_IMPLEMENTATION_ATTEMPTED"],
    ["RUNTIME_BEHAVIOR_MODIFICATION", "RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED"],
    ["OPERATOR_APPROVAL_BYPASS", "OPERATOR_APPROVAL_BYPASSED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
  ] satisfies [ImprovementRecommendationScenario, ImprovementRecommendationFailure][])("invalidates %s", (scenario, failure) => {
    const repository = generateImprovementRecommendations({ scenario });
    const validation = validateImprovementRecommendations(repository);

    expect(repository.final_state).toBe("IMPROVEMENT_RECOMMENDATIONS_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.automatic_implementation_authorized).toBe(false);
    expect(repository.runtime_behavior_modification_authorized).toBe(false);
    expect(repository.implementation_approval_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "NONDETERMINISTIC_RECOMMENDATIONS" })).recommendations_deterministic).toBe(false);
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "NONDETERMINISTIC_PRIORITIES" })).priorities_deterministic).toBe(false);
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "INCOMPLETE_SUPPORTING_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "INCONSISTENT_IMPLEMENTATION_GUIDANCE" })).guidance_consistent).toBe(false);
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "GOVERNANCE_VALIDATION_FAILURE" })).governance_validated).toBe(false);
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "CONSTITUTIONAL_VALIDATION_FAILURE" })).constitutional_validated).toBe(false);
    expect(validateImprovementRecommendations(generateImprovementRecommendations({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without implementation authority", () => {
    const surface = buildImprovementRecommendationObservabilitySurface(generateImprovementRecommendations({ scenario: "INCOMPLETE_SUPPORTING_EVIDENCE" }));

    expect(surface.final_state).toBe("IMPROVEMENT_RECOMMENDATIONS_FAILED");
    expect(surface.recommendation_count).toBe(7);
    expect(surface.rule_count).toBe(6);
    expect(surface.ledger_count).toBe(7);
    expect(surface.highest_priority).toBe("CRITICAL");
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.automatic_implementation_authorized).toBe(false);
    expect(surface.runtime_behavior_modification_authorized).toBe(false);
  });
});
