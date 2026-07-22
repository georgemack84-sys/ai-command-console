import { describe, expect, it } from "vitest";
import { getProvingEcosystemValidationFederationBundle, replayProvingEcosystemValidationFederation, runProvingEcosystemValidationFederation, validateProvingEcosystemValidationFederation } from "@/services/proving-ecosystem-validation-federation";
import type { FederationFailure } from "@/types/proving-ecosystem-validation-federation";

const CONDITIONAL_FAILURES: readonly FederationFailure[] = [
  "FEDERATION_ARCHITECTURE_MISSING",
  "FEDERATION_TOPOLOGY_INVALID",
  "FEDERATION_REGISTRY_MISSING",
  "FEDERATION_PARTICIPANT_IDENTITY_UNVERIFIED",
  "FEDERATION_AUTHORIZATION_MISSING",
  "CROSS_TENANT_AUTHORIZATION_INVALID",
  "CROSS_PROGRAM_COMPATIBILITY_INVALID",
  "QUALIFIED_INTERFACE_MISSING",
  "FEDERATION_EXERCISE_FRAMEWORK_MISSING",
  "DISTRIBUTED_SCENARIO_EXECUTION_FAILED",
  "SCENARIO_SYNCHRONIZATION_FAILED",
  "REPLAY_LINEAGE_INCOMPLETE",
  "EVIDENCE_SYNCHRONIZATION_FAILED",
  "TRUST_FEDERATION_COMPATIBILITY_INVALID",
  "FEDERATION_RESILIENCE_VALIDATION_FAILED",
  "PARTITION_HANDLING_FAILED",
];

