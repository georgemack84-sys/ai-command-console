import { describe, expect, it } from "vitest";

import { runRecoverySimulation } from "../../../../services/recovery/simulation/recoverySimulationRunner";
import { createSecurityContext } from "../../../../services/security/securityContext";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

function buildSecurityContext() {
  return createSecurityContext({
    actorId: "admin-1",
    actorRole: "admin",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    permissions: ["recovery:verify", "recovery:replay", "recovery:supervise", "recovery:quarantine"],
    source: "test",
  });
}

describe("recovery simulation runner", () => {
  it("completes a crash recovery simulation deterministically", async () => {
    const result = await runRecoverySimulation({
      request: {
        simulationId: "sim-1",
        executionId: "exec-1",
        scenarioType: "CRASH_RECOVERY",
        dryRun: true,
        createdAt: "2026-05-08T12:00:00.000Z",
      },
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: buildSecurityContext(),
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

    expect(result.outcome === "RECOVERY_VALID" || result.outcome === "RECOVERY_VALID_WITH_WARNINGS").toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.productionMutationAllowed).toBe(false);
  });

  it("marks replay divergence as disputed", async () => {
    const result = await runRecoverySimulation({
      request: {
        simulationId: "sim-2",
        executionId: "exec-2",
        scenarioType: "REPLAY_RECOVERY",
        dryRun: true,
        createdAt: "2026-05-08T12:00:00.000Z",
      },
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: buildSecurityContext(),
      replayInputs: {
        ledgerEvents: [
          { sequence: 1, eventType: "execution.started", eventPayload: { checkpointState: "running" } },
          { sequence: 2, eventType: "execution.completed", eventPayload: { checkpointState: "completed", outputHash: "hash-2" } },
        ],
        historicalState: { runtimeState: "failed", outputHash: "hash-x" },
        continuitySnapshots: [{ snapshotId: "snapshot-1", runtimeState: "CONTINUITY_RISK", timestamp: "2026-05-08T12:00:00.000Z" }],
        auditEvents: [{ type: "RECOVERY_APPROVED" }],
      },
      continuityInputs: {
        checkpointState: "completed",
      },
      approvalState: "approved",
    });

    expect(result.outcome).toBe("REPLAY_DIVERGENCE_DETECTED");
    expect(result.disputes.length).toBeGreaterThan(0);
  });
});
