import { describe, expect, it } from "vitest";
import {
  buildTruthFilesystemGovernanceRequest,
  buildTruthPolicyContractRequest,
  sealTruthFilesystemGovernance,
  sealTruthPolicyContract,
} from "@/services/mission-control";
import type { TruthFilesystemGovernanceInput } from "@/services/mission-control";

function basePolicy(overrides: Record<string, unknown> = {}) {
  return sealTruthPolicyContract({
    request: buildTruthPolicyContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T15:00:00.000Z",
    }),
    policyType: "FILESYSTEM_POLICY",
    policyName: "Tenant Reports Filesystem Access",
    policyDescription: "Allows governed tenant report access and blocks restricted paths.",
    policyScope: {
      scope_type: "TENANT",
      scope_id: "tenant-alpha",
      scope_description: "Tenant filesystem boundary.",
    },
    policyVersion: "policy/v1",
    policyState: "ACTIVE",
    policyAction: "ALLOW",
    policyPriority: 1,
    policyAuthority: {
      authority_id: "governance-authority-alpha",
      authority_type: "GOVERNANCE_ENGINE",
      authority_scope: "FILESYSTEM_GOVERNANCE",
      authority_timestamp: "2026-06-24T14:59:00.000Z",
      authority_evidence: ["authority-evidence-alpha"],
    },
    policyRules: [{
      rule_id: "rule-filesystem-alpha",
      rule_condition: "path matches /data/tenant-alpha/reports/*",
      rule_action: "ALLOW",
      rule_priority: 1,
      rule_scope: "TENANT",
    }],
    replayReferenceIds: ["filesystem-policy-replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseFilesystemInput(overrides: Partial<TruthFilesystemGovernanceInput> = {}): TruthFilesystemGovernanceInput {
  return {
    request: buildTruthFilesystemGovernanceRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T15:01:00.000Z",
    }),
    policy: basePolicy(),
    filesystemScope: "FILE",
    requestPath: "/data/tenant-alpha/reports/june.md",
    pathPattern: "/data/tenant-alpha/reports/*",
    permissionType: "READ",
    quotaPolicy: {
      quota_status: "WITHIN_LIMIT",
      quota_limit_bytes: 1000,
      quota_used_bytes: 200,
      quota_scope: "tenant-alpha",
    },
    replayReferences: ["filesystem-replay-alpha"],
    accessTenantId: "tenant-alpha",
    authorized: true,
    ...overrides,
  };
}

