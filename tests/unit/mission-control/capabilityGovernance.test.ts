import { describe, expect, it } from "vitest";
import {
  buildTruthCapabilityGovernanceRequest,
  buildTruthPolicyContractRequest,
  sealTruthCapabilityGovernance,
  sealTruthPolicyContract,
} from "@/services/mission-control";
import type { TruthCapabilityGovernanceInput } from "@/services/mission-control";

function basePolicy(overrides: Record<string, unknown> = {}) {
  return sealTruthPolicyContract({
    request: buildTruthPolicyContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T17:00:00.000Z",
    }),
    policyType: "CAPABILITY_POLICY",
    policyName: "Observation Agent Capability Access",
    policyDescription: "Allows observation agents to collect and classify only.",
    policyScope: {
      scope_type: "AGENT",
      scope_id: "agent-observe",
      scope_description: "Observation agent capability boundary.",
    },
    policyVersion: "policy/v1",
    policyState: "ACTIVE",
    policyAction: "ALLOW",
    policyPriority: 1,
    policyAuthority: {
      authority_id: "governance-authority-alpha",
      authority_type: "GOVERNANCE_ENGINE",
      authority_scope: "CAPABILITY_GOVERNANCE",
      authority_timestamp: "2026-06-24T16:59:00.000Z",
      authority_evidence: ["authority-evidence-alpha"],
    },
    policyRules: [{
      rule_id: "rule-capability-alpha",
      rule_condition: "capability in observation profile",
      rule_action: "ALLOW",
      rule_priority: 1,
      rule_scope: "AGENT",
    }],
    replayReferenceIds: ["capability-policy-replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseCapabilityInput(overrides: Partial<TruthCapabilityGovernanceInput> = {}): TruthCapabilityGovernanceInput {
  return {
    request: buildTruthCapabilityGovernanceRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T17:01:00.000Z",
    }),
    policy: basePolicy(),
    agentProfile: {
      agent_id: "agent-observe",
      allowed_capabilities: ["COLLECT", "CLASSIFY"],
      denied_capabilities: ["EXECUTE", "MODIFY"],
      required_certifications: ["agent-cert-alpha"],
      required_trust_state: "TRUSTED",
      required_authority_scope: "CAPABILITY_GOVERNANCE",
    },
    capabilityScope: "AGENT",
    toolName: "observation-tool",
    capabilityName: "COLLECT",
    trustRequirement: "TRUSTED",
    trustState: "TRUSTED",
    certificationRequirement: "agent-cert-alpha",
    certificationState: "VALID",
    authorityRequirement: "GOVERNANCE_ENGINE",
    authorityState: "AUTHORIZED",
    replayReferences: ["capability-replay-alpha"],
    accessTenantId: "tenant-alpha",
    toolApproved: true,
    toolCertified: true,
    toolAuthorized: true,
    capabilityAuthorized: true,
    ...overrides,
  };
}

describe("capabilityGovernance", () => {
  it("allows approved tool and authorized capability deterministically", () => {
    const first = sealTruthCapabilityGovernance(baseCapabilityInput());
    const second = sealTruthCapabilityGovernance(baseCapabilityInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.governance.capability_action).toBe("ALLOW");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("denies unapproved and prohibited tools", () => {
    const unapproved = sealTruthCapabilityGovernance(baseCapabilityInput({ toolApproved: false }));
    const prohibited = sealTruthCapabilityGovernance(baseCapabilityInput({ prohibitedToolDetected: true }));

    expect(unapproved.certification).toBe("PASS");
    expect(unapproved.governance.capability_action).toBe("DENY");
    expect(prohibited.certification).toBe("PASS");
    expect(prohibited.governance.capability_action).toBe("DENY");
  });

  it("denies unauthorized capability and contains restricted capability", () => {
    const unauthorized = sealTruthCapabilityGovernance(baseCapabilityInput({ capabilityAuthorized: false }));
    const restricted = sealTruthCapabilityGovernance(baseCapabilityInput({
      capabilityName: "ANALYZE",
      restrictedCapabilityDetected: true,
      agentProfile: {
        agent_id: "agent-observe",
        allowed_capabilities: ["COLLECT", "CLASSIFY", "ANALYZE"],
        denied_capabilities: ["EXECUTE", "MODIFY"],
        required_certifications: ["agent-cert-alpha"],
        required_trust_state: "TRUSTED",
        required_authority_scope: "CAPABILITY_GOVERNANCE",
      },
    }));

    expect(unauthorized.governance.capability_action).toBe("DENY");
    expect(unauthorized.certification).toBe("PASS");
    expect(restricted.governance.capability_action).toBe("CONTAIN");
    expect(restricted.certification).toBe("PASS");
  });

  it("denies expired certification", () => {
    const result = sealTruthCapabilityGovernance(baseCapabilityInput({ certificationState: "EXPIRED" }));

    expect(result.certification).toBe("PASS");
    expect(result.governance.capability_action).toBe("DENY");
    expect(result.validation.certificationRequirementValid).toBe(true);
  });

  it("denies untrusted capability and escalates trust violation", () => {
    const untrusted = sealTruthCapabilityGovernance(baseCapabilityInput({ trustState: "UNTRUSTED" }));
    const violation = sealTruthCapabilityGovernance(baseCapabilityInput({ trustViolationDetected: true }));

    expect(untrusted.governance.capability_action).toBe("DENY");
    expect(untrusted.certification).toBe("PASS");
    expect(violation.governance.capability_action).toBe("ESCALATE");
    expect(violation.certification).toBe("PASS");
  });

  it("denies insufficient authority and escalates authority mismatch", () => {
    const insufficient = sealTruthCapabilityGovernance(baseCapabilityInput({ authorityState: "INSUFFICIENT" }));
    const mismatch = sealTruthCapabilityGovernance(baseCapabilityInput({ authorityState: "MISMATCH" }));

    expect(insufficient.governance.capability_action).toBe("DENY");
    expect(insufficient.certification).toBe("PASS");
    expect(mismatch.governance.capability_action).toBe("ESCALATE");
    expect(mismatch.certification).toBe("PASS");
  });

  it("denies profile violations", () => {
    const result = sealTruthCapabilityGovernance(baseCapabilityInput({
      capabilityName: "EXECUTE",
      profileMismatchDetected: true,
    }));

    expect(result.certification).toBe("PASS");
    expect(result.governance.capability_action).toBe("DENY");
    expect(result.validation.agentProfileValid).toBe(true);
  });

  it("blocks cross-tenant capability and trust access", () => {
    const result = sealTruthCapabilityGovernance(baseCapabilityInput({
      crossTenantCapabilityAccessDetected: true,
      crossTenantTrustAccessDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.governance.capability_action).toBe("DENY");
    expect(result.validation.tenantIsolationValid).toBe(false);
  });

  it("fails capability replay mismatch", () => {
    const result = sealTruthCapabilityGovernance(baseCapabilityInput({ replayMismatchDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthCapabilityGovernance(baseCapabilityInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
  });

  it("fails closed when control behavior is requested", () => {
    const result = sealTruthCapabilityGovernance(baseCapabilityInput({
      executionRequested: true,
      authorityExpansionDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
