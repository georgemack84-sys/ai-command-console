import { describe, expect, it } from "vitest";
import { getProvingReplayValidationFrameworkBundle, replayProvingReplayValidationFramework, runProvingReplayValidationFramework, validateProvingReplayValidationFramework } from "@/services/proving-replay-validation-framework";
import type { ReplayValidationFailure } from "@/types/proving-replay-validation-framework";

const FAILURE_MATRIX: readonly ReplayValidationFailure[] = [
  "P6_5_SIMULATION_INVALID",
  "REPLAY_EXECUTION_ENGINE_MISSING",
  "REPLAY_INPUT_RECONSTRUCTION_MISSING",
  "DETERMINISTIC_REPLAY_VALIDATION_FAILED",
  "REPLAY_COMPARISON_ENGINE_MISSING",
  "DIVERGENCE_DETECTION_MISSING",
  "DIVERGENCE_CLASSIFICATION_MISSING",
  "ROOT_CAUSE_ANALYSIS_MISSING",
  "REPLAY_EXPLAINABILITY_MISSING",
  "REPLAY_CERTIFICATION_MISSING",
  "REPLAY_EVIDENCE_REGISTRY_MISSING",
  "REPLAY_INPUTS_INCOMPLETE",
  "REPLAY_EVIDENCE_UNAVAILABLE",
  "REPLAY_NOT_EXECUTABLE",
  "REPLAY_OUTPUT_MISMATCH",
  "REPLAY_DECISION_MISMATCH",
  "REPLAY_ORDERING_MISMATCH",
  "REPLAY_TIMESTAMP_MISMATCH",
  "REPLAY_EVIDENCE_MISMATCH",
  "COMPARISON_INCOMPLETE",
  "EVIDENCE_MATCHING_INACCURATE",
  "DIVERGENCE_ROOT_CAUSE_UNKNOWN",
  "DIVERGENCE_SEVERITY_MISSING",
  "REPLAY_CERTIFIED_BEFORE_VALIDATION",
  "REPLAY_EVIDENCE_MUTATED",
  "REPLAY_LINEAGE_INCOMPLETE",
  "DOWNSTREAM_CONSUMPTION_NOT_READY",
  "PLATFORM_REPLAY_INFRASTRUCTURE_OWNERSHIP_VIOLATION",
  "BEHAVIORAL_REPLAY_OWNERSHIP_VIOLATION",
  "TRUST_EVALUATION_ATTEMPTED",
  "RUNTIME_EXECUTION_ATTEMPTED",
];

describe("P6.6 Replay Validation Framework", () => {
  it("publishes replay validation doctrine without owning execution, scenarios, synthetic generation, trust evaluation, behavioral replay, or platform replay", () => {
    const bundle = getProvingReplayValidationFrameworkBundle();

    expect(bundle.doctrine.version).toBe("proving-replay-validation-framework/v6.6");
    expect(bundle.doctrine.owns_replay_validation).toBe(true);
    expect(bundle.doctrine.owns_deterministic_replay).toBe(true);
    expect(bundle.doctrine.owns_replay_comparison).toBe(true);
    expect(bundle.doctrine.owns_divergence_analysis).toBe(true);
    expect(bundle.doctrine.owns_replay_certification).toBe(true);
    expect(bundle.doctrine.owns_runtime_execution).toBe(false);
    expect(bundle.doctrine.owns_scenario_definition).toBe(false);
    expect(bundle.doctrine.owns_synthetic_generation).toBe(false);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.doctrine.owns_behavioral_replay).toBe(false);
    expect(bundle.doctrine.owns_platform_replay_infrastructure).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("certifies deterministic replay with complete inputs, comparison, evidence registry, and lineage", () => {
    const first = runProvingReplayValidationFramework();
    const second = runProvingReplayValidationFramework();

    expect(first.phase_identifier).toBe("ProvingReplayValidationFramework");
    expect(first.simulation_ref).toBe("proving-simulation-framework/v6.5");
    expect(first.inputs.complete).toBe(true);
    expect(first.execution.executable).toBe(true);
    expect(first.deterministic_result.passed).toBe(true);
    expect(first.comparison.complete).toBe(true);
    expect(first.divergences[0]?.divergence_type).toBe("NONE");
    expect(first.certification.status).toBe("CERTIFIED");
    expect(first.certification.outcome).toBe("PASS");
    expect(first.evidence_registry.complete).toBe(true);
    expect(first.evidence_registry.immutable).toBe(true);
    expect(first.evidence_registry.downstream_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingReplayValidationFramework(first).valid).toBe(true);
    expect(replayProvingReplayValidationFramework(first)).toBe(true);
  });

  it("passes all P6.6 replay verification gates", () => {
    const result = runProvingReplayValidationFramework();

    expect(result.gates.replay_completeness).toBe(true);
    expect(result.gates.deterministic_validation).toBe(true);
    expect(result.gates.comparison_validation).toBe(true);
    expect(result.gates.divergence_validation).toBe(true);
    expect(result.gates.replay_certification).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.boundaries.owns_runtime_execution).toBe(false);
    expect(result.boundaries.owns_trust_evaluation).toBe(false);
    expect(result.boundaries.owns_behavioral_replay).toBe(false);
    expect(result.boundaries.owns_platform_replay_infrastructure).toBe(false);
  });

  it("supports conditionally certified replay when informational divergence is documented and explained", () => {
    const result = runProvingReplayValidationFramework({ scenario: "DOCUMENTED_INFORMATIONAL_DIVERGENCE" });

    expect(result.readiness.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification.status).toBe("CONDITIONALLY_CERTIFIED");
    expect(result.divergences[0]?.divergence_type).toBe("TIMING");
    expect(result.divergences[0]?.severity).toBe("INFORMATIONAL");
    expect(result.divergences[0]?.explained).toBe(true);
    expect(validateProvingReplayValidationFramework(result).valid).toBe(true);
  });

  it.each(FAILURE_MATRIX)("fails replay validation readiness for %s", (failure) => {
    const result = runProvingReplayValidationFramework({ scenario: failure });
    const validation = validateProvingReplayValidationFramework(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review-required without replay validation readiness", () => {
    const result = runProvingReplayValidationFramework({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_INVESTIGATION");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
