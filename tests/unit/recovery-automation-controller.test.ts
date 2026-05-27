import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedRunRecoveryAutomationScan = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryAutomationController.js");
const runnerPath = require.resolve("../../services/recoveryAutomationRunner.js");
const storePath = require.resolve("../../services/recoveryAutomationStore.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");

function loadController() {
  delete require.cache[controllerPath];
  delete require.cache[storePath];
  require.cache[runnerPath] = {
    id: runnerPath,
    filename: runnerPath,
    loaded: true,
    exports: {
      runRecoveryAutomationScan: mockedRunRecoveryAutomationScan,
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
  return require("../../services/recoveryAutomationController.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedRunRecoveryAutomationScan.mockReset();
});

describe("recovery automation controller", () => {
  it("runs automation once through the runner", async () => {
    const controller = loadController();
    mockedRunRecoveryAutomationScan.mockResolvedValue({
      ok: true,
      data: { advisoriesProcessed: 1, requestsOpened: 0 },
    });

    const result = await controller.runAutomationOnce({
      requestedBy: "operator_1",
      limit: 3,
      dryRun: true,
    });

    expect(result).toEqual({
      ok: true,
      data: { advisoriesProcessed: 1, requestsOpened: 0 },
    });
  });

  it("pause and resume automation through append-only store events", async () => {
    const controller = loadController();

    const paused = await controller.pauseAutomation({
      scope: "execution",
      executionId: "exec_1",
      pausedBy: "operator_1",
      reason: "noise",
    });
    expect(paused.ok).toBe(true);

    let status = await controller.getAutomationStatus({ executionId: "exec_1" });
    expect(status).toEqual({
      ok: true,
      data: {
        paused: true,
        scope: "execution",
        executionId: "exec_1",
        reason: "noise",
        updatedBy: "operator_1",
      },
    });

    const resumed = await controller.resumeAutomation({
      scope: "execution",
      executionId: "exec_1",
      resumedBy: "operator_2",
      reason: "resolved",
    });
    expect(resumed.ok).toBe(true);

    status = await controller.getAutomationStatus({ executionId: "exec_1" });
    expect(status).toEqual({
      ok: true,
      data: {
        paused: false,
        scope: "execution",
        executionId: "exec_1",
        reason: "resolved",
        updatedBy: "operator_2",
      },
    });
  });
});
