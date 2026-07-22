import { beforeAll, describe, expect, it } from "vitest";
import {
  buildOptimizationRecommendationObservabilitySurface,
  listOptimizationExplainabilityReports,
  listOptimizationImplementationPlans,
  listOptimizationRollbackStrategies,
  listOptimizationScores,
  runOptimizationRecommendationEngine,
  validateOptimizationRecommendationEngine,
} from "@/services/optimization-recommendation-engine";
import { runDeterministicOptimizationValidation } from "@/services/deterministic-optimization-validation";
import type { DeterministicOptimizationValidationLedger } from "@/types/deterministic-optimization-validation";
import type { OptimizationRecommendationFailure, OptimizationRecommendationScenario } from "@/types/optimization-recommendation-engine";

describe("optimization recommendation engine", () => {
  let validValidation: DeterministicOptimizationValidationLedger;

  beforeAll(() => {
    validValidation = runDeterministicOptimizationValidation();
  });

  it("publishes operator-review-ready recommendation bundle", () => {
    const ledger = runOptimizationRecommendationEngine({ validation_ledger: validValidation });
    const validation = validateOptimizationRecommendationEngine(ledger, validValidation);

    expect(validation.valid).toBe(true);
    expect(ledger.final_state).toBe("OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW");
    expect(ledger.implementation_authority).toBe(false);
    expect(ledger.approval_authority).toBe(false);
    expect(ledger.automatic_implementation).toBe(false);
    expect(ledger.operator_approval_required).toBe(true);
  });

  it("generates complete recommendation artifacts for every validated opportunity", () => {
    const ledger = runOptimizationRecommendationEngine({ validation_ledger: validValidation });

    expect(ledger.recommendations.length).toBe(validValidation.validations.length);
    expect(ledger.scores.length).toBe(validValidation.validations.length);
    expect(ledger.explainability_reports.length).toBe(validValidation.validations.length);
    expect(ledger.implementation_plans.length).toBe(validValidation.validations.length);
    expect(ledger.rollback_strategies.length).toBe(validValidation.validations.length);
    expect(ledger.ledger_entries.length).toBe(validValidation.validations.length);
    expect(ledger.recommendations.every((r) => r.recommendation_status === "OPERATOR_REVIEW")).toBe(true);
  });

  it("keeps implementation guidance separate from implementation authority", () => {
    const ledger = runOptimizationRecommendationEngine({ validation_ledger: validValidation });

    expect(ledger.recommendations.every((r) => r.operator_required)).toBe(true);
    expect(ledger.recommendations.every((r) => !r.implementation_authority)).toBe(true);
    expect(ledger.recommendations.every((r) => !r.approval_authority)).toBe(true);
    expect(ledger.recommendations.every((r) => !r.automatic_implementation)).toBe(true);
    expect(ledger.implementation_plans.every((p) => !p.implementation_action_executed)).toBe(true);
    expect(ledger.ledger_entries.every((e) => e.approval_status === "PENDING_OPERATOR_REVIEW")).toBe(true);
  });

  it("lists scoring, explainability, implementation, and rollback surfaces", () => {
    const input = { validation_ledger: validValidation };
    expect(listOptimizationScores(input).length).toBeGreaterThan(0);
    expect(listOptimizationExplainabilityReports(input).length).toBeGreaterThan(0);
    expect(listOptimizationImplementationPlans(input).length).toBeGreaterThan(0);
    expect(listOptimizationRollbackStrategies(input).length).toBeGreaterThan(0);
  });

  it.each([
    ["MISSING_VALIDATION_LEDGER", "VALIDATION_LEDGER_MISSING"],
    ["VALIDATION_LEDGER_REJECTED", "VALIDATION_LEDGER_REJECTED"],
    ["UNVALIDATED_OPPORTUNITY", "UNVALIDATED_OPPORTUNITY_DETECTED"],
    ["HIDDEN_RECOMMENDATION", "HIDDEN_RECOMMENDATION_DETECTED"],
    ["SCORE_MANIPULATION", "SCORE_MANIPULATION_DETECTED"],
    ["MISSING_EXPLAINABILITY", "EXPLAINABILITY_MISSING"],
    ["MISSING_IMPLEMENTATION_PLAN", "IMPLEMENTATION_PLAN_MISSING"],
    ["MISSING_ROLLBACK_STRATEGY", "ROLLBACK_STRATEGY_MISSING"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED"],
    ["TENANT_LEAKAGE", "TENANT_LEAKAGE_DETECTED"],
    ["AUTOMATIC_IMPLEMENTATION_ATTEMPT", "AUTOMATIC_IMPLEMENTATION_ATTEMPTED"],
    ["APPROVAL_BYPASS_ATTEMPT", "APPROVAL_BYPASS_ATTEMPTED"],
    ["MUTABLE_LEDGER_HISTORY", "MUTABLE_LEDGER_HISTORY_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [OptimizationRecommendationScenario, OptimizationRecommendationFailure][])("fails closed for %s", (scenario, failure) => {
    const validation = scenario === "MISSING_VALIDATION_LEDGER" ? null : validValidation;
    const ledger = runOptimizationRecommendationEngine({ scenario, validation_ledger: validation });
    const result = validateOptimizationRecommendationEngine(ledger, validation);

    expect(ledger.final_state).toBe("OPTIMIZATION_RECOMMENDATIONS_BLOCKED");
    expect(result.valid).toBe(false);
    expect(result.fail_closed).toBe(true);
    expect(result.ready_for_certification_gate).toBe(false);
    expect(result.failures).toContain(failure);
    expect(ledger.implementation_authority).toBe(false);
  });

  it("publishes recommendation observability without authority", () => {
    const surface = buildOptimizationRecommendationObservabilitySurface(runOptimizationRecommendationEngine({ validation_ledger: validValidation }));

    expect(surface.final_state).toBe("OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW");
    expect(surface.recommendation_count).toBeGreaterThan(0);
    expect(surface.recommend_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBe(0);
    expect(surface.implementation_authority).toBe(false);
    expect(surface.approval_authority).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
