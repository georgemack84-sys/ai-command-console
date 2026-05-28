import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const storePath = require.resolve("../../services/recoveryAutonomyStore.js");

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
  return require("../../services/recoveryAutonomyStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery autonomy store", () => {
  it("defaults autonomy level to OFF and derives pause/level state from history", () => {
    const store = loadStore();

    expect(store.getRecoveryAutonomyStatus({ executionId: "exec_1" })).toEqual({
      level: "OFF",
      paused: false,
      scope: "execution",
      executionId: "exec_1",
      reason: null,
      updatedBy: null,
    });

    store.recordAutonomyLevelChanged({ level: "SUPERVISED_APPROVAL", changedBy: "operator_1", reason: "enable" });
    store.recordAutonomyPaused({ scope: "execution", executionId: "exec_1", pausedBy: "operator_1", reason: "pause" });

    expect(store.getRecoveryAutonomyStatus({ executionId: "exec_1" })).toEqual({
      level: "SUPERVISED_APPROVAL",
      paused: true,
      scope: "execution",
      executionId: "exec_1",
      reason: "pause",
      updatedBy: "operator_1",
    });
  });
});
