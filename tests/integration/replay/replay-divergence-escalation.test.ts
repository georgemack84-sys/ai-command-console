import { describe, expect, it } from "vitest";

import { coordinateRecoveryReplay } from "../../../services/recovery/recoveryReplayCoordinator";
import { createSecurityContext } from "../../../services/security/securityContext";
import { createTenantContext } from "../../../services/tenancy/tenantContext";

describe("replay divergence escalation", () => {
  it("quarantines non-deterministic replay and blocks recovery", async () => {
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
      permissions: ["recovery:replay", "recovery:verify", "recovery:quarantine", "recovery:supervise"],
      source: "test",
    });

    const result = await coordinateRecoveryReplay({
      executionId: "exec-1",
      tenantContext,
      securityContext,
      ledgerEvents: [
        { sequence: 1, eventType: "execution.started", eventPayload: { checkpointState: "running", outputHash: "hash-1" } },
        { sequence: 2, eventType: "execution.completed", eventPayload: { checkpointState: "completed", outputHash: "hash-2" } },
      ],
      historicalState: {
        runtimeState: "failed",
        outputHash: "hash-9",
      },
      continuitySnapshots: [
        { snapshotId: "snapshot-1", runtimeState: "CONTINUITY_RISK", timestamp: "2026-05-08T12:00:00.000Z" },
      ],
      auditEvents: [{ type: "RECOVERY_APPROVED" }],
      activeRecoveryActions: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_GOVERNANCE_BLOCKED");
    }
  });
});
