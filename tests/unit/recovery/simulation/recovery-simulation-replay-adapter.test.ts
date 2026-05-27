import { describe, expect, it } from "vitest";

import { runRecoverySimulationReplayAdapter } from "../../../../services/recovery/simulation/recoverySimulationReplayAdapter";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

describe("recovery simulation replay adapter", () => {
  it("reuses replay verification and surfaces divergence deterministically", async () => {
    const result = await runRecoverySimulationReplayAdapter({
      executionId: "exec-1",
      scenarioType: "REPLAY_RECOVERY",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      replayInputs: {
        ledgerEvents: [
          { sequence: 1, eventType: "execution.started", eventPayload: { checkpointState: "running" } },
          { sequence: 2, eventType: "execution.completed", eventPayload: { checkpointState: "completed", outputHash: "hash-2" } },
        ],
        historicalState: {
          runtimeState: "failed",
          outputHash: "hash-x",
        },
        continuitySnapshots: [{ snapshotId: "snapshot-1", runtimeState: "CONTINUITY_RISK", timestamp: "2026-05-08T12:00:00.000Z" }],
        auditEvents: [{ type: "RECOVERY_APPROVED" }],
      },
    });

    expect(result.replayDeterministic).toBe(true);
    expect(result.divergenceDetected).toBe(true);
    expect(result.disputes.length).toBeGreaterThan(0);
  });
});
