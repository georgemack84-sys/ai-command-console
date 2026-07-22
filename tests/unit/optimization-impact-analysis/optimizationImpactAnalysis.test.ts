import { describe, expect, it } from "vitest";
import {
  buildOptimizationImpactObservabilitySurface,
  getOptimizationImpactAnalysis,
  listBenefitEstimations,
  listConstraintPreservationRecords,
  listResourceImpactReports,
  listRiskAssessmentReports,
  runOptimizationImpactAnalysis,
  validateOptimizationImpactAnalysis,
} from "@/services/optimization-impact-analysis";
import { discoverOptimizationOpportunities } from "@/services/optimization-opportunity-discovery";
import type { OptimizationImpactFailure, OptimizationImpactScenario } from "@/types/optimization-impact-analysis";

describe("optimization impact analysis", () => {
  it("publishes the deterministic impact analysis bundle", () => {
    const bundle = getOptimizationImpactAnalysis();

    expect(bundle.doctrine.contract_version).toBe("optimization-impact-analysis/v8ALT.8.2");
    expect(bundle.doctrine.final_state).toBe("OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.ledger.final_state).toBe("OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE");
    expect(bundle.ledger.advisory_only).toBe(true);
    expect(bundle.ledger.execution_authority).toBe(false);
    expect(bundle.ledger.automatic_implementation).toBe(false);
    expect(bundle.ledger.recommendation_authority).toBe(false);
  });

  it("analyzes every discovered opportunity with complete reports", () => {
    const registry = discoverOptimizationOpportunities();
    const ledger = runOptimizationImpactAnalysis({ registry });

    expect(ledger.analyses.length).toBe(registry.opportunities.length);
    expect(ledger.benefits.length).toBe(registry.opportunities.length);
    expect(ledger.resources.length).toBe(registry.opportunities.length);
    expect(ledger.risks.length).toBe(registry.opportunities.length);
    expect(ledger.constraints.length).toBe(registry.opportunities.length);
    expect(ledger.analyses.every((analysis) => analysis.analysis_status === "COMPLETED")).toBe(true);
    expect(ledger.analyses.every((analysis) => analysis.decision_outcome === "ACCEPTABLE")).toBe(true);
  });

  it("keeps analysis readiness separate from implementation and recommendation authority", () => {
    const ledger = runOptimizationImpactAnalysis();

    expect(ledger.analyses.some((analysis) => analysis.projected_improvement > 0)).toBe(true);
    expect(ledger.analyses.every((analysis) => analysis.advisory_only)).toBe(true);
    expect(ledger.analyses.every((analysis) => !analysis.execution_authority)).toBe(true);
    expect(ledger.analyses.every((analysis) => !analysis.automatic_implementation)).toBe(true);
    expect(ledger.analyses.every((analysis) => !analysis.recommendation_authority)).toBe(true);
  });

  it("lists benefit, resource, risk, and constraint records", () => {
    expect(listBenefitEstimations().length).toBeGreaterThan(0);
    expect(listResourceImpactReports().length).toBeGreaterThan(0);
    expect(listRiskAssessmentReports().length).toBeGreaterThan(0);
    expect(listConstraintPreservationRecords().length).toBeGreaterThan(0);
  });

  it.each([
    ["MISSING_DISCOVERY_REGISTRY", "DISCOVERY_REGISTRY_MISSING"],
    ["OPPORTUNITY_NOT_READY", "OPPORTUNITY_NOT_READY_FOR_ANALYSIS"],
    ["BENEFIT_ESTIMATE_MISMATCH", "BENEFIT_ESTIMATE_MISMATCH_DETECTED"],
    ["RESOURCE_REGRESSION", "RESOURCE_REGRESSION_DETECTED"],
    ["HIGH_DETERMINISTIC_RISK", "DETERMINISTIC_RISK_HIGH"],
    ["REPLAY_RISK", "REPLAY_RISK_HIGH"],
    ["GOVERNANCE_RISK", "GOVERNANCE_RISK_HIGH"],
    ["CONSTITUTIONAL_RISK", "CONSTITUTIONAL_RISK_HIGH"],
    ["AUTHORITY_RISK", "AUTHORITY_RISK_HIGH"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILED"],
    ["VISIBILITY_FAILURE", "OPERATOR_VISIBILITY_FAILED"],
    ["LINEAGE_MUTATION", "LINEAGE_MUTATION_DETECTED"],
    ["AUTOMATIC_IMPLEMENTATION_ATTEMPT", "AUTOMATIC_IMPLEMENTATION_ATTEMPTED"],
    ["RECOMMENDATION_AUTHORITY_ATTEMPT", "RECOMMENDATION_AUTHORITY_ATTEMPTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [OptimizationImpactScenario, OptimizationImpactFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = runOptimizationImpactAnalysis({ scenario });
    const validation = validateOptimizationImpactAnalysis(ledger, scenario === "MISSING_DISCOVERY_REGISTRY" ? null : discoverOptimizationOpportunities(scenario === "OPPORTUNITY_NOT_READY" ? { scenario: "LIFECYCLE_SKIP" } : {}));

    expect(ledger.final_state).toBe("OPTIMIZATION_IMPACT_ANALYSIS_BLOCKED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.ready_for_deterministic_validation).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(ledger.execution_authority).toBe(false);
  });

  it("publishes impact observability without execution authority", () => {
    const surface = buildOptimizationImpactObservabilitySurface();

    expect(surface.final_state).toBe("OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE");
    expect(surface.analysis_count).toBeGreaterThan(0);
    expect(surface.acceptable_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBe(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.execution_authority).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
