import { describe, expect, it } from "vitest";
import {
  buildTruthPolicyCertificationRequest,
  sealTruthPolicyCertificationGate,
} from "@/services/mission-control";
import type {
  SealedTruthCapabilityGovernance,
  SealedTruthEnforcementLayer,
  SealedTruthFilesystemGovernance,
  SealedTruthNetworkGovernance,
  SealedTruthPolicyContract,
  SealedTruthPolicyLedger,
  SealedTruthPolicyObservabilitySurface,
  SealedTruthPolicyReplayFramework,
  SealedTruthRuntimePolicyEngine,
  TruthCertificationState,
  TruthPolicyCertificationInput,
  TruthPolicyCertificationScope,
} from "@/services/mission-control";

const scopes: readonly TruthPolicyCertificationScope[] = [
  "POLICY_CONTRACT",
  "FILESYSTEM_GOVERNANCE",
  "NETWORK_GOVERNANCE",
  "CAPABILITY_GOVERNANCE",
  "RUNTIME_POLICY_ENGINE",
  "ENFORCEMENT_LAYER",
  "POLICY_LEDGER",
  "POLICY_REPLAY_FRAMEWORK",
  "POLICY_OBSERVABILITY_SURFACE",
  "GOVERNANCE_COMPLIANCE",
  "CONSTITUTIONAL_COMPLIANCE",
  "TENANT_ISOLATION",
];

function sealedDomain<T>(certification: TruthCertificationState = "PASS"): T {
  return {
    certification,
    validation: {
      valid: certification !== "FAIL",
      tenantIsolationValid: certification !== "FAIL",
      failClosed: true,
    },
    sealed: true,
    readOnly: true,
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  } as unknown as T;
}

function baseInput(overrides: Partial<TruthPolicyCertificationInput> = {}): TruthPolicyCertificationInput {
  return {
    request: buildTruthPolicyCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T23:00:00.000Z",
    }),
    policyLayerVersion: "6G.10",
    certificationScope: scopes,
    certificationAuthority: {
      authority_id: "certification-authority-alpha",
      authority_type: "CERTIFICATION_ENGINE",
      authority_scope: "POLICY_LAYER_CERTIFICATION",
      authority_evidence: ["authority-evidence-alpha"],
    },
    evidenceReferences: ["evidence-policy-layer-alpha"],
    replayReferences: ["replay-policy-layer-alpha"],
    policyContract: sealedDomain<SealedTruthPolicyContract>(),
    filesystemGovernance: sealedDomain<SealedTruthFilesystemGovernance>(),
    networkGovernance: sealedDomain<SealedTruthNetworkGovernance>(),
    capabilityGovernance: sealedDomain<SealedTruthCapabilityGovernance>(),
    runtimePolicyEngine: sealedDomain<SealedTruthRuntimePolicyEngine>(),
    enforcementLayer: sealedDomain<SealedTruthEnforcementLayer>(),
    policyLedger: sealedDomain<SealedTruthPolicyLedger>(),
    policyReplay: sealedDomain<SealedTruthPolicyReplayFramework>(),
    policyObservability: sealedDomain<SealedTruthPolicyObservabilitySurface>(),
    ...overrides,
  };
}

