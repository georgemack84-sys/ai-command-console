import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedBuildRecoveryPlan = vi.fn();
const mockedPreviewRecoveryPlan = vi.fn();
const mockedCommitRecoveryPlan = vi.fn();
const mockedCreateRecoveryPlanHash = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryController.js");
const auditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const builderPath = require.resolve("../../services/recoveryPlanBuilder.js");
const previewPath = require.resolve("../../services/recoveryPreview.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");
const planHashPath = require.resolve("../../services/recoveryPlanHash.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");

function loadController() {
  delete require.cache[controllerPath];
  delete require.cache[auditStorePath];
  require.cache[builderPath] = {
    id: builderPath,
    filename: builderPath,
    loaded: true,
    exports: {
      buildRecoveryPlan: mockedBuildRecoveryPlan,
    },
  } as any;
  require.cache[previewPath] = {
    id: previewPath,
    filename: previewPath,
    loaded: true,
    exports: {
      previewRecoveryPlan: mockedPreviewRecoveryPlan,
    },
  } as any;
  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: mockedCommitRecoveryPlan,
    },
  } as any;
  require.cache[planHashPath] = {
    id: planHashPath,
    filename: planHashPath,
    loaded: true,
    exports: {
      createRecoveryPlanHash: mockedCreateRecoveryPlanHash,
    },
  } as any;
  require.cache[auditTrailPath] = {
    id: auditTrailPath,
    filename: auditTrailPath,
    loaded: true,
    exports: {
      appendAuditEvent: (event: Record<string, unknown>) => {
        const entry = {
          id: `audit_${events.length + 1}`,
          timestamp: new Date(1700000000000 + events.length).toISOString(),
          ...event,
        };
        events.push(entry);
        return entry;
      },
      listAuditEvents: () => [...events].reverse(),
      clearAuditEvents: () => {
        events.splice(0, events.length);
      },
    },
  } as any;
  return require("../../services/recoveryController.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedBuildRecoveryPlan.mockReset();
  mockedPreviewRecoveryPlan.mockReset();
  mockedCommitRecoveryPlan.mockReset();
  mockedCreateRecoveryPlanHash.mockReset();
});

