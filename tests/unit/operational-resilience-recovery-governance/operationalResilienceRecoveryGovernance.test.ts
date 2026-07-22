import { describe, expect, it } from "vitest";
import {
  getOperationalResilienceRecoveryGovernanceBundle,
  replayOperationalResilienceRecoveryGovernance,
  runOperationalResilienceRecoveryGovernance,
  validateOperationalResilienceRecoveryGovernance,
} from "@/services/operational-resilience-recovery-governance";
import type { OperationalResilienceRecoveryGovernanceFailure } from "@/types/operational-resilience-recovery-governance";

describe("Mission Control Phase 17.11 Operational Resilience & Recovery Governance", () => {
  it("publishes operational resilience recovery governance doctrine", () => {
    const bundle = getOperationalResilienceRecoveryGovernanceBundle();

    expect(bundle.doctrine.version).toBe("operational-resilience-recovery-governance/v17.11");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-multi-tenant-certification/v17.10");
    expect(bundle.doctrine.lifecycle_states).toContain("POST_RECOVERY_VALIDATION");
    expect(bundle.doctrine.recovery_categories).toHaveLength(11);
    expect(bundle.validation.valid).toBe(true);
  });

  it("records deterministic recovery state", () => {
    const result = runOperationalResilienceRecoveryGovernance({ recovery_category: "REPLAY_SUBSYSTEM_FAILURE", severity: "CRITICAL" });

    expect(result.recovery_state.recovery_category).toBe("REPLAY_SUBSYSTEM_FAILURE");
    expect(result.recovery_state.severity).toBe("CRITICAL");
    expect(result.recovery_state.containment_status).toBe("CONTAINED");
    expect(result.recovery_state.execution_result).toBe("RECOVERED");
  });

  it("enforces containment before recovery and recovery before requalification", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.orchestrator.containment_precedes_recovery).toBe(true);
    expect(result.recovery_coordinator.recovery_started_after_containment).toBe(true);
    expect(result.orchestrator.recovery_precedes_requalification).toBe(true);
    expect(result.post_recovery_qualification.requalification_after_recovery).toBe(true);
  });

  it("validates containment before authorization", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.containment_engine.containment_validated).toBe(true);
    expect(result.authorization_service.containment_complete).toBe(true);
    expect(result.authorization_service.outcome).toBe("APPROVED");
  });

  it("plans dependency-aware deterministic recovery", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.dependency_planner.deterministic_recovery_order).toBe(true);
    expect(result.recovery_coordinator.strategies).toHaveLength(10);
    expect(result.recovery_coordinator.dependency_aware_recovery).toBe(true);
  });

  it("validates recovery and post-recovery qualification", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.recovery_validator.validation_successful).toBe(true);
    expect(result.post_recovery_qualification.production_readiness).toBe(true);
    expect(result.post_recovery_qualification.requalification_validated).toBe(true);
  });

  it("preserves replay and immutable evidence", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.replay_validator.identical_outcomes).toBe(true);
    expect(result.evidence_service.immutable).toBe(true);
    expect(result.incident_ledger).toHaveLength(11);
    expect(result.incident_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
  });

  it("publishes operational resilience dashboard", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.dashboard.active_incidents_visible).toBe(true);
    expect(result.dashboard.requalification_status_visible).toBe(true);
    expect(result.dashboard.replayable).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runOperationalResilienceRecoveryGovernance();
    const second = runOperationalResilienceRecoveryGovernance();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationalResilienceRecoveryGovernance(first).valid).toBe(true);
    expect(replayOperationalResilienceRecoveryGovernance(first)).toBe(true);
  });

  it("executes the Phase 17.11 operational resilience exit criteria", () => {
    const result = runOperationalResilienceRecoveryGovernance();

    expect(result.certification_tests).toHaveLength(15);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional resilience warnings", () => {
    const result = runOperationalResilienceRecoveryGovernance({ scenario: "NON_CONSTITUTIONAL_RESILIENCE_WARNING" });
    const validation = validateOperationalResilienceRecoveryGovernance(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.operational_resilience_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("blocks recovery when containment is incomplete", () => {
    const result = runOperationalResilienceRecoveryGovernance({ scenario: "RECOVERY_STARTED_BEFORE_CONTAINMENT" });

    expect(result.outcome).toBe("FAIL");
    expect(result.containment_engine.containment_validated).toBe(false);
    expect(result.recovery_coordinator.recovery_started_after_containment).toBe(false);
  });

  it.each([
    "CONTAINMENT_NOT_DETERMINISTIC",
    "RECOVERY_NOT_DETERMINISTIC",
    "DEPENDENCY_AWARE_RECOVERY_NOT_VALIDATED",
    "CONTAINMENT_VALIDATION_INCOMPLETE",
    "POST_RECOVERY_VALIDATION_FAILED",
    "REQUALIFICATION_NOT_VALIDATED",
    "RESILIENCE_NOT_REPLAYABLE",
    "INCIDENT_AUDIT_INCOMPLETE",
    "RECOVERY_EVIDENCE_MUTABLE",
    "TENANT_ISOLATION_VIOLATED",
    "GOVERNANCE_NOT_MAINTAINED",
    "OPERATIONAL_RESILIENCE_NOT_CERTIFIED",
    "RECOVERY_STARTED_BEFORE_CONTAINMENT",
    "REQUALIFICATION_STARTED_DURING_RECOVERY",
    "UNAUTHORIZED_RECOVERY_APPROVED",
    "PHASE_17_10_CERTIFICATION_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: OperationalResilienceRecoveryGovernanceFailure) => {
    const result = runOperationalResilienceRecoveryGovernance({ scenario });
    const validation = validateOperationalResilienceRecoveryGovernance(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects recovery state tampering", () => {
    const result = runOperationalResilienceRecoveryGovernance();
    const tampered = {
      ...result,
      recovery_state: {
        ...result.recovery_state,
        execution_result: "BLOCKED" as const,
      },
    };

    expect(validateOperationalResilienceRecoveryGovernance(tampered).valid).toBe(false);
  });
});