describe("policyCertificationGate", () => {
  it("certifies the full policy layer deterministically", () => {
    const first = sealTruthPolicyCertificationGate(baseInput());
    const second = sealTruthPolicyCertificationGate(baseInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.advancementState).toBe("POLICY_LAYER_CERTIFIED");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("passes authorized filesystem access and fails unauthorized filesystem access", () => {
    const authorized = sealTruthPolicyCertificationGate(baseInput());
    const unauthorized = sealTruthPolicyCertificationGate(baseInput({
      unauthorizedFilesystemAccessDetected: true,
    }));

    expect(authorized.validation.reasonCodes).toContain("AUTHORIZED_FILESYSTEM_ACCESS_CERTIFIED");
    expect(unauthorized.certification).toBe("FAIL");
    expect(unauthorized.validation.filesystemGovernanceCertified).toBe(false);
    expect(unauthorized.validation.reasonCodes).toContain("UNAUTHORIZED_FILESYSTEM_ACCESS_DETECTED");
  });

  it("passes authorized network access and fails unauthorized network access", () => {
    const authorized = sealTruthPolicyCertificationGate(baseInput());
    const unauthorized = sealTruthPolicyCertificationGate(baseInput({
      unauthorizedNetworkAccessDetected: true,
    }));

    expect(authorized.validation.reasonCodes).toContain("AUTHORIZED_NETWORK_ACCESS_CERTIFIED");
    expect(unauthorized.certification).toBe("FAIL");
    expect(unauthorized.validation.networkGovernanceCertified).toBe(false);
    expect(unauthorized.validation.reasonCodes).toContain("UNAUTHORIZED_NETWORK_ACCESS_DETECTED");
  });

  it("passes approved tool use and fails prohibited tool use", () => {
    const approved = sealTruthPolicyCertificationGate(baseInput());
    const prohibited = sealTruthPolicyCertificationGate(baseInput({
      prohibitedToolUseDetected: true,
    }));

    expect(approved.validation.reasonCodes).toContain("APPROVED_TOOL_USE_CERTIFIED");
    expect(prohibited.certification).toBe("FAIL");
    expect(prohibited.validation.capabilityGovernanceCertified).toBe(false);
    expect(prohibited.validation.reasonCodes).toContain("PROHIBITED_TOOL_USE_DETECTED");
  });

  it("enforces authority validation", () => {
    const enforced = sealTruthPolicyCertificationGate(baseInput());
    const bypassed = sealTruthPolicyCertificationGate(baseInput({
      authorityBypassDetected: true,
    }));

    expect(enforced.validation.reasonCodes).toContain("AUTHORITY_VALIDATION_ENFORCED");
    expect(bypassed.certification).toBe("FAIL");
    expect(bypassed.validation.runtimePolicyEngineCertified).toBe(false);
    expect(bypassed.validation.reasonCodes).toContain("AUTHORITY_VALIDATION_BYPASSED");
  });

  it("enforces governance validation", () => {
    const enforced = sealTruthPolicyCertificationGate(baseInput());
    const bypassed = sealTruthPolicyCertificationGate(baseInput({
      governanceBypassDetected: true,
    }));

    expect(enforced.validation.reasonCodes).toContain("GOVERNANCE_VALIDATION_ENFORCED");
    expect(bypassed.certification).toBe("FAIL");
    expect(bypassed.validation.governanceComplianceVerified).toBe(false);
    expect(bypassed.validation.reasonCodes).toContain("GOVERNANCE_VALIDATION_BYPASSED");
  });

  it("certifies valid policy replay and fails replay mismatches", () => {
    const valid = sealTruthPolicyCertificationGate(baseInput());
    const mismatch = sealTruthPolicyCertificationGate(baseInput({
      replayMismatchDetected: true,
    }));

    expect(valid.validation.policyReplayCertified).toBe(true);
    expect(valid.validation.reasonCodes).toContain("POLICY_REPLAY_CERTIFIED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.validation.reasonCodes).toContain("CERTIFICATION_REPLAY_MISMATCH");
  });

  it("preserves tenant isolation and fails cross-tenant contamination", () => {
    const preserved = sealTruthPolicyCertificationGate(baseInput());
    const failed = sealTruthPolicyCertificationGate(baseInput({
      crossTenantAccessDetected: true,
    }));

    expect(preserved.validation.tenantIsolationCertified).toBe(true);
    expect(preserved.validation.reasonCodes).toContain("TENANT_ISOLATION_CERTIFIED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.advancementState).toBe("POLICY_LAYER_FAILED");
    expect(failed.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("fails policy bypass detection", () => {
    const result = sealTruthPolicyCertificationGate(baseInput({
      policyBypassDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.runtimePolicyEngineCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("POLICY_BYPASS_DETECTED");
  });

  it("fails hidden policy state", () => {
    const result = sealTruthPolicyCertificationGate(baseInput({
      hiddenPolicyStateDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.policyObservabilityCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("HIDDEN_POLICY_STATE_DETECTED");
  });

  it("fails missing certification contract evidence", () => {
    const result = sealTruthPolicyCertificationGate(baseInput({
      evidenceReferences: [],
      replayReferences: [],
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.contractValid).toBe(false);
    expect(result.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_MISSING");
    expect(result.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
  });

  it("allows conditional pass for documented non-critical observability gaps", () => {
    const result = sealTruthPolicyCertificationGate(baseInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.advancementState).toBe("POLICY_LAYER_CONDITIONAL");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails constitutional violations and authority expansion", () => {
    const constitutional = sealTruthPolicyCertificationGate(baseInput({
      constitutionalViolationDetected: true,
    }));
    const authorityExpansion = sealTruthPolicyCertificationGate(baseInput({
      authorityExpansionDetected: true,
    }));

    expect(constitutional.certification).toBe("FAIL");
    expect(constitutional.validation.reasonCodes).toContain("CONSTITUTIONAL_COMPLIANCE_FAILED");
    expect(authorityExpansion.certification).toBe("FAIL");
    expect(authorityExpansion.validation.authorityBounded).toBe(false);
    expect(authorityExpansion.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("fails closed when certification tries to become a control surface", () => {
    const result = sealTruthPolicyCertificationGate(baseInput({
      executionRequested: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
