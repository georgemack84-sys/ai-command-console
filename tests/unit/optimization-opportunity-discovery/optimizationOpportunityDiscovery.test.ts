import { describe, expect, it } from "vitest";
import {
  buildOptimizationDiscoveryObservabilitySurface,
  discoverOptimizationOpportunities,
  getOptimizationOpportunityDiscovery,
  listDiscoveryEvidence,
  listPerformanceBaselines,
  validateOptimizationDiscovery,
} from "@/services/optimization-opportunity-discovery";
import type { OptimizationDiscoveryFailure, OptimizationDiscoveryScenario } from "@/types/optimization-opportunity-discovery";

describe("optimization opportunity discovery", () => {
  it("publishes the deterministic discovery bundle", () => {
    const bundle = getOptimizationOpportunityDiscovery();

    expect(bundle.doctrine.contract_version).toBe("optimization-opportunity-discovery/v8ALT.8.1");
    expect(bundle.doctrine.final_state).toBe("OPTIMIZATION_OPPORTUNITIES_DISCOVERED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.registry.final_state).toBe("OPTIMIZATION_OPPORTUNITIES_DISCOVERED");
    expect(bundle.registry.advisory_only).toBe(true);
    expect(bundle.registry.execution_authority).toBe(false);
    expect(bundle.registry.automatic_optimization).toBe(false);
  });

  it("builds reproducible baselines, opportunities, and evidence", () => {
    const registry = discoverOptimizationOpportunities();

    expect(registry.baselines.length).toBeGreaterThan(0);
    expect(registry.opportunities.length).toBe(registry.baselines.length);
    expect(registry.evidence.length).toBe(registry.opportunities.length);
    expect(registry.opportunities.every((opportunity) => opportunity.lifecycle_state === "READY_FOR_ANALYSIS")).toBe(true);
    expect(registry.opportunities.every((opportunity) => opportunity.integrity_hash)).toBe(true);
    expect(registry.evidence.every((evidence) => evidence.integrity_hash)).toBe(true);
  });

  it("keeps projected improvement separate from execution authority", () => {
    const registry = discoverOptimizationOpportunities();

    expect(registry.opportunities.some((opportunity) => opportunity.projected_improvement > 0)).toBe(true);
    expect(registry.opportunities.every((opportunity) => opportunity.advisory_only)).toBe(true);
    expect(registry.opportunities.every((opportunity) => !opportunity.execution_authority)).toBe(true);
    expect(registry.opportunities.every((opportunity) => !opportunity.automatic_optimization)).toBe(true);
  });

  it("lists baseline and evidence records through dedicated helpers", () => {
    expect(listPerformanceBaselines().length).toBeGreaterThan(0);
    expect(listDiscoveryEvidence().length).toBeGreaterThan(0);
  });

  it.each([
    ["METRIC_DRIFT", "METRIC_DRIFT_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_FIDELITY_LOST"],
    ["GOVERNANCE_VALIDATION_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_BOUNDARY_VIOLATION", "AUTHORITY_BOUNDARY_VIOLATED"],
    ["TENANT_LEAKAGE_ATTEMPT", "TENANT_ISOLATION_BROKEN"],
    ["HIDDEN_EVIDENCE", "OPTIMIZATION_EVIDENCE_HIDDEN"],
    ["MUTABLE_RECORD_ATTEMPT", "IMMUTABILITY_VIOLATED"],
    ["AUTOMATIC_OPTIMIZATION_ATTEMPT", "AUTOMATIC_OPTIMIZATION_ATTEMPTED"],
    ["LIFECYCLE_SKIP", "LIFECYCLE_ORDER_INVALID"],
    ["INCOMPLETE_BASELINE", "BASELINE_INCOMPLETE"],
  ] satisfies [OptimizationDiscoveryScenario, OptimizationDiscoveryFailure][])("fails closed for %s", (scenario, failure) => {
    const registry = discoverOptimizationOpportunities({ scenario });
    const validation = validateOptimizationDiscovery(registry);

    expect(registry.final_state).toBe("OPTIMIZATION_DISCOVERY_BLOCKED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.ready_for_impact_analysis).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(registry.execution_authority).toBe(false);
  });

  it("publishes observability without execution authority", () => {
    const surface = buildOptimizationDiscoveryObservabilitySurface();

    expect(surface.final_state).toBe("OPTIMIZATION_OPPORTUNITIES_DISCOVERED");
    expect(surface.opportunity_count).toBeGreaterThan(0);
    expect(surface.baseline_count).toBeGreaterThan(0);
    expect(surface.evidence_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.execution_authority).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
