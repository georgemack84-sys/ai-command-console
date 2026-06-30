import { describe, expect, it } from "vitest";
import {
  buildTruthNetworkGovernanceRequest,
  buildTruthPolicyContractRequest,
  sealTruthNetworkGovernance,
  sealTruthPolicyContract,
} from "@/services/mission-control";
import type { TruthNetworkGovernanceInput } from "@/services/mission-control";

function basePolicy(overrides: Record<string, unknown> = {}) {
  return sealTruthPolicyContract({
    request: buildTruthPolicyContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T16:00:00.000Z",
    }),
    policyType: "NETWORK_POLICY",
    policyName: "Approved Network Destinations",
    policyDescription: "Allows approved external network destinations.",
    policyScope: {
      scope_type: "TENANT",
      scope_id: "tenant-alpha",
      scope_description: "Tenant network boundary.",
    },
    policyVersion: "policy/v1",
    policyState: "ACTIVE",
    policyAction: "ALLOW",
    policyPriority: 1,
    policyAuthority: {
      authority_id: "governance-authority-alpha",
      authority_type: "GOVERNANCE_ENGINE",
      authority_scope: "NETWORK_GOVERNANCE",
      authority_timestamp: "2026-06-24T15:59:00.000Z",
      authority_evidence: ["authority-evidence-alpha"],
    },
    policyRules: [{
      rule_id: "rule-network-alpha",
      rule_condition: "domain in approved list",
      rule_action: "ALLOW",
      rule_priority: 1,
      rule_scope: "TENANT",
    }],
    replayReferenceIds: ["network-policy-replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseNetworkInput(overrides: Partial<TruthNetworkGovernanceInput> = {}): TruthNetworkGovernanceInput {
  return {
    request: buildTruthNetworkGovernanceRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T16:01:00.000Z",
    }),
    policy: basePolicy(),
    networkScope: "DOMAIN",
    targetDomain: "api.openai.com",
    protocolType: "HTTPS",
    routingScope: "OUTBOUND",
    replayReferences: ["network-replay-alpha"],
    accessTenantId: "tenant-alpha",
    authorized: true,
    domainApproved: true,
    protocolAuthorized: true,
    outboundAuthorized: true,
    ...overrides,
  };
}

describe("networkGovernance", () => {
  it("allows approved domain deterministically", () => {
    const first = sealTruthNetworkGovernance(baseNetworkInput());
    const second = sealTruthNetworkGovernance(baseNetworkInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.governance.network_action).toBe("ALLOW");
    expect(first.validation.reasonCodes).toContain("DOMAIN_GOVERNANCE_OPERATIONAL");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("denies unapproved domain and escalates unknown domain", () => {
    const denied = sealTruthNetworkGovernance(baseNetworkInput({ domainApproved: false }));
    const unknown = sealTruthNetworkGovernance(baseNetworkInput({ domainUnknownDetected: true }));

    expect(denied.certification).toBe("PASS");
    expect(denied.governance.network_action).toBe("DENY");
    expect(unknown.certification).toBe("PASS");
    expect(unknown.governance.network_action).toBe("ESCALATE");
  });

  it("allows approved IP and denies unauthorized IP", () => {
    const approved = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "IP",
      targetDomain: undefined,
      targetIp: "203.0.113.10",
      ipApproved: true,
    }));
    const denied = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "IP",
      targetDomain: undefined,
      targetIp: "203.0.113.10",
      ipApproved: false,
    }));

    expect(approved.governance.network_action).toBe("ALLOW");
    expect(approved.certification).toBe("PASS");
    expect(denied.governance.network_action).toBe("DENY");
    expect(denied.certification).toBe("PASS");
  });

  it("allows approved CIDR and denies restricted CIDR", () => {
    const approved = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "CIDR",
      targetDomain: undefined,
      targetCidr: "10.10.0.0/16",
      cidrApproved: true,
    }));
    const denied = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "CIDR",
      targetDomain: undefined,
      targetCidr: "0.0.0.0/0",
      restrictedCidrDetected: true,
    }));

    expect(approved.governance.network_action).toBe("ALLOW");
    expect(approved.certification).toBe("PASS");
    expect(denied.governance.network_action).toBe("DENY");
    expect(denied.certification).toBe("PASS");
  });

  it("allows approved protocol and denies unauthorized protocol", () => {
    const approved = sealTruthNetworkGovernance(baseNetworkInput({ protocolType: "GRPC" }));
    const denied = sealTruthNetworkGovernance(baseNetworkInput({
      protocolType: "SSH",
      protocolAuthorized: false,
    }));

    expect(approved.governance.network_action).toBe("ALLOW");
    expect(approved.certification).toBe("PASS");
    expect(denied.governance.network_action).toBe("DENY");
    expect(denied.certification).toBe("PASS");
  });

  it("denies unauthorized outbound and inbound requests", () => {
    const outbound = sealTruthNetworkGovernance(baseNetworkInput({ outboundAuthorized: false }));
    const inbound = sealTruthNetworkGovernance(baseNetworkInput({
      routingScope: "INBOUND",
      inboundAuthorized: false,
      outboundAuthorized: undefined,
    }));

    expect(outbound.governance.network_action).toBe("DENY");
    expect(outbound.certification).toBe("PASS");
    expect(inbound.governance.network_action).toBe("DENY");
    expect(inbound.certification).toBe("PASS");
  });

  it("allows authorized federation and denies unauthorized federation route", () => {
    const allowed = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "FEDERATION",
      routingScope: "FEDERATION",
      federationAuthorized: true,
    }));
    const denied = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "FEDERATION",
      routingScope: "FEDERATION",
      federationAuthorized: false,
    }));

    expect(allowed.governance.network_action).toBe("ALLOW");
    expect(allowed.certification).toBe("PASS");
    expect(denied.governance.network_action).toBe("DENY");
    expect(denied.certification).toBe("PASS");
  });

  it("contains federation trust violations", () => {
    const result = sealTruthNetworkGovernance(baseNetworkInput({
      networkScope: "FEDERATION",
      routingScope: "FEDERATION",
      federationAuthorized: true,
      federationTrustViolationDetected: true,
    }));

    expect(result.governance.network_action).toBe("CONTAIN");
    expect(result.certification).toBe("PASS");
    expect(result.validation.federationRoutingValid).toBe(true);
  });

  it("blocks cross-tenant traffic and routing", () => {
    const traffic = sealTruthNetworkGovernance(baseNetworkInput({ crossTenantTrafficDetected: true }));
    const routing = sealTruthNetworkGovernance(baseNetworkInput({
      routingScope: "FEDERATION",
      crossTenantRoutingDetected: true,
    }));

    expect(traffic.governance.network_action).toBe("DENY");
    expect(traffic.certification).toBe("FAIL");
    expect(routing.governance.network_action).toBe("DENY");
    expect(routing.certification).toBe("FAIL");
  });

  it("fails network replay mismatch", () => {
    const result = sealTruthNetworkGovernance(baseNetworkInput({ replayMismatchDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthNetworkGovernance(baseNetworkInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
  });

  it("fails closed when control behavior is requested", () => {
    const result = sealTruthNetworkGovernance(baseNetworkInput({
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
