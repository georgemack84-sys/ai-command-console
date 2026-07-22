import { describe, expect, it } from "vitest";
import { getPlatformOperationsBundle, replayPlatformOperations, runPlatformOperations, validatePlatformOperations } from "@/services/platform-operations";
import type { PlatformOperationsFailure } from "@/types/platform-operations";

const CONDITIONAL_FAILURES: readonly PlatformOperationsFailure[] = [
  "DEPLOYMENT_AUTOMATION_MISSING",
  "DEPLOYMENT_VERIFICATION_FAILED",
  "RELEASE_MANAGEMENT_MISSING",
  "RELEASE_APPROVAL_NOT_ENFORCED",
  "ROLLBACK_CHECKPOINTS_MISSING",
  "BACKUP_PLATFORM_MISSING",
  "BACKUP_INTEGRITY_FAILED",
  "RECOVERY_PLATFORM_MISSING",
  "RECOVERY_VALIDATION_FAILED",
  "DISASTER_RECOVERY_UNTESTED",
  "ROLLBACK_SERVICES_MISSING",
  "ROLLBACK_VALIDATION_FAILED",
  "SCALING_PLATFORM_MISSING",
  "INCIDENT_MANAGEMENT_MISSING",
  "INCIDENT_ESCALATION_FAILED",
  "INCIDENT_EVIDENCE_MISSING",
  "PLATFORM_DASHBOARD_MISSING",
  "OPERATIONAL_VISIBILITY_INCOMPLETE",
  "OPERATIONAL_READINESS_MISSING",
  "PRODUCTION_READINESS_FAILED",
  "OPERATIONAL_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly PlatformOperationsFailure[] = [
  "W1_1B_IDENTITY_FULL_INVALID",
  "W1_2B_STORAGE_FULL_INVALID",
  "W1_3B_MESSAGING_FULL_INVALID",
  "W1_4B_REGISTRY_FULL_INVALID",
  "W1_5_CONFIGURATION_PLATFORM_INVALID",
  "W1_6_OBSERVABILITY_PLATFORM_INVALID",
  "W1_7B_SECURITY_FULL_INVALID",
  "W1_8_CAF_LEGION_RUNTIME_INVALID",
  "DEPLOYMENT_NON_DETERMINISTIC",
  "BACKUP_NOT_RESTORABLE",
  "QUALIFIED_STATE_NOT_RESTORED",
  "SCALING_TENANT_ISOLATION_FAILED",
  "SCALING_GOVERNANCE_VIOLATED",
  "OPERATOR_SUPREMACY_FAILED",
  "OPERATIONAL_GOVERNANCE_FAILED",
  "TENANT_ISOLATION_FAILED",
  "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE",
  "OPERATIONAL_REPLAY_INVALID",
];

describe("W1.9 Platform Operations", () => {
  it("publishes platform-operations doctrine and validates baseline", () => {
    const bundle = getPlatformOperationsBundle();

    expect(bundle.doctrine.version).toBe("platform-operations/w1.9");
    expect(bundle.doctrine.owns_deployment_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_release_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_backup_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_recovery_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_rollback_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_scaling_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_incident_lifecycle).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Platform Operations Qualification Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic operations qualification with qualified W1 references", () => {
    const first = runPlatformOperations();
    const second = runPlatformOperations();

    expect(first.phase_identifier).toBe("PlatformOperations");
    expect(first.caf_legion_runtime_ref).toBe("caf-legion-runtime/w1.8");
    expect(first.security_full_ref).toBe("security-full/w1.7b");
    expect(first.evidence.records).toHaveLength(9);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePlatformOperations(first).valid).toBe(true);
    expect(replayPlatformOperations(first)).toBe(true);
  });

  it("qualifies deployment, release, backup, recovery, rollback, and scaling", () => {
    const result = runPlatformOperations();

    expect(result.deployment.deterministic_execution).toBe(true);
    expect(result.deployment.immutable_history).toBe(true);
    expect(result.release.approval_workflow).toBe(true);
    expect(result.release.rollback_checkpoints).toBe(true);
    expect(result.backup.integrity_verification).toBe(true);
    expect(result.backup.immutable_backups).toBe(true);
    expect(result.backup.restorable).toBe(true);
    expect(result.recovery.recovery_validation).toBe(true);
    expect(result.recovery.deterministic_testing).toBe(true);
    expect(result.rollback.qualified_state_restore).toBe(true);
    expect(result.scaling.tenant_isolation).toBe(true);
    expect(result.scaling.governance_preserved).toBe(true);
  });

  it("qualifies incidents, dashboards, readiness, evidence, and the operations gate", () => {
    const result = runPlatformOperations();

    expect(result.incidents.operator_escalation).toBe(true);
    expect(result.incidents.root_cause_tracking).toBe(true);
    expect(result.incidents.traceable).toBe(true);
    expect(result.dashboard.complete_visibility).toBe(true);
    expect(result.dashboard.runtime_health).toBe(true);
    expect(result.operational_readiness.production_readiness).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.qualification.governance_compliance).toBe(true);
    expect(result.qualification.constitutional_compliance).toBe(true);
    expect(result.qualification.gate_decision).toBe("PLATFORM_OPERATIONS_QUALIFIED");
    expect(result.readiness.decision).toBe("PLATFORM_OPERATIONS_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks platform operations conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runPlatformOperations({ scenario: failure });
    const validation = validatePlatformOperations(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks platform operations not qualified when the qualification gate fails", () => {
    const result = runPlatformOperations({ scenario: "PLATFORM_OPERATIONS_QUALIFICATION_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validatePlatformOperations(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical operations defect %s", (failure) => {
    const result = runPlatformOperations({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validatePlatformOperations(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runPlatformOperations({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runPlatformOperations({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validatePlatformOperations(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
