import { describe, expect, it } from "vitest";

import { runRecoverySimulation } from "../../../../services/recovery/simulation/recoverySimulationRunner";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

describe("recovery simulation governance block", () => {
  it("fails closed on missing security context", async () => {
    const result = await runRecoverySimulation({
      request: {
        simulationId: "sim-governance-1",
        executionId: "exec-governance-1",
        scenarioType: "APPROVAL_TIMEOUT_RECOVERY",
        dryRun: true,
        createdAt: "2026-05-08T12:00:00.000Z",
      },
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      replayInputs: {
        ledgerEvents: [{ sequence: 1, eventType: "execution.failed", eventPayload: { checkpointState: "failed" } }],
        historicalState: { runtimeState: "failed" },
        continuitySnapshots: [{ snapshotId: "snapshot-1", runtimeState: "DEGRADED", timestamp: "2026-05-08T12:00:00.000Z" }],
        auditEvents: [{ type: "RECOVERY_APPROVED" }],
      },
      continuityInputs: {
        checkpointState: "failed",
      },
      approvalState: "expired",
    });

    expect(result.outcome).toBe("GOVERNANCE_BLOCKED");
    expect(result.productionMutationAllowed).toBe(false);
  });
});
