import { describe, expect, it } from "vitest";
import {
  getAdvisoryBoundaryValidationBundle,
  replayAdvisoryBoundaryValidation,
  runAdvisoryBoundaryValidation,
  validateAdvisoryBoundaryValidation,
} from "@/services/advisory-boundary-validation";
import type { AdvisoryBoundaryFailure } from "@/types/advisory-boundary-validation";

describe("Mission Control Phase 14.6 Advisory Boundary Validation", () => {
  it("publishes the advisory boundary doctrine", () => {
    const bundle = getAdvisoryBoundaryValidationBundle();

    expect(bundle.doctrine.version).toBe("advisory-boundary-validation/v14.6");
    expect(bundle.doctrine.tenant_isolation_phase).toBe("tenant-isolation-validation/v14.5");
    expect(bundle.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(bundle.doctrine.allowed_authority).toEqual(["ASSESS", "RECOMMEND", "EXPLAIN", "CERTIFY", "SIMULATE", "VALIDATE"]);
    expect(bundle.doctrine.prohibited_authority).toEqual(["EXECUTE_ACTION", "INITIATE_DEPLOYMENT", "MODIFY_EXTERNAL_SYSTEM", "SELF_APPROVE", "BYPASS_GOVERNANCE", "ELEVATE_AUTHORITY"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines advisory-only boundary contract", () => {
    const result = runAdvisoryBoundaryValidation();

    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.allowed_authority).toHaveLength(6);
    expect(result.contract.prohibited_authority).toHaveLength(6);
    expect(result.contract.boundary_types).toEqual(["API", "CONNECTOR", "DEPLOYMENT", "WORKFLOW", "AUTOMATION", "ORCHESTRATION", "PLUGIN", "TOOL"]);
  });

  it("blocks every execution path", () => {
    const result = runAdvisoryBoundaryValidation();

    expect(result.validation.direct_execution_blocked).toBe(true);
    expect(result.validation.indirect_execution_blocked).toBe(true);
    expect(result.validation.delegated_execution_blocked).toBe(true);
    expect(result.validation.chained_execution_blocked).toBe(true);
    expect(result.validation.recursive_execution_blocked).toBe(true);
    expect(result.validation.execution_authority_impossible).toBe(true);
  });

  it("protects external interfaces", () => {
    const result = runAdvisoryBoundaryValidation();

    expect(result.interfaces.protected_interfaces).toHaveLength(8);
    expect(result.interfaces.interface_contracts_valid).toBe(true);
    expect(result.interfaces.immutable_advisory_responses).toBe(true);
    expect(result.interfaces.execution_separation).toBe(true);
    expect(result.interfaces.authority_preservation).toBe(true);
    expect(result.interfaces.policy_enforcement).toBe(true);
  });

  it("executes synthetic attack suite deterministically", () => {
    const result = runAdvisoryBoundaryValidation();

    expect(result.attacks).toHaveLength(12);
    expect(result.attacks.every((attack) => attack.expected_behavior === "BLOCKED" && attack.observed_behavior === "BLOCKED" && attack.execution_blocked)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runAdvisoryBoundaryValidation();
    const second = runAdvisoryBoundaryValidation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAdvisoryBoundaryValidation(first).valid).toBe(true);
    expect(replayAdvisoryBoundaryValidation(first)).toBe(true);
  });

  it("preserves governance and monitoring", () => {
    const result = runAdvisoryBoundaryValidation();

    expect(result.governance.constitutional_hierarchy).toBe(true);
    expect(result.governance.governance_supremacy).toBe(true);
    expect(result.governance.operator_supremacy).toBe(true);
    expect(result.governance.advisory_only_doctrine).toBe(true);
    expect(result.governance.authority_ceilings).toBe(true);
    expect(result.observability.alerts_operational).toBe(true);
    expect(result.observability.metrics_accurate).toBe(true);
  });

  it("executes the complete certification matrix", () => {
    const result = runAdvisoryBoundaryValidation();

    expect(result.certification_tests).toHaveLength(20);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Advisory Boundary Contract valid",
      "Advisory-only outputs enforced",
      "Direct execution blocked",
      "Indirect execution blocked",
      "Delegated execution blocked",
      "Recursive execution blocked",
      "External interfaces protected",
      "Authority escalation detected",
      "Governance bypass rejected",
      "Operator bypass rejected",
      "Boundary violations registered",
      "Boundary lineage complete",
      "Replay deterministic",
      "Replay divergence detected",
      "Boundary evidence immutable",
      "Tenant isolation preserved",
      "Constitutional hierarchy enforced",
      "Continuous monitoring operational",
      "Synthetic attack suite passed",
      "Certification reproducible",
    ]);
  });

  it("supports conditional pass for non-constitutional documentation warnings", () => {
    const result = runAdvisoryBoundaryValidation({ scenario: "NON_CONSTITUTIONAL_DOCUMENTATION_WARNING" });
    const validation = validateAdvisoryBoundaryValidation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it("registers blocked boundary violation attempts", () => {
    const result = runAdvisoryBoundaryValidation({ scenario: "DIRECT_EXECUTION_NOT_BLOCKED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].violation_category).toBe("DIRECT_EXECUTION");
    expect(result.violations[0].severity).toBe("CRITICAL");
  });

  it.each([
    "BOUNDARY_CONTRACT_INVALID",
    "ADVISORY_OUTPUT_FAILURE",
    "DIRECT_EXECUTION_NOT_BLOCKED",
    "INDIRECT_EXECUTION_NOT_BLOCKED",
    "DELEGATED_EXECUTION_NOT_BLOCKED",
    "RECURSIVE_EXECUTION_NOT_BLOCKED",
    "INTERFACE_PROTECTION_FAILURE",
    "AUTHORITY_ESCALATION_NOT_DETECTED",
    "GOVERNANCE_BYPASS_NOT_REJECTED",
    "OPERATOR_BYPASS_NOT_REJECTED",
    "VIOLATION_REGISTRY_INCOMPLETE",
    "BOUNDARY_LINEAGE_INCOMPLETE",
    "REPLAY_NON_DETERMINISTIC",
    "REPLAY_DIVERGENCE_UNDETECTED",
    "EVIDENCE_MUTABLE",
    "TENANT_ISOLATION_BREACH",
    "CONSTITUTIONAL_HIERARCHY_BREACH",
    "MONITORING_UNAVAILABLE",
    "ATTACK_SUITE_FAILURE",
    "CERTIFICATION_REPLAY_FAILURE",
  ] as const)("fails certification for %s", (scenario: AdvisoryBoundaryFailure) => {
    const result = runAdvisoryBoundaryValidation({ scenario });
    const validation = validateAdvisoryBoundaryValidation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested attack tampering", () => {
    const result = runAdvisoryBoundaryValidation();
    const tampered = {
      ...result,
      attacks: [
        {
          ...result.attacks[0],
          observed_behavior: "ALLOWED" as const,
        },
        ...result.attacks.slice(1),
      ],
    };

    expect(validateAdvisoryBoundaryValidation(tampered).valid).toBe(false);
  });
});
