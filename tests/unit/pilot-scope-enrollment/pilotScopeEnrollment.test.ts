import { describe, expect, it } from "vitest";
import {
  getPilotScopeEnrollmentBundle,
  replayPilotScopeEnrollment,
  runPilotScopeEnrollment,
  validatePilotScopeEnrollment,
} from "@/services/pilot-scope-enrollment";
import type { PilotScopeEnrollmentFailure } from "@/types/pilot-scope-enrollment";

describe("Mission Control Phase 16.2 Pilot Scope & Enrollment", () => {
  it("publishes pilot scope enrollment doctrine", () => {
    const bundle = getPilotScopeEnrollmentBundle();

    expect(bundle.doctrine.version).toBe("pilot-scope-enrollment/v16.2");
    expect(bundle.doctrine.upstream_phase).toBe("pilot-governance-foundation/v16.1");
    expect(bundle.doctrine.lifecycle).toEqual(["SCOPE_DEFINED", "QUALIFICATION_PENDING", "TENANT_QUALIFIED", "OPERATOR_APPROVED", "CAPABILITIES_APPROVED", "ENVIRONMENT_APPROVED", "DATASET_APPROVED", "ENROLLMENT_APPROVED", "ACTIVE", "SUSPENDED", "REVOKED", "COMPLETED"]);
    expect(bundle.doctrine.qualification_outcomes).toEqual(["QUALIFIED", "CONDITIONALLY_QUALIFIED", "REQUIRES_REVIEW", "NOT_QUALIFIED"]);
    expect(bundle.doctrine.enrollment_outcomes).toEqual(["APPROVED", "CONDITIONALLY_APPROVED", "REJECTED", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_RECERTIFICATION", "SUSPENDED", "REVOKED"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("registers governed immutable pilot scope versions", () => {
    const result = runPilotScopeEnrollment();

    expect(result.scope.governed).toBe(true);
    expect(result.scope.immutable).toBe(true);
    expect(result.scope.current).toBe(true);
    expect(result.scope.governance_refs.length).toBeGreaterThan(0);
    expect(result.scope.certification_refs.length).toBeGreaterThan(0);
    expect(result.scope_version.version).toBe("16.2.0");
    expect(result.scope_version.expansion_governed).toBe(true);
    expect(result.scope_version.reduction_history_preserved).toBe(true);
  });

  it("qualifies tenants, operators, capabilities, datasets, and environments", () => {
    const result = runPilotScopeEnrollment();

    expect(result.tenant_qualification.outcome).toBe("QUALIFIED");
    expect(result.tenant_qualification.evidence_immutable).toBe(true);
    expect(result.operator_qualification.approved).toBe(true);
    expect(result.capabilities).toHaveLength(7);
    expect(result.capabilities.every((entry) => entry.governed && entry.activation_status === "ENABLED")).toBe(true);
    expect(result.datasets.every((entry) => entry.governed && entry.approval_status === "APPROVED")).toBe(true);
    expect(result.environments.every((entry) => entry.qualification_verified && entry.deployment_status === "APPROVED")).toBe(true);
  });

  it("coordinates deterministic enrollment workflow", () => {
    const result = runPilotScopeEnrollment();

    expect(result.workflow.current_state).toBe("ACTIVE");
    expect(result.workflow.outcome).toBe("APPROVED");
    expect(result.workflow.deterministic).toBe(true);
    expect(result.workflow.qualification_bypass_blocked).toBe(true);
    expect(result.workflow.unauthorized_expansion_blocked).toBe(true);
    expect(result.workflow.replay_hash).toBeTruthy();
  });

  it("records append-only enrollment ledger and complete lineage", () => {
    const result = runPilotScopeEnrollment();

    expect(result.ledger).toHaveLength(10);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0)).toBe(true);
    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.immutable).toBe(true);
    expect(result.lineage.replayable).toBe(true);
    expect(result.lineage.enrollment_events).toHaveLength(result.ledger.length);
  });

  it("is deterministic and replayable", () => {
    const first = runPilotScopeEnrollment();
    const second = runPilotScopeEnrollment();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePilotScopeEnrollment(first).valid).toBe(true);
    expect(replayPilotScopeEnrollment(first)).toBe(true);
  });

  it("executes the Phase 16.2 enrollment certification matrix", () => {
    const result = runPilotScopeEnrollment();

    expect(result.certification_tests).toHaveLength(16);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Scope governed",
      "Scope versioned",
      "Enrollment reproducible",
      "Tenant qualification complete",
      "Operator qualification complete",
      "Capability enrollment governed",
      "Environment qualification verified",
      "Dataset approval governed",
      "Enrollment lineage immutable",
      "Governance approvals replayable",
      "Unauthorized enrollment impossible",
      "Only qualified tenants participate",
      "Scope expansion requires governance approval",
      "Qualification evidence immutable",
      "Revoked enrollment remains replayable",
      "Phase 16.1 governance foundation valid",
    ]);
  });

  it("supports conditional pass for non-constitutional enrollment warnings", () => {
    const result = runPilotScopeEnrollment({ scenario: "NON_CONSTITUTIONAL_ENROLLMENT_WARNING" });
    const validation = validatePilotScopeEnrollment(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "SCOPE_NOT_GOVERNED",
    "SCOPE_NOT_VERSIONED",
    "ENROLLMENT_NOT_REPRODUCIBLE",
    "TENANT_QUALIFICATION_INCOMPLETE",
    "OPERATOR_QUALIFICATION_INCOMPLETE",
    "CAPABILITY_ENROLLMENT_NOT_GOVERNED",
    "ENVIRONMENT_QUALIFICATION_NOT_VERIFIED",
    "DATASET_APPROVAL_NOT_GOVERNED",
    "ENROLLMENT_LINEAGE_MUTABLE",
    "GOVERNANCE_APPROVALS_NOT_REPLAYABLE",
    "UNAUTHORIZED_ENROLLMENT_POSSIBLE",
    "UNQUALIFIED_TENANT_ENROLLED",
    "SCOPE_EXPANSION_WITHOUT_GOVERNANCE",
    "QUALIFICATION_EVIDENCE_MUTABLE",
    "REVOKED_ENROLLMENT_NOT_REPLAYABLE",
    "PHASE_16_1_GOVERNANCE_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: PilotScopeEnrollmentFailure) => {
    const result = runPilotScopeEnrollment({ scenario });
    const validation = validatePilotScopeEnrollment(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested scope tampering", () => {
    const result = runPilotScopeEnrollment();
    const tampered = {
      ...result,
      scope: {
        ...result.scope,
        governed: false,
      },
    };

    expect(validatePilotScopeEnrollment(tampered).valid).toBe(false);
  });
});
