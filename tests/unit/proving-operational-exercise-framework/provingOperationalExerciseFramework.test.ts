import { describe, expect, it } from "vitest";
import { getProvingOperationalExerciseFrameworkBundle, replayProvingOperationalExerciseFramework, runProvingOperationalExerciseFramework, validateProvingOperationalExerciseFramework } from "@/services/proving-operational-exercise-framework";
import type { OperationalExerciseFailure } from "@/types/proving-operational-exercise-framework";

const FAILURE_MATRIX: readonly OperationalExerciseFailure[] = [
  "P6_10_INTEGRATION_VALIDATION_INVALID",
  "EXERCISE_ARCHITECTURE_MISSING",
  "EXERCISE_REGISTRY_MISSING",
  "EXERCISE_NOT_APPROVED",
  "TABLETOP_FRAMEWORK_MISSING",
  "MISSION_REHEARSAL_FRAMEWORK_MISSING",
  "OPERATOR_DRILL_FRAMEWORK_MISSING",
  "GOVERNANCE_EXERCISE_FRAMEWORK_MISSING",
  "EMERGENCY_SIMULATION_FRAMEWORK_MISSING",
  "EXECUTION_ENGINE_MISSING",
  "EXERCISE_EXECUTION_NONDETERMINISTIC",
  "PARTICIPANT_COORDINATION_FAILED",
  "ENVIRONMENT_PROVISIONING_FAILED",
  "EVENT_SYNCHRONIZATION_FAILED",
  "OPERATIONAL_EVALUATION_MISSING",
  "OBJECTIVE_COMPLETION_FAILED",
  "PROCEDURAL_COMPLIANCE_FAILED",
  "MISSION_SUCCESS_FAILED",
  "GOVERNANCE_CORRECTNESS_FAILED",
  "OPERATOR_EFFECTIVENESS_FAILED",
  "COORDINATION_QUALITY_FAILED",
  "READINESS_METRICS_MISSING",
  "READINESS_METRICS_NOT_REPRODUCIBLE",
  "EVIDENCE_COLLECTION_MISSING",
  "EXERCISE_EVIDENCE_MUTATED",
  "EXERCISE_LINEAGE_INCOMPLETE",
  "REPLAY_VALIDATION_FAILED",
  "REPORTING_FRAMEWORK_MISSING",
  "REPORT_GENERATION_FAILED",
  "IMPROVEMENT_RECOMMENDATIONS_MISSING",
  "SIMULATION_ENGINE_OWNERSHIP_VIOLATION",
  "REPLAY_VALIDATION_OWNERSHIP_VIOLATION",
  "ADVERSARIAL_TESTING_OWNERSHIP_VIOLATION",
  "RESILIENCE_VALIDATION_OWNERSHIP_VIOLATION",
  "PERFORMANCE_TESTING_OWNERSHIP_VIOLATION",
  "CROSS_PROGRAM_INTEGRATION_OWNERSHIP_VIOLATION",
  "PRODUCTION_OPERATIONS_OWNERSHIP_VIOLATION",
  "OPERATOR_CERTIFICATION_ATTEMPTED",
  "TRUST_EVALUATION_ATTEMPTED",
  "APPLICATION_GOVERNANCE_ATTEMPTED",
];

