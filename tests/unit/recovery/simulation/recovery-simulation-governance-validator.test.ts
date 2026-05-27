import { describe, expect, it } from "vitest";

import { validateRecoverySimulationGovernance } from "../../../../services/recovery/simulation/recoverySimulationGovernanceValidator";
import { createSecurityContext } from "../../../../services/security/securityContext";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

describe("recovery simulation governance validator", () => {
  it("fails closed on missing security context", async () => {
    const result = await validateRecoverySimulationGovernance({
      executionId: "exec-1",
      scenarioType: "CRASH_RECOVERY",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      replayValidation: {
        ok: true,
        data: {
          verified: true,
          deterministic: true,
          divergences: [],
          confidence: {
            score: 90,
            deterministic: true,
            confidenceLevel: "VERIFIED",
            riskFactors: [],
            verifiedEvidence: ["ledger:present"],
            warnings: [],
          },
        },
      },
      approvalState: "approved",
    });

    expect(result.ok).toBe(false);
  });

  it("blocks approval timeout through governance validation", async () => {
    const result = await validateRecoverySimulationGovernance({
      executionId: "exec-1",
      scenarioType: "APPROVAL_TIMEOUT_RECOVERY",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: createSecurityContext({
        actorId: "admin-1",
        actorRole: "admin",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        permissions: ["recovery:verify", "recovery:replay", "recovery:rollback", "recovery:supervise"],
        source: "test",
      }),
      replayValidation: {
        ok: true,
        data: {
          verified: true,
          deterministic: true,
          divergences: [],
          confidence: {
            score: 90,
            deterministic: true,
            confidenceLevel: "VERIFIED",
            riskFactors: [],
            verifiedEvidence: ["ledger:present"],
            warnings: [],
          },
        },
      },
      approvalState: "expired",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RECOVERY_APPROVAL_REQUIRED");
    }
  });
});
