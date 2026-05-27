import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/auditTrail.js", () => ({
  appendAuditEvent: vi.fn((event: Record<string, unknown>) => ({
    id: "audit_1",
    timestamp: "2026-05-08T12:00:00.000Z",
    ...event,
  })),
}));

import { coordinateRecovery } from "../../services/recovery/recoveryCoordinator";
import { createTenantContext } from "../../services/tenancy/tenantContext";
import { createSecurityContext } from "../../services/security/securityContext";
import { resetStartupStatusForTests, freezeStartupStatus } from "../../services/startup/startupStatus";

function buildSecurityContext() {
  return createSecurityContext({
    actorId: "operator-1",
    actorRole: "operator",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    permissions: ["failure:classify", "recovery:supervise", "failure:audit"],
    source: "session",
  });
}

describe("recovery coordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStartupStatusForTests();
  });

  it("blocks recovery when startup governance is unknown", async () => {
    const result = await coordinateRecovery({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: buildSecurityContext(),
      signal: { type: "timeout" },
      sources: { evidence: ["timeout:step_duration_exceeded"] },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: "STARTUP_GOVERNANCE_UNKNOWN",
        }),
      }),
    );
  });

  it("blocks recovery without classification evidence", async () => {
    freezeStartupStatus({
      ready: true,
      checkedAt: "2026-05-08T12:00:00.000Z",
      summary: "ready",
    });

    const result = await coordinateRecovery({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: buildSecurityContext(),
      signal: { type: "timeout" },
      sources: { evidence: [] },
    });

    expect(result.ok).toBe(false);
  });

  it("blocks catastrophic failures from automatic recovery", async () => {
    freezeStartupStatus({
      ready: true,
      checkedAt: "2026-05-08T12:00:00.000Z",
      summary: "ready",
    });

    const result = await coordinateRecovery({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: buildSecurityContext(),
      signal: { type: "evidence inconsistency" },
      sources: { evidence: ["timeline:disputed", "evidence:immutable_conflict"] },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: "FAILURE_RECOVERY_CATASTROPHIC_BLOCKED",
        }),
      }),
    );
  });

  it("requires approval renewal for expired approval classifications", async () => {
    freezeStartupStatus({
      ready: true,
      checkedAt: "2026-05-08T12:00:00.000Z",
      summary: "ready",
    });

    const result = await coordinateRecovery({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: buildSecurityContext(),
      signal: { type: "approval expiration" },
      sources: { evidence: ["approval:expired", "recovery_control:approval_required"] },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          approvalRequired: true,
          classification: expect.objectContaining({
            category: "approval expiration",
          }),
        }),
      }),
    );
  });
});
