import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  buildContinuousOptimizationCertificationObservabilitySurface,
  getContinuousOptimizationCertificationDecision,
  getContinuousOptimizationCertificationGate,
  listContinuousOptimizationCertificationEvidence,
  listContinuousOptimizationCertificationTests,
  runContinuousOptimizationCertification,
  validateContinuousOptimizationCertification,
} from "@/services/continuous-optimization-certification-gate";
import { discoverOptimizationOpportunities } from "@/services/optimization-opportunity-discovery";
import { runOptimizationImpactAnalysis } from "@/services/optimization-impact-analysis";
import { runDeterministicOptimizationValidation } from "@/services/deterministic-optimization-validation";
import { runOptimizationRecommendationEngine } from "@/services/optimization-recommendation-engine";
import * as discoveryModule from "@/services/optimization-opportunity-discovery";
import * as impactModule from "@/services/optimization-impact-analysis";
import * as deterministicModule from "@/services/deterministic-optimization-validation";
import * as recommendationModule from "@/services/optimization-recommendation-engine";
import type { DeterministicOptimizationValidationLedger } from "@/types/deterministic-optimization-validation";
import type { OptimizationImpactAnalysisLedger } from "@/types/optimization-impact-analysis";
import type { OptimizationOpportunityRegistry } from "@/types/optimization-opportunity-discovery";
import type { OptimizationRecommendationLedger } from "@/types/optimization-recommendation-engine";
import type { ContinuousOptimizationCertificationFailure, ContinuousOptimizationCertificationScenario, ContinuousOptimizationUpstreamLedgerState } from "@/types/continuous-optimization-certification-gate";

