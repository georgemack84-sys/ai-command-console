import { describe, expect, it } from "vitest";

import { coordinateRecoveryReplay } from "../../../services/recovery/recoveryReplayCoordinator";
import { createSecurityContext } from "../../../services/security/securityContext";
import { createTenantContext } from "../../../services/tenancy/tenantContext";

describe("replay recovery flow", () => {
  it("allows governed replay recovery when replay truth is verified", async () => {
    const tenantContext = createTenantContext({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      source: "test",
    });
    const securityContext = createSecurityContext({
      actorId: "admin-1",
      actorRole: "admin",
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      permissions: ["recovery:replay", "recovery:verify", "recovery:supervise"],
      source: "test",
    });

    const result = await coordinateRecoveryReplay({
      executionId: "exec-1",
      tenantContext,
      securityContext,
      ledgerEvents: [
        { sequence: 1, eventType: "execution.started", eventPayload: { checkpointState: "running" } },
        { sequence: 2, eventType: "execution.failed", eventPayload: { checkpointState: "failed" } },
      ],
      historicalState: {
        runtimeState: "failed",
      },
      continuitySnapshots: [
        { snapshotId: "snapshot-1", runtimeState: "DEGRADED", timestamp: "2026-05-08T12:00:00.000Z" },
      ],
      auditEvents: [{ type: "RECOVERY_APPROVED" }],
      activeRecoveryActions: [],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.replayVerification.verified).toBe(true);
      expect(result.data.governance.approved).toBe(true);
    }
  });
});
