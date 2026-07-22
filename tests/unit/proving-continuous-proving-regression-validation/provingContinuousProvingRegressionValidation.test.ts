import { describe, expect, it } from "vitest";
import { getProvingContinuousProvingRegressionValidationBundle, replayProvingContinuousProvingRegressionValidation, runProvingContinuousProvingRegressionValidation, validateProvingContinuousProvingRegressionValidation } from "@/services/proving-continuous-proving-regression-validation";
import type { ContinuousFailure } from "@/types/proving-continuous-proving-regression-validation";

const FAILURE_MATRIX: readonly ContinuousFailure[] = [
  "P6_13_BENCHMARKING_INVALID",
  "CONTINUOUS_PROVING_ENGINE_MISSING",
  "VALIDATION_ORCHESTRATOR_MISSING",
  "TRIGGER_REGISTRY_MISSING",
  "CHANGE_IMPACT_ANALYZER_MISSING",
  "IMPACT_ANALYSIS_INCOMPLETE",
  "SCENARIO_SELECTION_FAILED",
  "ENVIRONMENT_PROVISIONING_FAILED",
  "CONTINUOUS_SIMULATION_FAILED",
  "CONTINUOUS_REPLAY_FAILED",
  "REGRESSION_VALIDATION_ENGINE_MISSING",
  "FUNCTIONAL_REGRESSION_DETECTED",
  "GOVERNANCE_REGRESSION_DETECTED",
  "TRUST_REGRESSION_DETECTED",
  "REPLAY_REGRESSION_DETECTED",
  "PERFORMANCE_REGRESSION_DETECTED",
  "SECURITY_REGRESSION_DETECTED",
  "INTEGRATION_REGRESSION_DETECTED",
  "CERTIFICATION_REGRESSION_DETECTED",
  "BENCHMARK_COMPARISON_FAILED",
  "EVIDENCE_COLLECTION_FAILED",
  "EVIDENCE_LINEAGE_INCOMPLETE",
  "CONTINUOUS_QUALIFICATION_ENGINE_MISSING",
  "QUALIFICATION_CONFIDENCE_DEGRADED",
  "VALIDATION_DECISION_MISSING",
  "OPERATOR_SUPREMACY_VIOLATED",
  "GOVERNANCE_SUPREMACY_VIOLATED",
  "CICD_INTEGRATION_MISSING",
  "RELEASE_VALIDATION_MISSING",
];

describe("P6.14 Continuous Proving and Regression Validation", () => {
  it("publishes continuous proving doctrine and validates the baseline continuously", () => {
    const bundle = getProvingContinuousProvingRegressionValidationBundle();

    expect(bundle.doctrine.version).toBe("proving-continuous-proving-regression-validation/v6.14");
    expect(bundle.doctrine.owns_continuous_proving).toBe(true);
    expect(bundle.doctrine.owns_regression_validation).toBe(true);
    expect(bundle.doctrine.owns_continuous_simulation).toBe(true);
    expect(bundle.doctrine.owns_change_impact_validation).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic continuous proving with P6.13 benchmarking dependency", () => {
    const first = runProvingContinuousProvingRegressionValidation();
    const second = runProvingContinuousProvingRegressionValidation();

    expect(first.phase_identifier).toBe("ProvingContinuousProvingRegressionValidation");
    expect(first.benchmarking_ref).toBe("proving-benchmarking-comparative-analysis/v6.13");
    expect(first.engine.deterministic).toBe(true);
    expect(first.triggers.triggers).toHaveLength(8);
    expect(first.regression_report.categories).toHaveLength(8);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingContinuousProvingRegressionValidation(first).valid).toBe(true);
    expect(replayProvingContinuousProvingRegressionValidation(first)).toBe(true);
  });

  it("produces impact, pipeline, evidence, qualification, decision, and dashboard artifacts", () => {
    const result = runProvingContinuousProvingRegressionValidation();

    expect(result.impact_report.complete).toBe(true);
    expect(result.pipeline.simulation_execution).toBe(true);
    expect(result.pipeline.replay_validation).toBe(true);
    expect(result.pipeline.regression_testing).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replay_compatible).toBe(true);
    expect(result.evidence.lineage_complete).toBe(true);
    expect(result.qualification.continuous_qualification_score).toBeGreaterThanOrEqual(90);
    expect(result.decision.outcome).toBe("PASS");
    expect(result.decision.operator_supremacy).toBe(true);
    expect(result.decision.governance_supremacy).toBe(true);
    expect(result.dashboard.validation_runs).toHaveLength(1);
  });

  it("passes all P6.14 gates and readiness checks", () => {
    const result = runProvingContinuousProvingRegressionValidation();

    expect(result.gates.trigger_gate).toBe(true);
    expect(result.gates.impact_gate).toBe(true);
    expect(result.gates.simulation_replay_gate).toBe(true);
    expect(result.gates.regression_gate).toBe(true);
    expect(result.gates.benchmark_gate).toBe(true);
    expect(result.gates.evidence_gate).toBe(true);
    expect(result.gates.qualification_gate).toBe(true);
    expect(result.gates.decision_gate).toBe(true);
    expect(result.gates.automation_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.readiness.outcome).toBe("PASS");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails continuous proving readiness for %s", (failure) => {
    const result = runProvingContinuousProvingRegressionValidation({ scenario: failure });
    const validation = validateProvingContinuousProvingRegressionValidation(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["VALIDATION_EVIDENCE_INCOMPLETE", "VALIDATION_EVIDENCE_STALE", "VALIDATION_EVIDENCE_CONFLICTING", "VALIDATION_EVIDENCE_UNVERIFIABLE", "FAIL_CLOSED_NOT_ENFORCED"] as const)("fails closed for %s", (failure) => {
    const result = runProvingContinuousProvingRegressionValidation({ scenario: failure });

    expect(result.readiness.outcome).toBe("FAIL_CLOSED");
    expect(result.decision.fail_closed).toBe(true);
    expect(result.decision.deployment_authorized).toBe(false);
    expect(validateProvingContinuousProvingRegressionValidation(result).valid).toBe(false);
  });

  it("supports pass with observations but keeps conditional follow-up out of full readiness", () => {
    const observed = runProvingContinuousProvingRegressionValidation({ scenario: "PASS_WITH_OBSERVATIONS" });
    const conditional = runProvingContinuousProvingRegressionValidation({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.outcome).toBe("PASS_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateProvingContinuousProvingRegressionValidation(observed).valid).toBe(true);
    expect(conditional.readiness.outcome).toBe("CONDITIONAL_PASS");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