describe("continuous optimization certification gate", () => {
  let discovery: OptimizationOpportunityRegistry;
  let impact: OptimizationImpactAnalysisLedger;
  let deterministic: DeterministicOptimizationValidationLedger;
  let recommendation: OptimizationRecommendationLedger;

  beforeAll(() => {
    discovery = discoverOptimizationOpportunities();
    impact = runOptimizationImpactAnalysis({ registry: discovery });
    deterministic = runDeterministicOptimizationValidation({ impact_ledger: impact });
    recommendation = runOptimizationRecommendationEngine({ validation_ledger: deterministic });
  });

  function certify(scenario: ContinuousOptimizationCertificationScenario = "BASELINE") {
    return runContinuousOptimizationCertification({ scenario, discovery_registry: discovery, impact_ledger: impact, validation_ledger: deterministic, recommendation_ledger: recommendation });
  }

  function upstream(state: ContinuousOptimizationUpstreamLedgerState["state"] = "PASS", overrides: Partial<ContinuousOptimizationUpstreamLedgerState> = {}): readonly ContinuousOptimizationUpstreamLedgerState[] {
    return [
      { ledger_id: "discovery-ledger", phase_id: "OPTIMIZATION_DISCOVERY", state, failures: [], integrity_verified: true, replay_verified: true, governance_verified: true, ...overrides },
      { ledger_id: "impact-ledger", phase_id: "OPTIMIZATION_IMPACT_ANALYSIS", state: "PASS", failures: [], integrity_verified: true, replay_verified: true, governance_verified: true },
      { ledger_id: "validation-ledger", phase_id: "DETERMINISTIC_OPTIMIZATION_VALIDATION", state: "PASS", failures: [], integrity_verified: true, replay_verified: true, governance_verified: true },
      { ledger_id: "recommendation-ledger", phase_id: "OPTIMIZATION_RECOMMENDATION_ENGINE", state: "PASS", failures: [], integrity_verified: true, replay_verified: true, governance_verified: true },
    ];
  }

  it("publishes the continuous optimization certification bundle", () => {
    const ledger = certify();
    const validation = validateContinuousOptimizationCertification(ledger);

    expect(getContinuousOptimizationCertificationGate().doctrine.contract_version).toBe("continuous-optimization-certification-gate/v8ALT.8.5");
    expect(ledger.certification.certification_status).toBe("PASS");
    expect(validation.valid).toBe(true);
    expect(ledger.completion_gate_ready).toBe(true);
    expect(ledger.deployment_authorized).toBe(false);
    expect(ledger.optimization_execution_authorized).toBe(false);
  });

  it("publishes certification tests, evidence, and decision records", () => {
    const input = { discovery_registry: discovery, impact_ledger: impact, validation_ledger: deterministic, recommendation_ledger: recommendation };

    expect(listContinuousOptimizationCertificationTests(input).length).toBeGreaterThan(0);
    expect(listContinuousOptimizationCertificationEvidence(input).length).toBeGreaterThan(0);
    expect(getContinuousOptimizationCertificationDecision(input).decision_state).toBe("PASS");
  });

  it("uses supplied upstream ledger states without rebuilding upstream arcs", () => {
    const discoverySpy = vi.spyOn(discoveryModule, "discoverOptimizationOpportunities");
    const impactSpy = vi.spyOn(impactModule, "runOptimizationImpactAnalysis");
    const deterministicSpy = vi.spyOn(deterministicModule, "runDeterministicOptimizationValidation");
    const recommendationSpy = vi.spyOn(recommendationModule, "runOptimizationRecommendationEngine");

    const ledger = runContinuousOptimizationCertification({ upstream_ledgers: upstream() });

    expect(ledger.certification.certification_status).toBe("PASS");
    expect(discoverySpy).not.toHaveBeenCalled();
    expect(impactSpy).not.toHaveBeenCalled();
    expect(deterministicSpy).not.toHaveBeenCalled();
    expect(recommendationSpy).not.toHaveBeenCalled();
  });

  it.each([
    ["MISSING", "UPSTREAM_LEDGER_MISSING"],
    ["UNKNOWN", "UPSTREAM_LEDGER_UNKNOWN"],
    ["FAIL", "RECOMMENDATION_EVIDENCE_INCOMPLETE"],
  ] satisfies [ContinuousOptimizationUpstreamLedgerState["state"], ContinuousOptimizationCertificationFailure][])("fails closed for upstream state %s", (state, failure) => {
    const ledger = runContinuousOptimizationCertification({ upstream_ledgers: upstream(state) });
    const validation = validateContinuousOptimizationCertification(ledger);

    expect(ledger.certification.certification_status).toBe("FAIL");
    expect(validation.failures).toContain(failure);
    expect(validation.fail_closed).toBe(true);
  });

  it.each([
    [{ integrity_verified: false }, "UPSTREAM_INTEGRITY_UNVERIFIED"],
    [{ replay_verified: false }, "UPSTREAM_REPLAY_UNVERIFIED"],
    [{ governance_verified: false }, "UPSTREAM_GOVERNANCE_UNVERIFIED"],
  ] satisfies [Partial<ContinuousOptimizationUpstreamLedgerState>, ContinuousOptimizationCertificationFailure][])("fails closed for upstream verification failure", (override, failure) => {
    const ledger = runContinuousOptimizationCertification({ upstream_ledgers: upstream("PASS", override) });

    expect(ledger.certification.certification_status).toBe("FAIL");
    expect(validateContinuousOptimizationCertification(ledger).failures).toContain(failure);
  });

  it("preserves conditional upstream certification without promoting it to full pass", () => {
    const ledger = runContinuousOptimizationCertification({ upstream_ledgers: upstream("CONDITIONAL_PASS") });
    const validation = validateContinuousOptimizationCertification(ledger);

    expect(ledger.certification.certification_status).toBe("CONDITIONAL_PASS");
    expect(ledger.completion_gate_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain("UPSTREAM_CONDITIONAL_CERTIFICATION");
  });

  it("allows explicit diagnostic revalidation of upstream inputs", () => {
    const discoverySpy = vi.spyOn(discoveryModule, "discoverOptimizationOpportunities").mockReturnValue(discovery);
    const impactSpy = vi.spyOn(impactModule, "runOptimizationImpactAnalysis").mockReturnValue(impact);
    const deterministicSpy = vi.spyOn(deterministicModule, "runDeterministicOptimizationValidation").mockReturnValue(deterministic);
    const recommendationSpy = vi.spyOn(recommendationModule, "runOptimizationRecommendationEngine").mockReturnValue(recommendation);

    const ledger = runContinuousOptimizationCertification({ upstream_ledgers: upstream(), options: { diagnostic_mode: true } });

    expect(ledger.certification.certification_status).toBe("PASS");
    expect(discoverySpy).toHaveBeenCalled();
    expect(impactSpy).toHaveBeenCalled();
    expect(deterministicSpy).toHaveBeenCalled();
    expect(recommendationSpy).toHaveBeenCalled();
  });

  it("keeps conditional pass blocked from completion gate readiness", () => {
    const ledger = certify("DOCUMENTATION_GAP");
    const validation = validateContinuousOptimizationCertification(ledger);

    expect(ledger.certification.certification_status).toBe("CONDITIONAL_PASS");
    expect(ledger.completion_gate_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
  });

  it.each([
    ["DISCOVERY_INVALID", "DISCOVERY_CERTIFICATION_FAILED"],
    ["IMPACT_ANALYSIS_INVALID", "IMPACT_ANALYSIS_CERTIFICATION_FAILED"],
    ["DETERMINISTIC_VALIDATION_INVALID", "DETERMINISTIC_VALIDATION_CERTIFICATION_FAILED"],
    ["RECOMMENDATIONS_INVALID", "RECOMMENDATION_CERTIFICATION_FAILED"],
    ["HIDDEN_OPTIMIZATION", "HIDDEN_OPTIMIZATION_DETECTED"],
    ["AUTOMATIC_DEPLOYMENT_DETECTED", "AUTOMATIC_DEPLOYMENT_DETECTED"],
    ["MISSION_OUTCOME_ALTERED", "MISSION_OUTCOME_ALTERED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["NONDETERMINISTIC_RECOMMENDATION", "NONDETERMINISTIC_RECOMMENDATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["CROSS_TENANT_OPTIMIZATION", "CROSS_TENANT_OPTIMIZATION_DETECTED"],
    ["INCOMPLETE_OPERATOR_VISIBILITY", "OPERATOR_VISIBILITY_INCOMPLETE"],
    ["MISSING_EXPLAINABILITY", "EXPLAINABILITY_MISSING"],
    ["MISSING_ROLLBACK_STRATEGY", "ROLLBACK_STRATEGY_MISSING"],
    ["RECOMMENDATION_EVIDENCE_INCOMPLETE", "RECOMMENDATION_EVIDENCE_INCOMPLETE"],
    ["INTEGRITY_HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] satisfies [ContinuousOptimizationCertificationScenario, ContinuousOptimizationCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = certify(scenario);
    const validation = validateContinuousOptimizationCertification(ledger);

    expect(ledger.certification.certification_status).toBe("FAIL");
    expect(ledger.final_state).toBe("CONTINUOUS_OPTIMIZATION_CERTIFICATION_BLOCKED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(ledger.deployment_authorized).toBe(false);
    expect(ledger.optimization_execution_authorized).toBe(false);
  });

  it("publishes certification observability without deployment authority", () => {
    const surface = buildContinuousOptimizationCertificationObservabilitySurface(certify());

    expect(surface.certification_status).toBe("PASS");
    expect(surface.tests_passed).toBeGreaterThan(0);
    expect(surface.tests_failed).toBe(0);
    expect(surface.deployment_authorized).toBe(false);
    expect(surface.optimization_execution_authorized).toBe(false);
    expect(surface.completion_gate_ready).toBe(true);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
