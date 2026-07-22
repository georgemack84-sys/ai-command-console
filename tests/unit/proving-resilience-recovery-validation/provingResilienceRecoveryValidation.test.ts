import { describe, expect, it } from "vitest";
import { getProvingResilienceRecoveryValidationBundle, replayProvingResilienceRecoveryValidation, runProvingResilienceRecoveryValidation, validateProvingResilienceRecoveryValidation } from "@/services/proving-resilience-recovery-validation";
import type { ResilienceFailure } from "@/types/proving-resilience-recovery-validation";

const FAILURE_MATRIX: readonly ResilienceFailure[] = [
  "P6_7_ADVERSARIAL_TESTING_INVALID",
  "RESILIENCE_FRAMEWORK_MISSING",
  "FAILURE_INJECTION_LIBRARY_MISSING",
  "FAILURE_INJECTION_NONDETERMINISTIC",
  "RECOVERY_VALIDATION_ENGINE_MISSING",
  "RECOVERY_WORKFLOW_FAILED",
  "DETERMINISTIC_RESTORATION_FAILED",
  "STATE_PRESERVATION_FAILED",
  "CONSISTENCY_VALIDATION_FAILED",
  "FAILOVER_VALIDATION_MISSING",
  "FAILOVER_EXECUTION_FAILED",
  "DISASTER_RECOVERY_VALIDATION_MISSING",
  "ENVIRONMENT_RESTORATION_FAILED",
  "BACKUP_RESTORATION_FAILED",
  "TRUST_RESTORATION_FAILED",
  "DEGRADATION_TESTING_MISSING",
  "GRACEFUL_DEGRADATION_FAILED",
  "POLICY_ENFORCEMENT_DURING_DEGRADATION_FAILED",
  "OPERATOR_VISIBILITY_FAILED",
  "RECOVERY_REPLAY_VALIDATION_MISSING",
  "RECOVERY_REPLAY_DIVERGED",
  "REPEATABLE_RECOVERY_FAILED",
  "RECOVERY_EVIDENCE_MISSING",
  "RECOVERY_EVIDENCE_MUTATED",
  "RECOVERY_LINEAGE_INCOMPLETE",
  "GOVERNANCE_PRESERVATION_FAILED",
  "TRUST_TRANSITION_NONCOMPLIANT",
  "FAIL_SAFE_BEHAVIOR_FAILED",
  "OPERATIONS_NOT_MAINTAINED",
  "RESILIENCE_OBJECTIVES_NOT_MET",
  "RECOVERY_CERTIFICATION_NOT_READY",
  "FUNCTIONAL_CORRECTNESS_OWNERSHIP_VIOLATION",
  "PRODUCTION_INCIDENT_RESPONSE_OWNERSHIP_VIOLATION",
  "TRUST_DECISION_OWNERSHIP_VIOLATION",
];

