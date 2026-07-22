import { describe, expect, it } from "vitest";
import {
  buildConstitutionalRecommendationObservabilitySurface,
  generateConstitutionalRecommendations,
  getConstitutionalRecommendationEngine,
  listConstitutionalRecommendationConfidence,
  listConstitutionalRecommendationExplanations,
  listConstitutionalRecommendationLedger,
  listConstitutionalRecommendations,
  listSuppressedConstitutionalRecommendations,
  validateConstitutionalRecommendationEngine,
} from "@/services/constitutional-recommendation-engine";
import type { ConstitutionalRecommendationFailure, ConstitutionalRecommendationScenario, ConstitutionalRecommendationType } from "@/types/constitutional-recommendation-engine";

const domains: readonly ConstitutionalRecommendationType[] = ["ADDITIONAL_MONITORING", "ADDITIONAL_EVIDENCE", "OPERATOR_REVIEW", "POLICY_REVIEW", "GOVERNANCE_REVIEW", "REPLAY_VALIDATION", "CONFIDENCE_RECALIBRATION", "OPTIMIZATION_REVIEW", "LEARNING_REVIEW"];

describe("constitutional recommendation engine", () => {
  it("publishes the deterministic advisory recommendation bundle", () => {
    const bundle = getConstitutionalRecommendationEngine();

    expect(bundle.doctrine.engine_version).toBe("constitutional-recommendation-engine/v8ALT.10.6");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_RECOMMENDATION_ENGINE_READY");
    expect(bundle.doctrine.recommendation_domains).toEqual(domains);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.execution_authorized).toBe(false);
    expect(bundle.repository.policy_modification_authorized).toBe(false);
    expect(bundle.repository.constitutional_modification_authorized).toBe(false);
    expect(bundle.repository.authority_grant_authorized).toBe(false);
    expect(bundle.repository.optimization_deployment_authorized).toBe(false);
    expect(bundle.repository.learning_activation_authorized).toBe(false);
  });

  it("generates all nine recommendation domains in baseline mode", () => {
    const repository = generateConstitutionalRecommendations();

    expect(repository.final_state).toBe("CONSTITUTIONAL_RECOMMENDATION_ENGINE_COMPLETE");
    expect(repository.recommendations.map((item) => item.recommendation_type)).toEqual(domains);
    expect(repository.suppressed_recommendations).toEqual([]);
    expect(repository.confidence_threshold).toBe(0.75);
    expect(repository.recommendations.every((item) => item.status === "PRESENTED")).toBe(true);
  });

  it("lists recommendations, confidence, explanations, suppressed records, and ledger", () => {
    expect(listConstitutionalRecommendations().length).toBe(domains.length);
    expect(listConstitutionalRecommendationConfidence().length).toBe(domains.length);
    expect(listConstitutionalRecommendationExplanations().length).toBe(domains.length);
    expect(listSuppressedConstitutionalRecommendations()).toEqual([]);
    expect(listConstitutionalRecommendationLedger().length).toBe(domains.length);
  });

  it("keeps recommendations deterministic and append-only", () => {
    const first = generateConstitutionalRecommendations();
    const second = generateConstitutionalRecommendations();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.recommendations.map((item) => item.recommendation_id)).toEqual(first.recommendations.map((item) => item.recommendation_id));
    expect(first.ledger.every((item) => item.immutable && item.append_only)).toBe(true);
  });

  it("suppresses low-confidence recommendations and records audit evidence", () => {
    const repository = generateConstitutionalRecommendations({ scenario: "LOW_CONFIDENCE_RECOMMENDATION" });
    const suppressed = repository.suppressed_recommendations[0];

    expect(suppressed.recommendation_type).toBe("ADDITIONAL_EVIDENCE");
    expect(suppressed.confidence_score).toBeLessThan(0.75);
    expect(repository.recommendations.length).toBe(domains.length - 1);
    expect(repository.audit_records.some((item) => item.reason === "BELOW_CONFIDENCE_THRESHOLD" && item.recommendation_id === suppressed.recommendation_id)).toBe(true);
    expect(validateConstitutionalRecommendationEngine(repository).valid).toBe(true);
  });

  it("provides complete explainability for every baseline recommendation", () => {
    const repository = generateConstitutionalRecommendations();

    expect(repository.explanations.every((item) => item.complete)).toBe(true);
    expect(repository.explanations.every((item) => item.deterministic && item.replayable)).toBe(true);
    expect(repository.explanations.every((item) => item.constitutional_rules_referenced.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.governance_rationale.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.authority_rationale.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.replay_references.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.confidence_calculation.includes("threshold"))).toBe(true);
  });

  it("keeps every recommendation incapable of autonomous action", () => {
    const repository = generateConstitutionalRecommendations({ scenario: "OPTIMIZATION_REVIEW" });
    const all = [...repository.recommendations, ...repository.suppressed_recommendations];

    expect(all.every((item) => item.advisory_only)).toBe(true);
    expect(all.every((item) => !item.execution_authorized)).toBe(true);
    expect(all.every((item) => !item.policy_modification_authorized)).toBe(true);
    expect(all.every((item) => !item.constitutional_modification_authorized)).toBe(true);
    expect(all.every((item) => !item.authority_grant_authorized)).toBe(true);
    expect(all.every((item) => !item.optimization_deployment_authorized)).toBe(true);
    expect(all.every((item) => !item.learning_activation_authorized)).toBe(true);
    expect(all.every((item) => !item.replay_mutation_authorized)).toBe(true);
    expect(all.every((item) => !item.confidence_algorithm_mutation_authorized)).toBe(true);
  });

  it.each([
    ["NONDETERMINISTIC_RECOMMENDATION", "NONDETERMINISTIC_RECOMMENDATION_DETECTED"],
    ["INCOMPLETE_RECOMMENDATION_EVIDENCE", "RECOMMENDATION_EVIDENCE_INCOMPLETE"],
    ["MISSING_RECOMMENDATION_GOVERNANCE", "RECOMMENDATION_GOVERNANCE_REFERENCE_MISSING"],
    ["AUTHORITY_VALIDATION_FAILED", "RECOMMENDATION_AUTHORITY_VALIDATION_FAILED"],
    ["UNVERIFIABLE_REPLAY_REFERENCE", "RECOMMENDATION_REPLAY_REFERENCE_UNVERIFIABLE"],
    ["CONFIDENCE_CALCULATION_UNAVAILABLE", "RECOMMENDATION_CONFIDENCE_UNAVAILABLE"],
    ["INCOMPLETE_RECOMMENDATION_EXPLAINABILITY", "RECOMMENDATION_EXPLAINABILITY_INCOMPLETE"],
    ["AUTONOMOUS_EXECUTION_IMPLIED", "RECOMMENDATION_AUTONOMOUS_EXECUTION_IMPLIED"],
    ["CONSTITUTIONAL_BEHAVIOR_MODIFICATION", "RECOMMENDATION_CONSTITUTIONAL_BEHAVIOR_MODIFICATION"],
    ["RECOMMENDATION_LINEAGE_BROKEN", "RECOMMENDATION_LINEAGE_BROKEN"],
    ["RECOMMENDATION_INTEGRITY_FAILURE", "RECOMMENDATION_INTEGRITY_FAILURE"],
    ["RECOMMENDATION_TENANT_ISOLATION_COMPROMISED", "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED"],
  ] satisfies [ConstitutionalRecommendationScenario, ConstitutionalRecommendationFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = generateConstitutionalRecommendations({ scenario });
    const validation = validateConstitutionalRecommendationEngine(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_RECOMMENDATION_ENGINE_FAIL_CLOSED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed_ready).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.audit_records.some((item) => item.reason === failure)).toBe(true);
    expect(repository.execution_authorized).toBe(false);
    expect(repository.constitutional_modification_authorized).toBe(false);
  });

  it("validates failure-specific controls", () => {
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "NONDETERMINISTIC_RECOMMENDATION" })).deterministic_recommendations).toBe(false);
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "INCOMPLETE_RECOMMENDATION_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "MISSING_RECOMMENDATION_GOVERNANCE" })).governance_references_complete).toBe(false);
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "AUTHORITY_VALIDATION_FAILED" })).authority_validated).toBe(false);
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "UNVERIFIABLE_REPLAY_REFERENCE" })).replay_verified).toBe(false);
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "CONFIDENCE_CALCULATION_UNAVAILABLE" })).confidence_calculated).toBe(false);
    expect(validateConstitutionalRecommendationEngine(generateConstitutionalRecommendations({ scenario: "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED" })).tenant_isolated).toBe(false);
  });

  it("publishes an observability surface for governance dashboards", () => {
    const surface = buildConstitutionalRecommendationObservabilitySurface(generateConstitutionalRecommendations({ scenario: "LOW_CONFIDENCE_RECOMMENDATION" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_RECOMMENDATION_ENGINE_COMPLETE");
    expect(surface.recommendation_count).toBe(domains.length - 1);
    expect(surface.suppressed_count).toBe(1);
    expect(surface.confidence_count).toBe(domains.length);
    expect(surface.explanation_count).toBe(domains.length);
    expect(surface.ledger_count).toBe(domains.length);
    expect(surface.advisory_only).toBe(true);
    expect(surface.execution_authorized).toBe(false);
    expect(surface.constitutional_modification_authorized).toBe(false);
  });
});
