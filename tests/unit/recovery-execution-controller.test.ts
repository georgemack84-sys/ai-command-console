import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedRunApprovedRecoveryExecution = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryExecutionController.js");
const runnerPath = require.resolve("../../services/recoveryExecutionRunner.js");
const storePath = require.resolve("../../services/recoveryExecutionStore.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");

function loadController() {
  delete require.cache[controllerPath];
  delete require.cache[storePath];
  require.cache[runnerPath] = {
    id: runnerPath,
    filename: runnerPath,
    loaded: true,
    exports: {
      runApprovedRecoveryExecution: mockedRunApprovedRecoveryExecution,
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
  return require("../../services/recoveryExecutionController.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedRunApprovedRecoveryExecution.mockReset();
});

describe("recovery execution controller", () => {
  it("runs execution once through the runner", async () => {
    const controller = loadController();
    mockedRunApprovedRecoveryExecution.mockResolvedValue({
      ok: true,
      data: { evaluated: 1, committed: 0, blocked: 0, failed: 0 },
    });

    const result = await controller.runExecutionOnce({
      requestedBy: "operator_1",
      limit: 3,
      dryRun: true,
    });

    expect(result).toEqual({
      ok: true,
      data: { evaluated: 1, committed: 0, blocked: 0, failed: 0 },
    });
  });

  it("pause and resume execution orchestration through append-only store events", async () => {
    const controller = loadController();

    const paused = await controller.pauseRecoveryExecution({
      scope: "execution",
      executionId: "exec_1",
      pausedBy: "operator_1",
      reason: "hold",
    });
    expect(paused.ok).toBe(true);

    let status = await controller.getRecoveryExecutionStatus({ executionId: "exec_1" });
    expect(status).toEqual({
      ok: true,
      data: expect.objectContaining({
        paused: true,
        executionId: "exec_1",
      }),
    });

    const resumed = await controller.resumeRecoveryExecution({
      scope: "execution",
      executionId: "exec_1",
      resumedBy: "operator_2",
      reason: "resume",
    });
    expect(resumed.ok).toBe(true);

    status = await controller.getRecoveryExecutionStatus({ executionId: "exec_1" });
    expect(status).toEqual({
      ok: true,
      data: expect.objectContaining({
        paused: false,
        executionId: "exec_1",
      }),
    });
  });
});