describe("P6.11 Operational Exercise Framework", () => {
  it("publishes operational exercise doctrine without owning simulation, replay, adversarial, resilience, performance, integration, production ops, certification, trust evaluation, or app governance", () => {
    const bundle = getProvingOperationalExerciseFrameworkBundle();

    expect(bundle.doctrine.version).toBe("proving-operational-exercise-framework/v6.11");
    expect(bundle.doctrine.owns_tabletop_exercises).toBe(true);
    expect(bundle.doctrine.owns_mission_rehearsals).toBe(true);
    expect(bundle.doctrine.owns_operator_drills).toBe(true);
    expect(bundle.doctrine.owns_governance_exercises).toBe(true);
    expect(bundle.doctrine.owns_emergency_simulations).toBe(true);
    expect(bundle.doctrine.owns_simulation_engine).toBe(false);
    expect(bundle.doctrine.owns_replay_validation).toBe(false);
    expect(bundle.doctrine.owns_adversarial_testing).toBe(false);
    expect(bundle.doctrine.owns_resilience_validation).toBe(false);
    expect(bundle.doctrine.owns_performance_testing).toBe(false);
    expect(bundle.doctrine.owns_cross_program_integration).toBe(false);
    expect(bundle.doctrine.owns_production_operations).toBe(false);
    expect(bundle.doctrine.owns_operator_certification).toBe(false);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.doctrine.owns_application_governance).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministically with approved exercise lifecycle and P6.10 integration dependency", () => {
    const first = runProvingOperationalExerciseFramework();
    const second = runProvingOperationalExerciseFramework();

    expect(first.phase_identifier).toBe("ProvingOperationalExerciseFramework");
    expect(first.integration_validation_ref).toBe("proving-cross-program-integration-validation/v6.10");
    expect(first.architecture.lifecycle).toHaveLength(9);
    expect(first.registry.approval_status).toBe("APPROVED");
    expect(first.registry.categories).toHaveLength(5);
    expect(first.execution.deterministic).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingOperationalExerciseFramework(first).valid).toBe(true);
    expect(replayProvingOperationalExerciseFramework(first)).toBe(true);
  });

  it("supports tabletop, mission rehearsal, operator drill, governance exercise, and emergency simulation outputs", () => {
    const result = runProvingOperationalExerciseFramework();

    expect(result.tabletop_report.supported).toBe(true);
    expect(result.mission_rehearsal_report.supported).toBe(true);
    expect(result.operator_drill_report.supported).toBe(true);
    expect(result.governance_exercise_report.supported).toBe(true);
    expect(result.emergency_simulation_report.supported).toBe(true);
    expect(result.execution.environments_provisioned).toBe(true);
    expect(result.execution.participants_assigned).toBe(true);
    expect(result.execution.events_synchronized).toBe(true);
    expect(result.evaluation.objective_completion).toBe(true);
    expect(result.evaluation.procedural_compliance).toBe(true);
    expect(result.evaluation.governance_correctness).toBe(true);
    expect(result.readiness_metrics.dimensions).toHaveLength(8);
    expect(result.readiness_metrics.reproducible).toBe(true);
  });

  it("passes evidence, reporting, gates, boundaries, and readiness checks", () => {
    const result = runProvingOperationalExerciseFramework();

    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.lineage_complete).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.evidence.timeline).toHaveLength(1);
    expect(result.reporting.generated).toBe(true);
    expect(result.reporting.exercise_reports).toHaveLength(5);
    expect(result.reporting.improvement_recommendations.length).toBeGreaterThan(0);
    expect(result.gates.architecture_gate).toBe(true);
    expect(result.gates.registry_gate).toBe(true);
    expect(result.gates.category_support_gate).toBe(true);
    expect(result.gates.execution_gate).toBe(true);
    expect(result.gates.evaluation_gate).toBe(true);
    expect(result.gates.metrics_gate).toBe(true);
    expect(result.gates.evidence_gate).toBe(true);
    expect(result.gates.reporting_gate).toBe(true);
    expect(result.gates.replay_gate).toBe(true);
    expect(result.gates.boundaries_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.boundaries.owns_simulation_engine).toBe(false);
    expect(result.boundaries.owns_replay_validation).toBe(false);
    expect(result.boundaries.owns_production_operations).toBe(false);
    expect(result.boundaries.owns_operator_certification).toBe(false);
    expect(result.boundaries.owns_trust_evaluation).toBe(false);
    expect(result.readiness.outcome).toBe("PASS");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails operational exercise readiness for %s", (failure) => {
    const result = runProvingOperationalExerciseFramework({ scenario: failure });
    const validation = validateProvingOperationalExerciseFramework(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance review required without operational exercise readiness", () => {
    const result = runProvingOperationalExerciseFramework({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
