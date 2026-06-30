import { describe, expect, it } from "vitest";
import {
  buildTruthPolicyContractRequest,
  sealTruthPolicyContract,
} from "@/services/mission-control";

function basePolicy(overrides: Record<string, unknown> = {}) {
  return sealTruthPolicyContract({
    request: buildTruthPolicyContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T14:00:00.000Z",
    }),
    policyType: "TOOL_POLICY",
    policyName: "Operator Approved Tool Access",
    policyDescription: "Requires governed approval for sensitive tool use.",
    policyScope: {
      scope_type: "TENANT",
      scope_id: "tenant-alpha",
      scope_description: "Tenant-scoped tool governance.",
    },
    policyVersion: "policy/v1",
    policyState: "ACTIVE",
    policyAction: "ESCALATE",
    policyPriority: 10,
    policyAuthority: {
      authority_id: "governance-authority-alpha",
      authority_type: "GOVERNANCE_ENGINE",
      authority_scope: "TOOL_GOVERNANCE",
      authority_timestamp: "2026-06-24T13:59:00.000Z",
      authority_evidence: ["authority-evidence-alpha"],
    },
    policyRules: [{
      rule_id: "rule-alpha",
      rule_condition: "tool.sensitivity == high",
      rule_action: "ESCALATE",
      rule_priority: 1,
      rule_scope: "TENANT",
    }],
    replayReferenceIds: ["policy-replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

describe("policyContract", () => {
  it("creates a deterministic certified policy contract", () => {
    const first = basePolicy();
    const second = basePolicy();

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.valid).toBe(true);
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("POLICY_TYPE_VALID");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("fails duplicate policy identity", () => {
    const policy = basePolicy();
    const result = basePolicy({
      policyId: policy.policy.policy_id,
      priorPolicyIds: [policy.policy.policy_id],
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.identityValid).toBe(false);
    expect(result.validation.reasonCodes).toContain("POLICY_ID_DUPLICATE");
  });

  it("fails identity mutation", () => {
    const result = basePolicy({ identityMutated: true });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("POLICY_ID_MUTATED");
  });

  it("fails unknown policy type", () => {
    const result = basePolicy({ unknownPolicyTypeDetected: true });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.typeValid).toBe(false);
    expect(result.validation.reasonCodes).toContain("POLICY_TYPE_INVALID");
  });

  it("fails unknown policy state and invalid transition", () => {
    const unknownState = basePolicy({ unknownPolicyStateDetected: true });
    const invalidTransition = basePolicy({
      priorState: "RETIRED",
      invalidStateTransitionDetected: true,
    });

    expect(unknownState.certification).toBe("FAIL");
    expect(unknownState.validation.reasonCodes).toContain("POLICY_STATE_INVALID");
    expect(invalidTransition.certification).toBe("FAIL");
    expect(invalidTransition.validation.reasonCodes).toContain("POLICY_STATE_TRANSITION_INVALID");
  });

  it("fails unknown and multiple policy actions", () => {
    const unknownAction = basePolicy({ unknownPolicyActionDetected: true });
    const multipleActions = basePolicy({ multipleActionsDetected: true });

    expect(unknownAction.certification).toBe("FAIL");
    expect(unknownAction.validation.reasonCodes).toContain("POLICY_ACTION_INVALID");
    expect(multipleActions.certification).toBe("FAIL");
    expect(multipleActions.validation.reasonCodes).toContain("POLICY_ACTION_MULTIPLE");
  });

  it("fails invalid policy scope", () => {
    const result = basePolicy({ unknownScopeDetected: true });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.scopeValid).toBe(false);
    expect(result.validation.reasonCodes).toContain("POLICY_SCOPE_INVALID");
  });

  it("fails invalid policy authority", () => {
    const result = basePolicy({ unknownAuthorityDetected: true });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.authorityValid).toBe(false);
    expect(result.validation.reasonCodes).toContain("POLICY_AUTHORITY_INVALID");
  });

  it("fails missing rule condition and action", () => {
    const missingCondition = basePolicy({ missingRuleConditionDetected: true });
    const missingAction = basePolicy({ missingRuleActionDetected: true });

    expect(missingCondition.certification).toBe("FAIL");
    expect(missingCondition.validation.reasonCodes).toContain("RULE_CONDITION_MISSING");
    expect(missingAction.certification).toBe("FAIL");
    expect(missingAction.validation.reasonCodes).toContain("RULE_ACTION_MISSING");
  });

  it("fails policy replay mismatch", () => {
    const result = basePolicy({ replayMismatchDetected: true });

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("blocks cross-tenant policy access and replay", () => {
    const result = basePolicy({
      crossTenantPolicyAccessDetected: true,
      crossTenantPolicyReplayDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = basePolicy({
      observabilityGapDetected: true,
      remediationDocumented: true,
    });

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when control behavior is requested", () => {
    const result = basePolicy({
      executionRequested: true,
      authorityExpansionDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
