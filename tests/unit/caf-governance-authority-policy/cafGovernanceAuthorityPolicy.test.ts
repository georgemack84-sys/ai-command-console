import { describe, expect, it } from "vitest";
import {
  getGovernanceAuthorityPolicyBundle,
  replayGovernanceAuthorityPolicy,
  runGovernanceAuthorityPolicy,
  validateGovernanceAuthorityPolicy,
} from "@/services/caf-governance-authority-policy";
import type { GovernanceAuthorityPolicyScenario } from "@/types/caf-governance-authority-policy";

describe("Program 3 P3.7 Governance Authority and Policy Enforcement", () => {
  it("publishes enforcement doctrine without redefining policy or authority", () => {
    const bundle = getGovernanceAuthorityPolicyBundle();

    expect(bundle.doctrine.version).toBe("caf-governance-authority-policy/v3.7");
    expect(bundle.doctrine.consumes_p3_0_authority_matrix).toBe(true);
    expect(bundle.doctrine.consumes_cci_policy_engine).toBe(true);
    expect(bundle.doctrine.defines_policy).toBe(false);
    expect(bundle.doctrine.defines_authority_hierarchy).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic authority, policy, approval, and gate results", () => {
    const first = runGovernanceAuthorityPolicy();
    const second = runGovernanceAuthorityPolicy();

    expect(first.collaboration_federation_ref).toBe("caf-collaboration-federation/v3.6");
    expect(first.authority_decision.deterministic).toBe(true);
    expect(first.policy_evaluation.cci_policy_engine_consumed).toBe(true);
    expect(first.approval_decision.deterministic).toBe(true);
    expect(first.gate_result.exactly_one_result).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateGovernanceAuthorityPolicy(first).valid).toBe(true);
    expect(replayGovernanceAuthorityPolicy(first)).toBe(true);
  });

  it("aggregates warnings from P3.0 and produces admission requests", () => {
    const result = runGovernanceAuthorityPolicy();

    expect(result.warning_collection.warnings).toHaveLength(2);
    expect(result.warning_collection.warnings.every((warning) => warning.from_p3_0_registry)).toBe(true);
    expect(result.warning_collection.routed).toBe(true);
    expect(result.gate_result.outcome).toBe("ADMITTED_WITH_WARNINGS");
    expect(result.admission_request.admitted).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "P3_6_COLLABORATION_INVALID",
    "P3_0_AUTHORITY_MATRIX_UNAVAILABLE",
    "P3_0_WARNING_REGISTRY_UNAVAILABLE",
    "GOVERNANCE_POLICY_REDEFINED",
    "AUTHORITY_HIERARCHY_REDEFINED",
    "AUTHORITY_DECISION_NON_DETERMINISTIC",
    "POLICY_ENGINE_BYPASS",
    "APPROVAL_WORKFLOW_NON_DETERMINISTIC",
    "GATE_RESULT_DUPLICATED",
    "WARNING_CLASS_NOT_FROM_P3_0",
    "WARNING_ROUTING_MISSING",
    "ADMISSION_REQUEST_MISSING",
    "EVIDENCE_TRACE_MISSING",
    "REPLAY_DIVERGENCE",
    "FAIL_CLOSED_NOT_ENFORCED",
  ] as const)("fails certification for %s", (scenario: GovernanceAuthorityPolicyScenario) => {
    const result = runGovernanceAuthorityPolicy({ scenario });
    const validation = validateGovernanceAuthorityPolicy(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runGovernanceAuthorityPolicy({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
