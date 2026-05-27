import { describe, expect, it } from "vitest";

import { validateStartupContinuity } from "@/services/startup/startupContinuityValidation";

const now = "2026-05-23T00:00:00.000Z";

function completeBackup(tenantId = "tenant-a", workspaceId = "workspace-a") {
  return {
    manifest: {
      tenantId,
      workspaceId,
      generatedAt: now,
      completeness: "complete",
    },
  };
}

function validScope(tenantId = "tenant-a", workspaceId = "workspace-a") {
  return {
    tenantId,
    workspaceId,
    latestBackup: completeBackup(tenantId, workspaceId),
    integrity: { ok: true, data: { ready: true, issues: [], continuity: { ledgerOrdered: true, orphanFree: true, replayConsistent: true } } },
    restore: { ok: true, data: { readiness: "verified", issues: [] } },
  };
}

describe("startup continuity", () => {
  it("rejects an empty continuity scope registry", async () => {
    const result = await validateStartupContinuity({ scopes: [] });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_CONTINUITY_UNVERIFIED");
  });

  it("passes when required production scopes are present and valid", async () => {
    const result = await validateStartupContinuity({
      scopes: [validScope("system", "default")],
      requiredScopes: [{ tenantId: "system", workspaceId: "default" }],
      now,
    });

    expect(result.ok).toBe(true);
  });

  it("blocks startup when a required production scope is missing", async () => {
    const result = await validateStartupContinuity({
      scopes: [validScope("tenant-a", "workspace-a")],
      requiredScopes: [{ tenantId: "system", workspaceId: "default" }],
      now,
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_CONTINUITY_UNVERIFIED");
  });

  it("blocks disputed continuity", async () => {
    const result = await validateStartupContinuity({
      scopes: [
        {
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          latestBackup: null,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_CONTINUITY_UNVERIFIED");
  });

  it("blocks failed restore simulation", async () => {
    const result = await validateStartupContinuity({
      scopes: [
        {
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          latestBackup: {
            manifest: {
              tenantId: "tenant-a",
              workspaceId: "workspace-a",
              generatedAt: now,
              completeness: "complete",
            },
          },
          integrity: { ok: true, data: { ready: true, issues: [], continuity: { ledgerOrdered: true, orphanFree: true, replayConsistent: true } } },
          restore: { ok: false, error: { code: "STARTUP_RESTORE_SIMULATION_FAILED", message: "blocked" } },
        },
      ],
      now,
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_RESTORE_SIMULATION_FAILED");
  });

  it("blocks replay uncertainty and tenant mismatch", async () => {
    const result = await validateStartupContinuity({
      scopes: [
        {
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          latestBackup: {
            manifest: {
              tenantId: "tenant-a",
              workspaceId: "workspace-a",
              generatedAt: now,
              completeness: "complete",
            },
          },
          integrity: { ok: true, data: { ready: true, issues: [], continuity: { ledgerOrdered: true, orphanFree: true, replayConsistent: false } } },
          restore: { ok: true, data: { readiness: "verified", issues: [] } },
        },
      ],
      now,
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_REPLAY_UNCERTAIN");
  });
});