describe("P6.8 Resilience and Recovery Validation", () => {
  it("publishes resilience and recovery doctrine without owning functional correctness, production incident response, trust decisions, or runtime security monitoring", () => {
    const bundle = getProvingResilienceRecoveryValidationBundle();

    expect(bundle.doctrine.version).toBe("proving-resilience-recovery-validation/v6.8");
    expect(bundle.doctrine.owns_resilience_validation).toBe(true);
    expect(bundle.doctrine.owns_recovery_validation).toBe(true);
    expect(bundle.doctrine.owns_failover_testing).toBe(true);
    expect(bundle.doctrine.owns_disaster_recovery_validation).toBe(true);
    expect(bundle.doctrine.owns_degradation_testing).toBe(true);
    expect(bundle.doctrine.owns_recovery_replay_validation).toBe(true);
    expect(bundle.doctrine.owns_resilience_evidence).toBe(true);
    expect(bundle.doctrine.owns_functional_correctness).toBe(false);
    expect(bundle.doctrine.owns_production_incident_response).toBe(false);
    expect(bundle.doctrine.owns_trust_decisions).toBe(false);
    expect(bundle.doctrine.owns_runtime_security_monitoring).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic resilience validation with P6.7 adversarial testing dependency", () => {
    const first = runProvingResilienceRecoveryValidation();
    const second = runProvingResilienceRecoveryValidation();

    expect(first.phase_identifier).toBe("ProvingResilienceRecoveryValidation");
    expect(first.adversarial_testing_ref).toBe("proving-adversarial-testing-framework/v6.7");
    expect(first.framework.deterministic).toBe(true);
    expect(first.failure_injection.deterministic).toBe(true);
    expect(first.recovery_engine.workflows).toHaveLength(16);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingResilienceRecoveryValidation(first).valid).toBe(true);
    expect(replayProvingResilienceRecoveryValidation(first)).toBe(true);
  });

  it("validates recovery, failover, disaster recovery, graceful degradation, and recovery replay reports", () => {
    const result = runProvingResilienceRecoveryValidation();

    expect(result.recovery_engine.workflow_execution).toBe(true);
    expect(result.recovery_engine.deterministic_restoration).toBe(true);
    expect(result.recovery_engine.state_preservation).toBe(true);
    expect(result.recovery_engine.governance_preservation).toBe(true);
    expect(result.recovery_engine.trust_transition_compliance).toBe(true);
    expect(result.failover_report.active_active).toBe(true);
    expect(result.failover_report.quorum_failover).toBe(true);
    expect(result.failover_report.tenant_failover).toBe(true);
    expect(result.disaster_recovery_report.scenarios).toHaveLength(8);
    expect(result.disaster_recovery_report.environment_rebuild).toBe(true);
    expect(result.disaster_recovery_report.trust_restoration).toBe(true);
    expect(result.degradation_report.modes).toHaveLength(7);
    expect(result.degradation_report.operator_takeover).toBe(true);
    expect(result.degradation_report.policy_restriction).toBe(true);
    expect(result.degradation_report.graceful).toBe(true);
    expect(result.recovery_replay_report.identical_recovery_replay).toBe(true);
    expect(result.recovery_replay_report.repeatable_recovery).toBe(true);
    expect(result.recovery_replay_report.divergence_analyzed).toBe(true);
  });

  it("passes all P6.8 gates, invariants, evidence, boundaries, and readiness checks", () => {
    const result = runProvingResilienceRecoveryValidation();

    expect(result.gates.recovery_gate).toBe(true);
    expect(result.gates.resilience_gate).toBe(true);
    expect(result.gates.disaster_recovery_gate).toBe(true);
    expect(result.gates.degradation_gate).toBe(true);
    expect(result.gates.replay_gate).toBe(true);
    expect(result.gates.evidence_gate).toBe(true);
    expect(result.gates.phase_certification).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.invariants.deterministic_resilience_testing).toBe(true);
    expect(result.invariants.deterministic_recovery).toBe(true);
    expect(result.invariants.governance_maintained).toBe(true);
    expect(result.invariants.trust_preserved).toBe(true);
    expect(result.invariants.evidence_integrity).toBe(true);
    expect(result.invariants.fail_safe_when_unrecoverable).toBe(true);
    expect(result.invariants.recovery_replay_equivalence).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.traceable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.evidence.certification_ready).toBe(true);
    expect(result.boundaries.owns_functional_correctness).toBe(false);
    expect(result.boundaries.owns_production_incident_response).toBe(false);
    expect(result.boundaries.owns_trust_decisions).toBe(false);
    expect(result.boundaries.owns_runtime_security_monitoring).toBe(false);
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails resilience recovery readiness for %s", (failure) => {
    const result = runProvingResilienceRecoveryValidation({ scenario: failure });
    const validation = validateProvingResilienceRecoveryValidation(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks unrecoverable restoration failures as fail-safe when fail-safe behavior remains intact", () => {
    const result = runProvingResilienceRecoveryValidation({ scenario: "ENVIRONMENT_RESTORATION_FAILED" });

    expect(result.readiness.outcome).toBe("FAIL_SAFE");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.invariants.fail_safe_when_unrecoverable).toBe(true);
  });
});
