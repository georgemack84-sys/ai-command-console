import { describe, expect, it } from "vitest";
import {
  getSyntheticEnvironmentArchitectureBundle,
  replaySyntheticEnvironmentArchitecture,
  runSyntheticEnvironmentArchitecture,
  validateSyntheticEnvironmentArchitecture,
} from "@/services/synthetic-environment-architecture";
import type { SyntheticEnvironmentFailure } from "@/types/synthetic-environment-architecture";

describe("Mission Control Phase 14.2 Synthetic Environment Architecture", () => {
  it("publishes the environment architecture doctrine", () => {
    const bundle = getSyntheticEnvironmentArchitectureBundle();

    expect(bundle.doctrine.version).toBe("synthetic-environment-architecture/v14.2");
    expect(bundle.doctrine.foundation_phase).toBe("synthetic-validation-foundation/v14.1");
    expect(bundle.doctrine.qualification_outcomes).toEqual(["QUALIFIED", "CONDITIONALLY_QUALIFIED", "DISQUALIFIED"]);
    expect(bundle.doctrine.environment_types).toEqual(["DEVELOPMENT", "VALIDATION", "REPLAY", "CERTIFICATION", "STRESS_TEST", "CHAOS_TEST", "ADVERSARIAL_TEST", "SCALE_TEST", "FAILURE_SIMULATION", "COMPLIANCE_TEST"]);
    expect(bundle.doctrine.constitutional_invariants).toEqual(["SIA-001", "SIA-002", "SIA-003", "SIA-004", "SIA-005", "SIA-006", "SIA-007", "SIA-008", "SIA-009", "SIA-010"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines deterministic environment identity and registry records", () => {
    const result = runSyntheticEnvironmentArchitecture({ tenant_scope: "tenant_alpha", environment_type: "ADVERSARIAL_TEST", owner: "owner_alpha" });

    expect(result.environment.environment_type).toBe("ADVERSARIAL_TEST");
    expect(result.environment.tenant_scope).toBe("tenant_alpha");
    expect(result.environment.created_by).toBe("owner_alpha");
    expect(result.registry).toHaveLength(1);
    expect(result.registry[0].environment_id).toBe(result.environment.environment_id);
    expect(result.environment.version_id).toBe(result.version_registry[0].version_id);
    expect(result.version_registry[0].immutable).toBe(true);
  });

  it("defines the immutable environment lifecycle", () => {
    const result = runSyntheticEnvironmentArchitecture();

    expect(result.lifecycle.states).toEqual(["DEFINED", "REGISTERED", "CONFIGURED", "QUALIFIED", "ACTIVE", "SUSPENDED", "RETIRED", "ARCHIVED"]);
    expect(result.lifecycle.transition_order).toEqual(result.lifecycle.states);
    expect(result.lifecycle.invalid_transitions_rejected).toBe(true);
    expect(result.lifecycle.lifecycle_replayable).toBe(true);
    expect(result.environment.lifecycle_state).toBe("ACTIVE");
  });

  it("qualifies environments before activation", () => {
    const result = runSyntheticEnvironmentArchitecture();

    expect(result.qualification.outcome).toBe("QUALIFIED");
    expect(result.qualification.configuration_complete).toBe(true);
    expect(result.qualification.dependencies_verified).toBe(true);
    expect(result.qualification.deterministic_configuration).toBe(true);
    expect(result.qualification.replay_ready).toBe(true);
    expect(result.qualification.security_verified).toBe(true);
    expect(result.qualification.governance_compliant).toBe(true);
    expect(result.qualification.tenant_isolation_verified).toBe(true);
    expect(result.governance.qualification_prior_to_activation).toBe(true);
  });

  it("enforces complete isolation boundaries", () => {
    const result = runSyntheticEnvironmentArchitecture();

    expect(result.isolation.tenant_isolation).toBe(true);
    expect(result.isolation.execution_isolation).toBe(true);
    expect(result.isolation.storage_isolation).toBe(true);
    expect(result.isolation.network_isolation).toBe(true);
    expect(result.isolation.credential_isolation).toBe(true);
    expect(result.isolation.artifact_isolation).toBe(true);
    expect(result.isolation.replay_isolation).toBe(true);
    expect(result.isolation.governance_isolation).toBe(true);
    expect(result.isolation.boundary_violations).toEqual([]);
  });

  it("is deterministic and replayable", () => {
    const first = runSyntheticEnvironmentArchitecture();
    const second = runSyntheticEnvironmentArchitecture();

    expect(first.outcome).toBe("APPROVED");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSyntheticEnvironmentArchitecture(first).valid).toBe(true);
    expect(replaySyntheticEnvironmentArchitecture(first)).toBe(true);
  });

  it("records immutable audit events", () => {
    const result = runSyntheticEnvironmentArchitecture();

    expect(result.audit_ledger).toHaveLength(8);
    expect(result.audit_ledger.map((entry) => entry.event_type)).toEqual(["REGISTERED", "CONFIGURATION_VALIDATED", "QUALIFICATION_DECIDED", "LIFECYCLE_TRANSITIONED", "REPLAY_VALIDATED", "GOVERNANCE_APPROVED", "INTEGRITY_VALIDATED", "RETIREMENT_RECORDED"]);
    expect(result.audit_ledger.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable)).toBe(true);
  });

  it("satisfies all constitutional invariants", () => {
    const result = runSyntheticEnvironmentArchitecture();

    expect(result.invariants).toHaveLength(10);
    expect(result.invariants.every((invariant) => invariant.satisfied && invariant.failure_reason === null)).toBe(true);
  });

  it("supports conditional qualification without activation approval", () => {
    const result = runSyntheticEnvironmentArchitecture({ scenario: "CONDITIONAL_QUALIFICATION" });
    const validation = validateSyntheticEnvironmentArchitecture(result);

    expect(result.qualification.outcome).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.outcome).toBe("REJECTED");
    expect(result.invariants.find((invariant) => invariant.invariant_id === "SIA-003")?.satisfied).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "IDENTITY_MUTATION",
    "VERSION_MUTATION",
    "CONFIGURATION_INCOMPLETE",
    "DEPENDENCY_INTEGRITY_FAILURE",
    "NON_DETERMINISTIC_CONFIGURATION",
    "REPLAY_DIVERGENCE",
    "GOVERNANCE_NOT_APPROVED",
    "TENANT_ISOLATION_BREACH",
    "EXECUTION_ISOLATION_BREACH",
    "SECURITY_CONTROL_FAILURE",
    "UNQUALIFIED_ACTIVATION",
    "AUDIT_LEDGER_MUTABLE",
    "ADVISORY_BOUNDARY_BREACH",
  ] as const)("rejects %s fail-closed", (scenario: SyntheticEnvironmentFailure) => {
    const result = runSyntheticEnvironmentArchitecture({ scenario });
    const validation = validateSyntheticEnvironmentArchitecture(result);

    expect(result.outcome).toBe("REJECTED");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested environment tampering", () => {
    const result = runSyntheticEnvironmentArchitecture();
    const tampered = {
      ...result,
      environment: {
        ...result.environment,
        tenant_scope: "tenant_beta",
      },
    };

    expect(validateSyntheticEnvironmentArchitecture(tampered).valid).toBe(false);
  });
});