describe("filesystemGovernance", () => {
  it("allows authorized read deterministically", () => {
    const first = sealTruthFilesystemGovernance(baseFilesystemInput());
    const second = sealTruthFilesystemGovernance(baseFilesystemInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.governance.filesystem_action).toBe("ALLOW");
    expect(first.validation.reasonCodes).toContain("READ_GOVERNANCE_OPERATIONAL");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("denies unauthorized read", () => {
    const result = sealTruthFilesystemGovernance(baseFilesystemInput({
      authorized: false,
      permissionType: "READ",
    }));

    expect(result.certification).toBe("PASS");
    expect(result.governance.filesystem_action).toBe("DENY");
    expect(result.validation.readGovernanceValid).toBe(true);
  });

  it("allows authorized write and denies unauthorized write", () => {
    const authorized = sealTruthFilesystemGovernance(baseFilesystemInput({
      permissionType: "WRITE",
    }));
    const unauthorized = sealTruthFilesystemGovernance(baseFilesystemInput({
      permissionType: "WRITE",
      authorized: false,
    }));

    expect(authorized.governance.filesystem_action).toBe("ALLOW");
    expect(authorized.certification).toBe("PASS");
    expect(unauthorized.governance.filesystem_action).toBe("DENY");
    expect(unauthorized.certification).toBe("PASS");
  });

  it("allows authorized execution and denies unauthorized execution", () => {
    const authorized = sealTruthFilesystemGovernance(baseFilesystemInput({
      permissionType: "EXECUTE",
    }));
    const unauthorized = sealTruthFilesystemGovernance(baseFilesystemInput({
      permissionType: "EXECUTE",
      authorized: false,
    }));

    expect(authorized.governance.filesystem_action).toBe("ALLOW");
    expect(authorized.certification).toBe("PASS");
    expect(unauthorized.governance.filesystem_action).toBe("DENY");
    expect(unauthorized.certification).toBe("PASS");
  });

  it("allows authorized mount and denies unauthorized mount", () => {
    const authorized = sealTruthFilesystemGovernance(baseFilesystemInput({
      filesystemScope: "MOUNT",
      permissionType: "MOUNT",
    }));
    const unauthorized = sealTruthFilesystemGovernance(baseFilesystemInput({
      filesystemScope: "MOUNT",
      permissionType: "MOUNT",
      authorized: false,
    }));

    expect(authorized.governance.filesystem_action).toBe("ALLOW");
    expect(authorized.certification).toBe("PASS");
    expect(unauthorized.governance.filesystem_action).toBe("DENY");
    expect(unauthorized.certification).toBe("PASS");
  });

  it("escalates external mount violations", () => {
    const result = sealTruthFilesystemGovernance(baseFilesystemInput({
      filesystemScope: "MOUNT",
      permissionType: "MOUNT",
      externalMountViolationDetected: true,
    }));

    expect(result.certification).toBe("PASS");
    expect(result.governance.filesystem_action).toBe("ESCALATE");
    expect(result.validation.mountGovernanceValid).toBe(true);
  });

  it("contains exceeded quota", () => {
    const result = sealTruthFilesystemGovernance(baseFilesystemInput({
      quotaPolicy: {
        quota_status: "EXCEEDED",
        quota_limit_bytes: 1000,
        quota_used_bytes: 1200,
        quota_scope: "tenant-alpha",
      },
    }));

    expect(result.certification).toBe("PASS");
    expect(result.governance.filesystem_action).toBe("CONTAIN");
    expect(result.validation.reasonCodes).toContain("QUOTA_EXCEEDED_CONTAINED");
  });

  it("denies restricted paths and escalates unknown paths", () => {
    const restricted = sealTruthFilesystemGovernance(baseFilesystemInput({
      requestPath: "/system/config.yaml",
      pathPattern: "/system/*",
      restrictedPathDetected: true,
    }));
    const unknown = sealTruthFilesystemGovernance(baseFilesystemInput({
      requestPath: "/unknown/path.txt",
      pathPattern: "/data/tenant-alpha/reports/*",
      unknownPathDetected: true,
    }));

    expect(restricted.governance.filesystem_action).toBe("DENY");
    expect(restricted.certification).toBe("PASS");
    expect(unknown.governance.filesystem_action).toBe("ESCALATE");
    expect(unknown.certification).toBe("PASS");
  });

  it("blocks cross-tenant read, write, and mount access", () => {
    const read = sealTruthFilesystemGovernance(baseFilesystemInput({
      crossTenantFilesystemAccessDetected: true,
    }));
    const write = sealTruthFilesystemGovernance(baseFilesystemInput({
      permissionType: "WRITE",
      crossTenantFilesystemAccessDetected: true,
    }));
    const mount = sealTruthFilesystemGovernance(baseFilesystemInput({
      permissionType: "MOUNT",
      filesystemScope: "MOUNT",
      crossTenantMountAccessDetected: true,
    }));

    expect(read.governance.filesystem_action).toBe("DENY");
    expect(read.certification).toBe("FAIL");
    expect(write.governance.filesystem_action).toBe("DENY");
    expect(write.certification).toBe("FAIL");
    expect(mount.governance.filesystem_action).toBe("DENY");
    expect(mount.certification).toBe("FAIL");
  });

  it("fails filesystem replay mismatch", () => {
    const result = sealTruthFilesystemGovernance(baseFilesystemInput({
      replayMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthFilesystemGovernance(baseFilesystemInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when control behavior is requested", () => {
    const result = sealTruthFilesystemGovernance(baseFilesystemInput({
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
