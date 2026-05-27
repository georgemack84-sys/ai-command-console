import { describe, expect, it } from "vitest";

import { runRecoverySimulation } from "../../../../services/recovery/simulation/recoverySimulationRunner";
import { createSecurityContext } from "../../../../services/security/securityContext";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

describe("recovery simulation flow", () => {
  it("runs a valid dry-run crash recovery simulation end to end", async () => {
    const result = await runRecoverySimulation({
      request: {
        simulationId: "sim-flow-1",
        executionId: "exec-flow-1",
        scenarioType: "CRASH_RECOVERY",
        dryRun: true,
        createdAt: "2026-05-08T12:00:00.000Z",
      },
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
        permissions: ["recovery:verify", "recovery:replay", "recovery:supervise", "recovery:quarantine"],
        source: "test",
      }),
      replayInputs: {
        ledgerEvents: [
          { sequence: 1, eventType: "execution.started", eventPayload: { checkpointState: "running" } },
          { sequence: 2, eventType: "execution.failed", eventPayload: { checkpointState: "failed" } },
        ],
        historicalState: { runtimeState: "failed" },
        continuitySnapshots: [{ snapshotId: "snapshot-1", runtimeState: "DEGRADED", timestamp: "2026-05-08T12:00:00.000Z" }],
        auditEvents: [{ type: "RECOVERY_APPROVED" }],
      },
      continuityInputs: {
        checkpointState: "failed",
      },
      approvalState: "approved",
    });

    expect(result.evidenceIds.length).toBeGreaterThan(0);
    expect(result.auditEventIds.length).toBeGreaterThan(0);
  });
});
