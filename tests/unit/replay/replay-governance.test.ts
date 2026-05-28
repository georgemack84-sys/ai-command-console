import { describe, expect, it } from "vitest";

import { evaluateReplayGovernance } from "../../../services/replay/replayGovernance";
import { createSecurityContext } from "../../../services/security/securityContext";
import { createTenantContext } from "../../../services/tenancy/tenantContext";

const tenantContext = createTenantContext({
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  source: "test",
});

describe("replay governance", () => {
  it("blocks replay without required permission", async () => {
    const securityContext = createSecurityContext({
      actorId: "viewer-1",
      actorRole: "viewer",
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      permissions: ["execution:read"],
      source: "test",
    });

    const result = await evaluateReplayGovernance({
      executionId: "exec-1",
      tenantContext,
      securityContext,
      action: "replay",
      replayVerification: {
        ok: true,
        data: {
          verified: true,
          deterministic: true,
          confidence: { score: 92, confidenceLevel: "VERIFIED", deterministic: true, riskFactors: [], verifiedEvidence: [], warnings: [] },
          divergences: [],
        },
      },
    });

    expect(result.ok).toBe(false);
  });

  it("blocks conflicting recovery actions and disputed replay", async () => {
    const securityContext = createSecurityContext({
      actorId: "admin-1",
      actorRole: "admin",
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      permissions: ["recovery:replay", "recovery:override", "recovery:quarantine"],
      source: "test",
    });

    const result = await evaluateReplayGovernance({
      executionId: "exec-1",
      tenantContext,
      securityContext,
      action: "replay",
      activeRecoveryActions: ["rollback"],
      replayVerification: {
        ok: true,
        data: {
          verified: false,
          deterministic: false,
          confidence: { score: 15, confidenceLevel: "UNTRUSTED", deterministic: false, riskFactors: ["STATE_DIVERGENCE"], verifiedEvidence: [], warnings: [] },
          divergences: [{ category: "STATE_DIVERGENCE", severity: "CRITICAL", requiresEscalation: true }],
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_GOVERNANCE_BLOCKED");
    }
  });
});
