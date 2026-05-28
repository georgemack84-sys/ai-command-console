import { describe, expect, it } from "vitest";

import { runRecoveryVerificationEngine } from "../../services/recoveryVerification/recoveryVerificationEngine";
import { createTenantContext } from "../../services/tenancy/tenantContext";

const tenantContext = createTenantContext({
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  source: "test",
});

describe("recovery verification engine", () => {
  it("verifies healthy recovery evidence", async () => {
    const result = await runRecoveryVerificationEngine({
      executionId: "exec-1",
      tenantContext,
      nowMs: Date.parse("2026-05-08T00:00:00.000Z"),
      overrides: {
        bundle: {
          ok: true,
          data: {
            state: "normal",
            readModel: {
              execution: { status: "completed" },
              verification: { status: "passed" },
              recoveryControl: { requiresApproval: false, status: "completed", latestRequestId: "request-1" },
              lock: { stale: false },
              ledger: { totalEvents: 1 },
            },
            timeline: { meta: { matchesReadModel: true } },
          },
        },
        continuityState: {
          ok: true,
          data: {
            runtimeState: "HEALTHY",
            replayDivergenceDetected: false,
          },
        },
        executionState: {
          execution: { status: "completed" },
        },
        ledgerResult: {
          ok: true,
          data: [{ id: 1 }],
        },
        auditEvents: [{ type: "RECOVERY_APPROVED" }],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.verificationState).toBe("VERIFIED");
      expect(result.data.replayIntegrity).toBe(true);
    }
  });

  it("fails on replay divergence", async () => {
    const result = await runRecoveryVerificationEngine({
      executionId: "exec-1",
      tenantContext,
      nowMs: Date.parse("2026-05-08T00:00:00.000Z"),
      overrides: {
        bundle: {
          ok: true,
          data: {
            state: "disputed",
            readModel: {
              execution: { status: "failed" },
              verification: { status: "failed" },
              recoveryControl: { requiresApproval: true, status: "approved", latestRequestId: "request-1" },
              lock: { stale: false },
              ledger: { totalEvents: 1 },
            },
            timeline: { meta: { matchesReadModel: false } },
          },
        },
        continuityState: {
          ok: true,
          data: {
            runtimeState: "QUARANTINED",
            replayDivergenceDetected: true,
          },
        },
        executionState: {
          execution: { status: "completed" },
        },
        ledgerResult: {
          ok: true,
          data: [],
        },
        auditEvents: [],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RECOVERY_VERIFICATION_REPLAY_FAILED");
    }
  });
});
