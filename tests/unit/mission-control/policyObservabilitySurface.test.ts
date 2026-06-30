import { describe, expect, it } from "vitest";
import {
  buildTruthPolicyObservabilityRequest,
  sealTruthPolicyObservabilitySurface,
} from "@/services/mission-control";
import type {
  TruthPolicyObservabilityEventType,
  TruthPolicyObservabilityInput,
} from "@/services/mission-control";

function baseInput(
  eventType: TruthPolicyObservabilityEventType = "POLICY_EVALUATION",
  overrides: Partial<TruthPolicyObservabilityInput> = {},
): TruthPolicyObservabilityInput {
  return {
    request: buildTruthPolicyObservabilityRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T22:00:00.000Z",
    }),
    missionId: "mission-alpha",
    eventId: `event-${eventType.toLowerCase()}`,
    eventType,
    policyId: "policy-alpha",
    authorityId: "authority-alpha",
    replayReference: {
      replay_id: "replay-alpha",
      replay_bundle_id: "bundle-alpha",
      replay_hash: "replay-hash-alpha",
      replay_status: "REPRODUCED",
    },
    explanation: {
      what_happened: `${eventType} became visible to governance operators.`,
      why: "The event was recorded with policy, authority, replay, and evidence context.",
      policy_id: "policy-alpha",
      authority_id: "authority-alpha",
      evidence_references: ["evidence-alpha"],
    },
    details: {
      requested_action: "tool.execute",
      violation_type: eventType,
      violation_severity: "HIGH",
      violation_source: "agent-alpha",
      containment_trigger: "policy boundary",
      containment_target: "agent-alpha",
      containment_scope: "tenant-alpha",
      filesystem_path: "C:/tenant-alpha/secret.txt",
      filesystem_permission: "write",
      filesystem_containment_status: "contained",
      network_domain: "example.invalid",
      network_ip: "192.0.2.10",
      network_cidr: "192.0.2.0/24",
      network_protocol: "https",
      network_routing_outcome: "denied",
      capability_agent_id: "agent-alpha",
      capability_requested: "network.egress",
      capability_trust_status: "denied",
      evaluation_input: "governed request",
      evaluation_output: "DENY",
      authority_type: "GOVERNANCE_ENGINE",
      authority_scope: "POLICY_OBSERVABILITY",
      authority_decision: "DENY",
      authority_rationale: "Authority denied the governed action.",
    },
    dashboardTypes: [
      "POLICY_DASHBOARD",
      "VIOLATION_DASHBOARD",
      "CONTAINMENT_DASHBOARD",
      "AUTHORITY_DASHBOARD",
      "TENANT_DASHBOARD",
    ],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("policyObservabilitySurface", () => {
  it("exposes policy evaluation visibility deterministically", () => {
    const first = sealTruthPolicyObservabilitySurface(baseInput());
    const second = sealTruthPolicyObservabilitySurface(baseInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.reasonCodes).toContain("POLICY_EVALUATION_VISIBLE");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("fails hidden policy evaluations", () => {
    const result = sealTruthPolicyObservabilitySurface(baseInput("POLICY_EVALUATION", {
      hiddenEvaluationDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.evaluationVisible).toBe(false);
    expect(result.validation.reasonCodes).toContain("POLICY_EVALUATION_HIDDEN");
  });

  it("exposes policy violations and fails hidden violations", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("POLICY_VIOLATION"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("POLICY_VIOLATION", {
      hiddenViolationDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("POLICY_VIOLATION_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("POLICY_VIOLATION_HIDDEN");
  });

  it("exposes denied actions and fails hidden denied actions", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("DENIED_ACTION"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("DENIED_ACTION", {
      hiddenDeniedActionDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("DENIED_ACTION_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("DENIED_ACTION_HIDDEN");
  });

  it("exposes containment and fails hidden containment", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("CONTAINMENT_ACTION"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("CONTAINMENT_ACTION", {
      hiddenContainmentDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("CONTAINMENT_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("CONTAINMENT_HIDDEN");
  });

  it("exposes filesystem violations and fails hidden filesystem violations", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("FILESYSTEM_VIOLATION"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("FILESYSTEM_VIOLATION", {
      hiddenFilesystemViolationDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("FILESYSTEM_VIOLATION_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("FILESYSTEM_VIOLATION_HIDDEN");
  });

  it("exposes network violations and fails hidden network violations", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("NETWORK_VIOLATION"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("NETWORK_VIOLATION", {
      hiddenNetworkViolationDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("NETWORK_VIOLATION_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("NETWORK_VIOLATION_HIDDEN");
  });

  it("exposes capability violations and fails hidden capability violations", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("CAPABILITY_VIOLATION"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("CAPABILITY_VIOLATION", {
      hiddenCapabilityViolationDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("CAPABILITY_VIOLATION_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("CAPABILITY_VIOLATION_HIDDEN");
  });

  it("exposes authority involvement and fails hidden authority", () => {
    const visible = sealTruthPolicyObservabilitySurface(baseInput("AUTHORITY_EVENT"));
    const hidden = sealTruthPolicyObservabilitySurface(baseInput("AUTHORITY_EVENT", {
      hiddenAuthorityDetected: true,
    }));

    expect(visible.certification).toBe("PASS");
    expect(visible.validation.reasonCodes).toContain("AUTHORITY_VISIBLE");
    expect(hidden.certification).toBe("FAIL");
    expect(hidden.validation.reasonCodes).toContain("AUTHORITY_HIDDEN");
  });

  it("requires explanations", () => {
    const result = sealTruthPolicyObservabilitySurface(baseInput("DENIED_ACTION", {
      missingExplanationDetected: true,
      explanation: {
        what_happened: "",
        why: "",
        policy_id: "policy-alpha",
        authority_id: "authority-alpha",
        evidence_references: [],
      },
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("EXPLANATION_MISSING");
  });

  it("requires replay integration", () => {
    const available = sealTruthPolicyObservabilitySurface(baseInput());
    const missing = sealTruthPolicyObservabilitySurface(baseInput("POLICY_EVALUATION", {
      missingReplayLinkDetected: true,
      replayReference: {
        replay_id: "",
        replay_bundle_id: "",
        replay_hash: "",
        replay_status: "UNREPLAYABLE",
      },
    }));

    expect(available.certification).toBe("PASS");
    expect(available.validation.reasonCodes).toContain("REPLAY_LINK_AVAILABLE");
    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.reasonCodes).toContain("REPLAY_LINK_MISSING");
  });

  it("fails dashboard outages", () => {
    const result = sealTruthPolicyObservabilitySurface(baseInput("POLICY_VIOLATION", {
      dashboardUnavailableDetected: true,
      dashboardTypes: [],
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.dashboardAvailable).toBe(false);
    expect(result.validation.reasonCodes).toContain("DASHBOARD_UNAVAILABLE");
  });

  it("blocks cross-tenant visibility", () => {
    const result = sealTruthPolicyObservabilitySurface(baseInput("NETWORK_VIOLATION", {
      accessTenantId: "tenant-beta",
      crossTenantObservabilityAccessDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
    expect(result.validation.reasonCodes).toContain("TENANT_OBSERVABILITY_ISOLATION_FAILED");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthPolicyObservabilitySurface(baseInput("POLICY_EVALUATION", {
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when observability tries to become a control surface", () => {
    const result = sealTruthPolicyObservabilitySurface(baseInput("POLICY_EVALUATION", {
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
