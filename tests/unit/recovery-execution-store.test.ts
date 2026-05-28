import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const storePath = require.resolve("../../services/recoveryExecutionStore.js");

function loadStore() {
  delete require.cache[storePath];
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
  return require("../../services/recoveryExecutionStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery execution store", () => {
  it("records append-only execution orchestration events and derives pause state", () => {
    const store = loadStore();

    store.pauseRecoveryExecution({
      scope: "execution",
      executionId: "exec_1",
      pausedBy: "operator_1",
      reason: "hold",
    });
    store.resumeRecoveryExecution({
      scope: "execution",
      executionId: "exec_1",
      resumedBy: "operator_2",
      reason: "resume",
    });

    expect(events.map((event) => event.type)).toEqual([
      "RECOVERY_EXECUTION_PAUSED",
      "RECOVERY_EXECUTION_RESUMED",
    ]);

    expect(store.deriveRecoveryExecutionState({ executionId: "exec_1" })).toEqual({
      paused: false,
      scope: "execution",
      executionId: "exec_1",
      reason: "resume",
      updatedBy: "operator_2",
      successfulCommits: new Set(),
      inFlightExecutionIds: new Set(),
    });
  });
});