describe("recovery controller", () => {
  it("enforces approval when policy requires it", async () => {
    const controller = loadController();
    mockedBuildRecoveryPlan.mockResolvedValue({
      ok: true,
      data: { executionId: "exec_1", planId: "plan_1", recoveryMode: "resume" },
    });
    mockedCreateRecoveryPlanHash.mockReturnValue({ ok: true, data: { token: "hash_1" } });
    mockedPreviewRecoveryPlan.mockReturnValue({
      ok: true,
      data: {
        staleToken: { token: "stale_1" },
        blocked: true,
        replayCandidates: [{ classification: "REQUIRES_OPERATOR" }],
      },
    });

    const requested = await controller.requestRecovery({
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
    });
    expect(requested.ok).toBe(true);

    const previewed = await controller.previewRecovery({
      recoveryRequestId: requested.data.recoveryRequestId,
    });
    expect(previewed.ok).toBe(true);
    expect(previewed.data.status).toBe("AWAITING_APPROVAL");

    const blockedCommit = await controller.commitRecovery({
      recoveryRequestId: requested.data.recoveryRequestId,
      requestedBy: "operator_1",
      dryRun: false,
    });
    expect(blockedCommit).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );
    expect(mockedCommitRecoveryPlan).not.toHaveBeenCalled();
  });

  it("cannot bypass stale token blocking from D-6", async () => {
    const controller = loadController();
    mockedBuildRecoveryPlan.mockResolvedValue({
      ok: true,
      data: { executionId: "exec_1", planId: "plan_1", recoveryMode: "resume" },
    });
    mockedCreateRecoveryPlanHash.mockReturnValue({ ok: true, data: { token: "hash_1" } });
    mockedPreviewRecoveryPlan.mockReturnValue({
      ok: true,
      data: {
        staleToken: { token: "stale_1" },
        blocked: false,
        replayCandidates: [{ classification: "SAFE_REPLAY" }],
      },
    });
    mockedCommitRecoveryPlan.mockResolvedValue({
      ok: false,
      code: "STALE_RECOVERY_PLAN",
      message: "stale",
    });

    const requested = await controller.requestRecovery({
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
    });
    await controller.previewRecovery({ recoveryRequestId: requested.data.recoveryRequestId });

    const result = await controller.commitRecovery({
      recoveryRequestId: requested.data.recoveryRequestId,
      requestedBy: "operator_1",
      dryRun: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );
    expect(events.map((event) => event.type)).toContain("RECOVERY_BLOCKED");
  });

  it("allows approved recovery requests to commit through D-6", async () => {
    const controller = loadController();
    mockedBuildRecoveryPlan.mockResolvedValue({
      ok: true,
      data: { executionId: "exec_1", planId: "plan_1", recoveryMode: "resume" },
    });
    mockedCreateRecoveryPlanHash.mockReturnValue({ ok: true, data: { token: "hash_1" } });
    mockedPreviewRecoveryPlan.mockReturnValue({
      ok: true,
      data: {
        staleToken: { token: "stale_1" },
        blocked: true,
        replayCandidates: [{ classification: "REQUIRES_OPERATOR" }],
      },
    });
    mockedCommitRecoveryPlan.mockResolvedValue({
      ok: true,
      data: { committed: true, recoveryMode: "resume" },
    });

    const requested = await controller.requestRecovery({
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
    });
    await controller.previewRecovery({ recoveryRequestId: requested.data.recoveryRequestId });
    const approved = await controller.approveRecovery({
      recoveryRequestId: requested.data.recoveryRequestId,
      approvedBy: "operator_9",
    });
    expect(approved).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          status: "APPROVED",
        }),
      }),
    );

    const committed = await controller.commitRecovery({
      recoveryRequestId: requested.data.recoveryRequestId,
      requestedBy: "operator_1",
      dryRun: false,
    });
    expect(committed).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          committed: true,
        }),
      }),
    );
    expect(mockedCommitRecoveryPlan).toHaveBeenCalledTimes(1);
  });

  it("routes dry-run commits through D-6 without committing lifecycle state", async () => {
    const controller = loadController();
    mockedBuildRecoveryPlan.mockResolvedValue({
      ok: true,
      data: { executionId: "exec_1", planId: "plan_1", recoveryMode: "resume" },
    });
    mockedCreateRecoveryPlanHash.mockReturnValue({ ok: true, data: { token: "hash_1" } });
    mockedPreviewRecoveryPlan.mockReturnValue({
      ok: true,
      data: {
        staleToken: { token: "stale_1" },
        blocked: false,
        replayCandidates: [{ classification: "SAFE_REPLAY" }],
      },
    });
    mockedCommitRecoveryPlan.mockResolvedValue({
      ok: true,
      data: {
        committed: false,
        dryRun: true,
        preview: { blocked: false },
      },
    });

    const requested = await controller.requestRecovery({
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
    });
    await controller.previewRecovery({ recoveryRequestId: requested.data.recoveryRequestId });

    const result = await controller.commitRecovery({
      recoveryRequestId: requested.data.recoveryRequestId,
      requestedBy: "operator_1",
      dryRun: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          committed: false,
          dryRun: true,
        }),
      }),
    );
    expect(mockedCommitRecoveryPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: true,
      }),
    );

    const auditStore = require("../../services/recoveryAuditStore.js");
    const request = auditStore.getRecoveryRequest(requested.data.recoveryRequestId);
    expect(request.status).toBe("PREVIEWED");
  });

  it("prevents more than one active recovery per execution", async () => {
    const controller = loadController();
    mockedBuildRecoveryPlan.mockResolvedValue({
      ok: true,
      data: { executionId: "exec_1", planId: "plan_1", recoveryMode: "resume" },
    });
    mockedCreateRecoveryPlanHash.mockReturnValue({ ok: true, data: { token: "hash_1" } });

    const first = await controller.requestRecovery({
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
    });
    expect(first.ok).toBe(true);

    const second = await controller.requestRecovery({
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_2",
    });

    expect(second).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );
  });
});
