import { describe, expect, it } from "vitest";

import { runRecoverySimulation } from "../../../../services/recovery/simulation/recoverySimulationRunner";
import { createSecurityContext } from "../../../../services/security/securityContext";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

describe("recovery simulation replay divergence", () => {
  it("detects replay divergence and recommends escalation or containment", async () => {
    const result = await runRecoverySimulation({
      request: {
        simulationId: "sim-divergence-1",
        executionId: "exec-divergence-1",
        scenarioType: "REPLAY_RECOVERY",
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
    expect(["ESCALATE_TO_GOVERNANCE", "CONTAIN_RUNTIME"]).toContain(result.recommendedAction);
  });
});
