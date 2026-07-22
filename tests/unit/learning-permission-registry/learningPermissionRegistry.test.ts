import { describe, expect, it } from "vitest";
import {
  computeLearningPermissionHash,
  getLearningPermissionRegistryFoundation,
  LEARNING_PERMISSION_CHECKS,
  replayLearningPermissionRegistry,
  runLearningPermissionRegistry,
} from "@/services/learning-permission-registry";
import type { LearningPermissionFailure, LearningPermissionRegistryInput } from "@/types/learning-permission-registry";

describe("Mission Control Phase 10.0.3 Learning Permission Registry", () => {
  it("publishes the learning permission registry foundation", () => {
    const foundation = getLearningPermissionRegistryFoundation();

    expect(foundation.registry_version).toBe("learning-permission-registry/v1");
    expect(foundation.checks).toEqual(LEARNING_PERMISSION_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("registers active certified permissions with immutable identity", () => {
    const result = runLearningPermissionRegistry();
    const permission = result.registry.permissions[0];

    expect(computeLearningPermissionHash(permission)).toBe(permission.integrity_hash);
    expect(permission.permission_id).toBe("permission:recommendation-quality-analysis");
    expect(permission.lifecycle_state).toBe("ACTIVE");
    expect(result.registry.active_permission_ids).toContain(permission.permission_id);
  });

  it("allows an active permission that matches scope, capability, governance, replay, and certification", () => {
    const result = runLearningPermissionRegistry();

    expect(result.decision.validation_result).toBe("ALLOW");
    expect(result.validation.validation_status).toBe("VALID");
    expect(result.permits_learning).toBe(true);
    expect(result.certification_report.certification_decision).toBe("PASS");
  });

  it("rejects unknown or implicit permissions by default", () => {
    const missing = runLearningPermissionRegistry({ permission_id: "permission:missing" });
    const implicit = runLearningPermissionRegistry({ scenario: "IMPLICIT_PERMISSION" });

    expect(missing.decision.validation_result).toBe("REJECT");
    expect(missing.validation.failures).toContain("PERMISSION_DOES_NOT_EXIST");
    expect(implicit.validation.failures).toContain("IMPLICIT_PERMISSION");
  });

  it("records replayable decisions and append-only permission ledger entries", () => {
    const result = runLearningPermissionRegistry();

    expect(result.replay_model.deterministic_reconstruction).toBe(true);
    expect(result.replay_model.integrity_reproducible).toBe(true);
    expect(result.permission_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
    expect(result.permission_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("remains replayable, advisory-only, and non-executing", () => {
    const result = runLearningPermissionRegistry();

    expect(replayLearningPermissionRegistry(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.mutates_permission_registry).toBe(false);
  });

  it.each([
    ["BOUNDARY_INVALID", "BOUNDARY_MODEL_INVALID"],
    ["MISSING_PERMISSION", "PERMISSION_DOES_NOT_EXIST"],
    ["INACTIVE_PERMISSION", "PERMISSION_INACTIVE"],
    ["EXPIRED_PERMISSION", "PERMISSION_EXPIRED"],
    ["REVOKED_PERMISSION", "PERMISSION_REVOKED"],
    ["CAPABILITY_MISMATCH", "CAPABILITY_MISMATCH"],
    ["TENANT_MISMATCH", "TENANT_MISMATCH"],
    ["MISSION_SCOPE_MISMATCH", "MISSION_SCOPE_MISMATCH"],
    ["SCOPE_MISMATCH", "AUTHORIZED_SCOPE_MISMATCH"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_APPROVAL_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_ROLLBACK", "ROLLBACK_MISSING"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["UNAUTHORIZED_CAPABILITY", "UNAUTHORIZED_CAPABILITY_CREATION"],
    ["HIDDEN_PERMISSION", "HIDDEN_PERMISSION"],
    ["IMPLICIT_PERMISSION", "IMPLICIT_PERMISSION"],
    ["PERMISSION_FORGERY", "PERMISSION_FORGERY"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["REPLAY_BYPASS", "REPLAY_BYPASS"],
    ["TENANT_CROSSOVER", "TENANT_CROSSOVER"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["FAIL_OPEN", "FAIL_OPEN_PERMISSION_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<LearningPermissionRegistryInput["scenario"]>, LearningPermissionFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runLearningPermissionRegistry({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.permits_learning).toBe(false);
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks learning permission visibility", () => {
    const result = runLearningPermissionRegistry({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects learning permission registry tampering", () => {
    const result = runLearningPermissionRegistry();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayLearningPermissionRegistry(tampered)).toBe(false);
  });
});
