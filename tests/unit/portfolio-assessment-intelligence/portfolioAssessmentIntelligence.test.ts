import { describe, expect, it } from "vitest";

import {
  getPortfolioAssessmentIntelligenceContract,
  replayPortfolioAssessmentIntelligence,
  runPortfolioAssessmentIntelligence,
  validatePortfolioAssessmentIntelligence,
} from "../../../services/portfolio-assessment-intelligence";
import type { PortfolioAssessmentScenario } from "../../../types/portfolio-assessment-intelligence";

describe("portfolio assessment intelligence", () => {
  it("creates deterministic certified portfolio assessments", () => {
    const first = runPortfolioAssessmentIntelligence();
    const second = runPortfolioAssessmentIntelligence();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validatePortfolioAssessmentIntelligence(first).valid).toBe(true);
    expect(replayPortfolioAssessmentIntelligence(first)).toBe(true);
  });

  it("publishes portfolio doctrine", () => {
    const bundle = getPortfolioAssessmentIntelligenceContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.immutable_membership_required).toBe(true);
    expect(bundle.doctrine.deterministic_dependency_analysis_required).toBe(true);
    expect(bundle.doctrine.scenario_evaluation_required).toBe(true);
    expect(bundle.doctrine.replay_required).toBe(true);
  });

  it("preserves immutable membership and fixed strategy versions", () => {
    const result = runPortfolioAssessmentIntelligence();

    expect(result.membership.immutable).toBe(true);
    expect(result.membership.duplicate_strategy_refs).toHaveLength(0);
    expect(result.membership.strategy_refs).toHaveLength(result.assessment.strategy_refs.length);
    expect(result.membership.strategy_versions.every((version) => version === "v1.0.0")).toBe(true);
  });

  it("evaluates dependencies, resources, risk, scenarios, and portfolio comparison", () => {
    const result = runPortfolioAssessmentIntelligence();

    expect(result.dependencies.reproducible).toBe(true);
    expect(result.resources.conflicts).toContain("operator attention contention");
    expect(result.resources.capacity_validated).toBe(true);
    expect(result.risk.reproducible).toBe(true);
    expect(result.scenarios.complete).toBe(true);
    expect(result.comparison.deterministic).toBe(true);
  });

  it("produces advisory output with replay, ledger, and observability", () => {
    const result = runPortfolioAssessmentIntelligence();

    expect(result.advisory.non_executable).toBe(true);
    expect(result.advisory.advisory_narrative).toContain("Recommend balanced portfolio");
    expect(result.replay.outcome).toBe("MATCH");
    expect(result.ledger.append_only).toBe(true);
    expect(result.observability.observable).toBe(true);
  });

  it("runs the phase 12.8 certification suite", () => {
    const result = runPortfolioAssessmentIntelligence();

    expect(result.certification.tests).toHaveLength(29);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for membership, dependency, resource, risk, scenario, comparison, advisory, replay, and governance violations", () => {
    const scenarios: readonly PortfolioAssessmentScenario[] = [
      "PORTFOLIO_IDENTITY_NONDETERMINISTIC",
      "LIFECYCLE_NONREPRODUCIBLE",
      "MEMBERSHIP_MUTABLE",
      "STRATEGY_VERSION_MISMATCH",
      "DUPLICATE_MEMBERSHIP",
      "DEPENDENCY_ANALYSIS_INCOMPLETE",
      "CIRCULAR_DEPENDENCY_UNRESOLVED",
      "RESOURCE_CONFLICT_UNDETECTED",
      "CAPACITY_VALIDATION_FAILED",
      "AGGREGATE_RISK_NONREPRODUCIBLE",
      "SYSTEMIC_RISK_MISSING",
      "SCENARIO_EVALUATION_INCOMPLETE",
      "SCENARIO_SENSITIVITY_NONREPRODUCIBLE",
      "PORTFOLIO_COMPARISON_NONDETERMINISTIC",
      "THRESHOLD_POLICY_NOT_APPLIED",
      "TIE_RESOLUTION_FAILED",
      "ADVISORY_OUTPUT_EXECUTABLE",
      "ADVISORY_RATIONALE_INCOMPLETE",
      "EVIDENCE_MISSING",
      "POLICY_MANIFEST_MISSING",
      "GOVERNANCE_FAILURE",
      "CONSTITUTIONAL_VIOLATION",
      "REPLAY_MISMATCH",
      "TENANT_ISOLATION_BREACH",
      "LEDGER_NOT_APPEND_ONLY",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runPortfolioAssessmentIntelligence({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.production_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validatePortfolioAssessmentIntelligence(result).valid).toBe(false);
    }
  });
});
