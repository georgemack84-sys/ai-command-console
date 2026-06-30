import { describe, expect, it } from "vitest";
import {
  buildTruthPolicyContractRequest,
  buildTruthPolicyLedgerRequest,
  buildTruthPolicyReplayRequest,
  sealTruthPolicyContract,
  sealTruthPolicyLedger,
  sealTruthPolicyReplayFramework,
} from "@/services/mission-control";
import type {
  SealedTruthPolicyContract,
  SealedTruthPolicyLedger,
  TruthPolicyAction,
  TruthPolicyReplayInput,
} from "@/services/mission-control";

function basePolicy(action: TruthPolicyAction = "ALLOW"): SealedTruthPolicyContract {
  return sealTruthPolicyContract({
    request: buildTruthPolicyContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T21:00:00.000Z",
    }),
    policyType: "GOVERNANCE_POLICY",
    policyName: `Replay ${action} Policy`,
    policyDescription: "Canonical policy used for replay framework certification.",
    policyScope: {
      scope_type: "TENANT",
      scope_id: "tenant-alpha",
      scope_description: "Tenant policy replay scope.",
    },
    policyVersion: "policy/v1",
    policyState: "ACTIVE",
    policyAction: action,
    policyPriority: 10,
    policyAuthority: {
      authority_id: "authority-alpha",
      authority_type: "GOVERNANCE_ENGINE",
      authority_scope: "POLICY_REPLAY",
      authority_timestamp: "2026-06-24T20:59:00.000Z",
      authority_evidence: ["authority-evidence-alpha"],
    },
    policyRules: [{
      rule_id: "rule-alpha",
      rule_condition: "mission.request == governed",
      rule_action: action,
      rule_priority: 1,
      rule_scope: "TENANT",
    }],
    replayReferenceIds: ["policy-replay-alpha"],
    accessTenantId: "tenant-alpha",
  });
}

function ledgerFor(policy: SealedTruthPolicyContract, eventType = "POLICY_EVALUATED"): SealedTruthPolicyLedger {
  return sealTruthPolicyLedger({
    request: buildTruthPolicyLedgerRequest({
      tenant_id: policy.policy.tenant_id,
      now: "2026-06-24T21:01:00.000Z",
    }),
    policyId: policy.policy.policy_id,
    missionId: "mission-alpha",
    eventType,
    actorId: "authority-alpha",
    actorType: "GOVERNANCE_ENGINE",
    rationale: "Policy replay evidence recorded for governance audit.",
    evidenceReferences: [{
      evidence_id: "evidence-alpha",
      evidence_type: "POLICY_EVALUATION",
      evidence_hash: "hash-alpha",
      evidence_scope: "tenant-alpha",
    }],
    replayReferences: [{
      replay_id: "replay-alpha",
      replay_bundle_id: "bundle-alpha",
      replay_hash: "replay-hash-alpha",
    }],
    evaluationResult: eventType === "POLICY_EVALUATED" ? policy.policy.policy_action : undefined,
    accessTenantId: policy.policy.tenant_id,
  });
}

