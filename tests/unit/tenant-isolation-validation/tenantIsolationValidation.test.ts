import { describe, expect, it } from "vitest";
import {
  getTenantIsolationValidationBundle,
  replayTenantIsolationValidation,
  runTenantIsolationValidation,
  validateTenantIsolationValidation,
} from "@/services/tenant-isolation-validation";
import type { TenantIsolationFailure } from "@/types/tenant-isolation-validation";

describe("Mission Control Phase 14.5 Tenant Isolation Validation", () => {
  it("publishes the tenant isolation doctrine", () => {
    const bundle = getTenantIsolationValidationBundle();

    expect(bundle.doctrine.version).toBe("tenant-isolation-validation/v14.5");
    expect(bundle.doctrine.orchestration_phase).toBe("synthetic-scenario-orchestration/v14.4");
    expect(bundle.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(bundle.doctrine.isolation_domains).toEqual(["IDENTITY", "POLICY", "MEMORY", "ARTIFACT", "REPLAY"]);
    expect(bundle.doctrine.violation_categories).toEqual(["IDENTITY_VIOLATION", "POLICY_VIOLATION", "MEMORY_VIOLATION", "ARTIFACT_VIOLATION", "REPLAY_VIOLATION", "EXECUTION_BOUNDARY_VIOLATION", "UNKNOWN_ISOLATION_FAILURE"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines the validation contract and lifecycle", () => {
    const result = runTenantIsolationValidation();

    expect(result.contract.lifecycle).toEqual(["REGISTERED", "INITIALIZED", "VALIDATING", "EVIDENCE_COLLECTED", "REPLAY_VALIDATED", "CERTIFIED"]);
    expect(result.contract.deterministic_validation_required).toBe(true);
    expect(result.contract.replay_required).toBe(true);
    expect(result.contract.evidence_required).toBe(true);
    expect(result.contract.governance_required).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
  });

  it("validates every isolation domain", () => {
    const result = runTenantIsolationValidation({ tenant_id: "tenant_alpha" });

    expect(result.validation_record.tenant_id).toBe("tenant_alpha");
    expect(result.validation_record.validation_status).toBe("CERTIFIED");
    expect(result.validation_record.isolation_domains_validated).toEqual(["IDENTITY", "POLICY", "MEMORY", "ARTIFACT", "REPLAY"]);
    expect(result.violations).toEqual([]);
  });

  it("is deterministic and replayable", () => {
    const first = runTenantIsolationValidation();
    const second = runTenantIsolationValidation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTenantIsolationValidation(first).valid).toBe(true);
    expect(replayTenantIsolationValidation(first)).toBe(true);
  });

  it("preserves immutable evidence and complete explanations", () => {
    const result = runTenantIsolationValidation();

    expect(result.evidence_registry).toHaveLength(4);
    expect(result.evidence_registry.every((evidence) => evidence.lineage_reference && evidence.immutable_timestamp)).toBe(true);
    expect(result.explanation.explanation_summary).toBeTruthy();
    expect(result.explanation.supporting_evidence).toHaveLength(4);
    expect(result.explanation.validation_reasoning).toBeTruthy();
  });

  it("enforces governance and constitutional boundaries", () => {
    const result = runTenantIsolationValidation();

    expect(result.governance.constitutional_compliance).toBe(true);
    expect(result.governance.governance_supremacy).toBe(true);
    expect(result.governance.operator_supremacy).toBe(true);
    expect(result.governance.advisory_only_behavior).toBe(true);
    expect(result.governance.tenant_ownership_preserved).toBe(true);
    expect(result.governance.unauthorized_access_blocked).toBe(true);
    expect(result.governance.cross_tenant_execution_blocked).toBe(true);
  });

  it("executes the complete certification matrix", () => {
    const result = runTenantIsolationValidation();

    expect(result.certification_tests).toHaveLength(17);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Tenant Isolation Validation Contract approved",
      "Identity isolation enforced",
      "Policy isolation enforced",
      "Memory isolation enforced",
      "Artifact isolation enforced",
      "Replay isolation enforced",
      "Cross-tenant detection deterministic",
      "Isolation replay reproducible",
      "Evidence immutable",
      "Lineage complete",
      "Explainability complete",
      "Governance enforced",
      "Constitutional boundaries preserved",
      "Advisory-only boundary enforced",
      "Unauthorized sharing prevented",
      "Integrity verification successful",
      "Certification replayable",
    ]);
  });

  it("classifies cross-tenant isolation violations deterministically", () => {
    const result = runTenantIsolationValidation({ scenario: "IDENTITY_ISOLATION_FAILURE" });

    expect(result.outcome).toBe("FAIL");
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].violation_category).toBe("IDENTITY_VIOLATION");
    expect(result.violations[0].resolution_status).toBe("BLOCKED");
  });

  it("supports conditional pass for non-constitutional monitoring warnings", () => {
    const result = runTenantIsolationValidation({ scenario: "NON_CONSTITUTIONAL_MONITORING_WARNING" });
    const validation = validateTenantIsolationValidation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "CONTRACT_NOT_APPROVED",
    "IDENTITY_ISOLATION_FAILURE",
    "POLICY_ISOLATION_FAILURE",
    "MEMORY_ISOLATION_FAILURE",
    "ARTIFACT_ISOLATION_FAILURE",
    "REPLAY_ISOLATION_FAILURE",
    "CROSS_TENANT_DETECTION_NON_DETERMINISTIC",
    "ISOLATION_REPLAY_FAILURE",
    "EVIDENCE_MUTABLE",
    "LINEAGE_INCOMPLETE",
    "EXPLAINABILITY_INCOMPLETE",
    "GOVERNANCE_NOT_ENFORCED",
    "CONSTITUTIONAL_BOUNDARY_BREACH",
    "ADVISORY_BOUNDARY_BREACH",
    "UNAUTHORIZED_SHARING",
    "INTEGRITY_VERIFICATION_FAILED",
    "CERTIFICATION_REPLAY_FAILURE",
  ] as const)("fails certification for %s", (scenario: TenantIsolationFailure) => {
    const result = runTenantIsolationValidation({ scenario });
    const validation = validateTenantIsolationValidation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested evidence tampering", () => {
    const result = runTenantIsolationValidation();
    const tampered = {
      ...result,
      evidence_registry: [
        {
          ...result.evidence_registry[0],
          tenant_id: "tenant_beta",
        },
        ...result.evidence_registry.slice(1),
      ],
    };

    expect(validateTenantIsolationValidation(tampered).valid).toBe(false);
  });
});