describe("P6.17 Ecosystem Validation Federation", () => {
  it("publishes federation doctrine while preserving trust authority", () => {
    const bundle = getProvingEcosystemValidationFederationBundle();

    expect(bundle.doctrine.version).toBe("proving-ecosystem-validation-federation/v6.17");
    expect(bundle.doctrine.owns_federation_proving).toBe(true);
    expect(bundle.doctrine.owns_multi_tenant_proving).toBe(true);
    expect(bundle.doctrine.owns_ecosystem_federation).toBe(true);
    expect(bundle.doctrine.owns_cross_program_validation).toBe(true);
    expect(bundle.doctrine.owns_federation_exercises).toBe(true);
    expect(bundle.doctrine.preserves_trust_authority).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic federation validation with the P6.16 readiness dependency", () => {
    const first = runProvingEcosystemValidationFederation();
    const second = runProvingEcosystemValidationFederation();

    expect(first.phase_identifier).toBe("ProvingEcosystemValidationFederation");
    expect(first.ecosystem_readiness_ref).toBe("proving-ecosystem-readiness-assessment/v6.16");
    expect(first.architecture.deterministic).toBe(true);
    expect(first.registry.members).toHaveLength(8);
    expect(first.exercise_report.exercise_types).toHaveLength(10);
    expect(first.metrics_report.metrics).toHaveLength(10);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingEcosystemValidationFederation(first).valid).toBe(true);
    expect(replayProvingEcosystemValidationFederation(first)).toBe(true);
  });

  it("validates federation architecture, registry, multi-tenant isolation, and cross-program compatibility", () => {
    const result = runProvingEcosystemValidationFederation();

    expect(result.architecture.proving_federation).toBe(true);
    expect(result.registry.federation_identities_verified).toBe(true);
    expect(result.registry.constitutional_authorization).toBe(true);
    expect(result.multi_tenant_report.tenant_isolation).toBe(true);
    expect(result.multi_tenant_report.identity_isolation).toBe(true);
    expect(result.cross_program_matrix.programs).toEqual(["P1", "P2", "P3", "P4", "P5", "P6"]);
    expect(result.cross_program_matrix.qualified_contracts_only).toBe(true);
  });

  it("validates distributed exercises, replay, evidence synchronization, and metrics", () => {
    const result = runProvingEcosystemValidationFederation();

    expect(result.exercise_report.coordinated_proving).toBe(true);
    expect(result.distributed_scenario_report.synchronized_execution).toBe(true);
    expect(result.distributed_scenario_report.execution_accuracy).toBeGreaterThanOrEqual(0.98);
    expect(result.replay_report.deterministic_replay).toBe(true);
    expect(result.replay_report.replay_lineage_complete).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.synchronized_across_members).toBe(true);
    expect(result.metrics_report.replay_determinism).toBe(1);
    expect(result.metrics_report.governance_consistency).toBe(1);
  });

  it("validates governance, trust compatibility, resilience, and qualification package readiness", () => {
    const result = runProvingEcosystemValidationFederation();

    expect(result.governance_report.constitutional_compliance).toBe(true);
    expect(result.governance_report.operator_supremacy).toBe(true);
    expect(result.governance_report.fail_closed_behavior).toBe(true);
    expect(result.trust_report.trust_decisions_respected).toBe(true);
    expect(result.trust_report.trust_authority_preserved).toBe(true);
    expect(result.trust_report.proving_validates_behavior_only).toBe(true);
    expect(result.resilience_report.partition_handling).toBe(true);
    expect(result.qualification_package.qualification_ready).toBe(true);
    expect(result.decision.qualification_authorized).toBe(true);
  });

  it("passes all P6.17 federation gates and readiness checks", () => {
    const result = runProvingEcosystemValidationFederation();

    expect(result.gates.registration_gate).toBe(true);
    expect(result.gates.tenant_isolation_gate).toBe(true);
    expect(result.gates.cross_program_gate).toBe(true);
    expect(result.gates.replay_gate).toBe(true);
    expect(result.gates.evidence_gate).toBe(true);
    expect(result.gates.governance_gate).toBe(true);
    expect(result.gates.trust_gate).toBe(true);
    expect(result.gates.qualification_gate).toBe(true);
    expect(result.gates.resilience_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.readiness.outcome).toBe("FEDERATION_READY");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks federation conditionally ready for remediable deficiency %s", (failure) => {
    const result = runProvingEcosystemValidationFederation({ scenario: failure });
    const validation = validateProvingEcosystemValidationFederation(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.outcome).toBe("CONDITIONALLY_READY");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["P6_16_READINESS_INVALID", "FEDERATION_REPLAY_INVALID", "FEDERATION_QUALIFICATION_PACKAGE_INCOMPLETE", "ECOSYSTEM_QUALIFICATION_READINESS_FAILED"] as const)("marks federation not ready for qualification blocker %s", (failure) => {
    const result = runProvingEcosystemValidationFederation({ scenario: failure });

    expect(result.readiness.outcome).toBe("NOT_READY");
    expect(result.decision.qualification_authorized).toBe(false);
    expect(result.decision.fail_closed).toBe(true);
    expect(validateProvingEcosystemValidationFederation(result).valid).toBe(false);
  });

  it.each(["TENANT_ISOLATION_VIOLATED", "FEDERATED_EVIDENCE_INTEGRITY_INVALID", "GOVERNANCE_CONSISTENCY_INVALID", "AUTHORITY_ENFORCEMENT_INVALID", "POLICY_ENFORCEMENT_INVALID", "OPERATOR_SUPREMACY_VIOLATED", "FAIL_CLOSED_NOT_ENFORCED", "TRUST_AUTHORITY_SUPERSEDED"] as const)("fails closed for constitutional federation violation %s", (failure) => {
    const result = runProvingEcosystemValidationFederation({ scenario: failure });

    expect(result.readiness.outcome).toBe("FAIL_CLOSED");
    expect(result.decision.fail_closed).toBe(true);
    expect(result.decision.qualification_authorized).toBe(false);
    expect(result.decision.federation_execution_authorized).toBe(false);
    expect(validateProvingEcosystemValidationFederation(result).valid).toBe(false);
  });

  it("supports ready with observations but keeps conditional follow-up out of full readiness", () => {
    const observed = runProvingEcosystemValidationFederation({ scenario: "READY_WITH_OBSERVATIONS" });
    const conditional = runProvingEcosystemValidationFederation({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.outcome).toBe("READY_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateProvingEcosystemValidationFederation(observed).valid).toBe(true);
    expect(conditional.readiness.outcome).toBe("CONDITIONALLY_READY");
    expect(conditional.readiness.phase_ready).toBe(false);
    expect(conditional.decision.qualification_authorized).toBe(false);
  });
});
