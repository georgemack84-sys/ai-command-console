import { describe, expect, it } from "vitest";
import {
  getContinuousOperationsFoundationBundle,
  replayContinuousOperationsFoundation,
  runContinuousOperationsFoundation,
  validateContinuousOperationsFoundation,
} from "@/services/continuous-operations-foundation";
import type { ContinuousOperationsFoundationFailure } from "@/types/continuous-operations-foundation";

describe("Mission Control Phase 18.1 Continuous Operations Foundation", () => {
  it("publishes continuous operations foundation doctrine", () => {
    const bundle = getContinuousOperationsFoundationBundle();

    expect(bundle.doctrine.version).toBe("continuous-operations-foundation/v18.1");
    expect(bundle.doctrine.upstream_phase).toBe("phase-17-certification-gate/v17.12");
    expect(bundle.doctrine.lifecycle_states).toContain("REQUALIFYING");
    expect(bundle.doctrine.standing_service_categories).toHaveLength(8);
    expect(bundle.validation.valid).toBe(true);
  });

  it("establishes immutable operational identity", () => {
    const result = runContinuousOperationsFoundation({ service_id: "ops-foundation" });

    expect(result.operational_identity.service_id).toBe("ops-foundation");
    expect(result.operational_identity.immutable).toBe(true);
    expect(result.operational_identity.certification_reference).toBeTruthy();
    expect(result.operational_identity.replay_reference).toBeTruthy();
  });

  it("maintains deterministic operational lifecycle and state", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.state_registry.lifecycle_state).toBe("ACTIVE");
    expect(result.state_registry.deterministic_transitions).toBe(true);
    expect(result.state_registry.governance_status).toBe("active");
    expect(result.state_registry.replay_status).toBe("replayable");
  });

  it("declares explicit constitutional operational authority", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.authority_registry.explicit_authority).toBe(true);
    expect(result.authority_registry.inferred_authority).toBe(false);
    expect(result.authority_registry.governance_authority).toBeTruthy();
    expect(result.authority_registry.recovery_authority).toBeTruthy();
  });

  it("registers standing constitutional services without execution", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.standing_service_registry.categories).toHaveLength(8);
    expect(result.standing_service_registry.service_refs).toHaveLength(8);
    expect(result.standing_service_registry.performs_execution).toBe(false);
    expect(result.standing_service_registry.fail_closed).toBe(true);
  });

  it("validates certification inheritance without authority expansion", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.certification_inheritance.certification_lineage_preserved).toBe(true);
    expect(result.certification_inheritance.expands_constitutional_authority).toBe(false);
    expect(result.certification_inheritance.validates_without_replacing_decisions).toBe(true);
  });

  it("publishes replay and audit contracts", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.replay_contract.identical_operational_outcomes).toBe(true);
    expect(result.replay_contract.replay_refs).toHaveLength(1);
    expect(result.audit_contract.append_only).toBe(true);
    expect(result.audit_contract.immutable).toBe(true);
  });

  it("keeps governance active during degraded operation, recovery, requalification, and suspension", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.governance_rules.active_during_degraded_operation).toBe(true);
    expect(result.governance_rules.active_during_recovery).toBe(true);
    expect(result.governance_rules.active_during_requalification).toBe(true);
    expect(result.governance_rules.active_during_suspension).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runContinuousOperationsFoundation();
    const second = runContinuousOperationsFoundation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousOperationsFoundation(first).valid).toBe(true);
    expect(replayContinuousOperationsFoundation(first)).toBe(true);
  });

  it("executes the Phase 18.1 continuous operations certification checks", () => {
    const result = runContinuousOperationsFoundation();

    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional operations warnings", () => {
    const result = runContinuousOperationsFoundation({ scenario: "NON_CONSTITUTIONAL_OPERATIONS_WARNING" });
    const validation = validateContinuousOperationsFoundation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.continuous_operations_foundation_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "LIFECYCLE_NOT_DETERMINISTIC",
    "GOVERNANCE_NOT_ENFORCED",
    "STANDING_SERVICES_NOT_DEFINED",
    "CERTIFICATION_INHERITANCE_NOT_VALIDATED",
    "OPERATIONAL_IDENTITY_MUTABLE",
    "REPLAY_REQUIREMENTS_INCOMPLETE",
    "OPERATIONAL_AUDIT_INCOMPLETE",
    "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED",
    "CONTINUOUS_OPERATIONS_FOUNDATION_NOT_CERTIFIED",
    "GOVERNANCE_PAUSES_DURING_RECOVERY",
    "IMPLICIT_AUTHORITY_PRESENT",
    "CERTIFICATION_INHERITANCE_EXPANDS_AUTHORITY",
    "PHASE_17_GATE_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: ContinuousOperationsFoundationFailure) => {
    const result = runContinuousOperationsFoundation({ scenario });
    const validation = validateContinuousOperationsFoundation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects operational identity tampering", () => {
    const result = runContinuousOperationsFoundation();
    const tampered = {
      ...result,
      operational_identity: {
        ...result.operational_identity,
        service_id: "shadow-service",
      },
    };

    expect(validateContinuousOperationsFoundation(tampered).valid).toBe(false);
  });
});