function baseReplayInput(action: TruthPolicyAction = "ALLOW", overrides: Partial<TruthPolicyReplayInput> = {}): TruthPolicyReplayInput {
  const policy = overrides.policy ?? basePolicy(action);

  return {
    request: buildTruthPolicyReplayRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T21:02:00.000Z",
    }),
    policy,
    ledgerEntries: overrides.ledgerEntries ?? [ledgerFor(policy)],
    missionId: "mission-alpha",
    replayScope: "FULL_POLICY",
    evaluationResult: action,
    denialRationale: action === "DENY" ? "Action denied by governed policy violation." : undefined,
    approvalRationale: action === "ALLOW" || action === "ESCALATE" ? "Action allowed by active policy and authority approval." : undefined,
    containmentRationale: action === "CONTAIN" ? "Action contained due to policy boundary." : undefined,
    escalationPath: action === "ESCALATE" ? ["authority-alpha", "supervision-alpha"] : [],
    authorityId: "authority-alpha",
    authorityScope: "POLICY_REPLAY",
    explanation: {
      why_action: `${action} was reproduced from immutable policy and ledger evidence.`,
      policy_applied: policy.policy.policy_id,
      authority_involved: "authority-alpha",
      evidence_summary: "Policy replay evidence was complete.",
      evidence_references: ["policy-replay-alpha", "evidence-alpha"],
    },
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("policyReplayFramework", () => {
  it("reconstructs policy replay deterministically", () => {
    const first = sealTruthPolicyReplayFramework(baseReplayInput());
    const second = sealTruthPolicyReplayFramework(baseReplayInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.reasonCodes).toContain("ACTIVE_POLICY_RECONSTRUCTED");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("fails missing policy reconstruction", () => {
    const result = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", { missingPolicyDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.activePolicyReconstructed).toBe(false);
    expect(result.validation.reasonCodes).toContain("ACTIVE_POLICY_MISSING");
  });

  it("reproduces evaluation replay and fails mismatches", () => {
    const replayed = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW"));
    const mismatch = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", { evaluationMismatchDetected: true }));

    expect(replayed.certification).toBe("PASS");
    expect(replayed.validation.reasonCodes).toContain("EVALUATION_REPLAY_REPRODUCED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.validation.reasonCodes).toContain("EVALUATION_MISMATCH");
  });

  it("reconstructs denials and fails missing denial rationale", () => {
    const denial = sealTruthPolicyReplayFramework(baseReplayInput("DENY"));
    const missingRationale = sealTruthPolicyReplayFramework(baseReplayInput("DENY", {
      denialRationale: "",
      missingDenialRationaleDetected: true,
    }));

    expect(denial.certification).toBe("PASS");
    expect(denial.validation.reasonCodes).toContain("DENIAL_RECONSTRUCTED");
    expect(missingRationale.certification).toBe("FAIL");
    expect(missingRationale.validation.reasonCodes).toContain("DENIAL_RATIONALE_MISSING");
  });

  it("reconstructs allowances and fails missing approval rationale", () => {
    const allowance = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW"));
    const missingApproval = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
      approvalRationale: "",
      missingApprovalRationaleDetected: true,
    }));

    expect(allowance.certification).toBe("PASS");
    expect(allowance.validation.reasonCodes).toContain("ALLOWANCE_RECONSTRUCTED");
    expect(missingApproval.certification).toBe("FAIL");
    expect(missingApproval.validation.reasonCodes).toContain("APPROVAL_RATIONALE_MISSING");
  });

  it("reconstructs containment and fails missing containment rationale", () => {
    const containment = sealTruthPolicyReplayFramework(baseReplayInput("CONTAIN"));
    const missingContainment = sealTruthPolicyReplayFramework(baseReplayInput("CONTAIN", {
      containmentRationale: "",
      missingContainmentRationaleDetected: true,
    }));

    expect(containment.certification).toBe("PASS");
    expect(containment.validation.reasonCodes).toContain("CONTAINMENT_RECONSTRUCTED");
    expect(missingContainment.certification).toBe("FAIL");
    expect(missingContainment.validation.reasonCodes).toContain("CONTAINMENT_RATIONALE_MISSING");
  });

  it("reconstructs escalation paths and fails broken chains", () => {
    const escalation = sealTruthPolicyReplayFramework(baseReplayInput("ESCALATE"));
    const broken = sealTruthPolicyReplayFramework(baseReplayInput("ESCALATE", {
      escalationPath: [],
      brokenEscalationChainDetected: true,
    }));

    expect(escalation.certification).toBe("PASS");
    expect(escalation.validation.reasonCodes).toContain("ESCALATION_RECONSTRUCTED");
    expect(broken.certification).toBe("FAIL");
    expect(broken.validation.reasonCodes).toContain("ESCALATION_CHAIN_BROKEN");
  });

  it("reconstructs authority and fails authority mismatches", () => {
    const reconstructed = sealTruthPolicyReplayFramework(baseReplayInput());
    const mismatch = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
      authorityId: "authority-beta",
      authorityMismatchDetected: true,
    }));

    expect(reconstructed.certification).toBe("PASS");
    expect(reconstructed.validation.reasonCodes).toContain("AUTHORITY_RECONSTRUCTED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.validation.reasonCodes).toContain("AUTHORITY_MISMATCH");
  });

  it("generates explanations and fails missing explanations", () => {
    const explained = sealTruthPolicyReplayFramework(baseReplayInput());
    const missingExplanation = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
      missingExplanationDetected: true,
      explanation: {
        why_action: "",
        policy_applied: "",
        authority_involved: "",
        evidence_summary: "",
        evidence_references: [],
      },
    }));

    expect(explained.certification).toBe("PASS");
    expect(explained.validation.reasonCodes).toContain("EXPLANATION_GENERATED");
    expect(missingExplanation.certification).toBe("FAIL");
    expect(missingExplanation.validation.reasonCodes).toContain("EXPLANATION_MISSING");
  });

  it("assembles replay bundles and fails incomplete bundles", () => {
    const assembled = sealTruthPolicyReplayFramework(baseReplayInput());
    const incomplete = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
      incompleteBundleDetected: true,
    }));

    expect(assembled.certification).toBe("PASS");
    expect(assembled.reconstructionBundle.bundle_status).toBe("ASSEMBLED");
    expect(incomplete.certification).toBe("FAIL");
    expect(incomplete.validation.reasonCodes).toContain("BUNDLE_INCOMPLETE");
  });

  it("blocks cross-tenant replay access", () => {
    const result = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
      accessTenantId: "tenant-beta",
      crossTenantReplayAccessDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
    expect(result.validation.reasonCodes).toContain("TENANT_REPLAY_ISOLATION_FAILED");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when replay tries to become a control surface", () => {
    const result = sealTruthPolicyReplayFramework(baseReplayInput("ALLOW", {
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
