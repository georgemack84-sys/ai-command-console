import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const storePath = require.resolve("../../services/recoveryAutomationStore.js");

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
  return require("../../services/recoveryAutomationStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery automation store", () => {
  it("records append-only automation events and derives paused state", () => {
    const store = loadStore();

    store.recordAutomationScanStarted({ requestedBy: "operator_1", limit: 5, dryRun: true });
    store.recordAutomationPaused({ scope: "execution", executionId: "exec_1", pausedBy: "operator_1", reason: "noise" });
    store.recordAutomationResumed({ scope: "execution", executionId: "exec_1", resumedBy: "operator_2", reason: "resolved" });

    expect(events.map((event) => event.type)).toEqual([
      "RECOVERY_AUTOMATION_SCAN_STARTED",
      "RECOVERY_AUTOMATION_PAUSED",
      "RECOVERY_AUTOMATION_RESUMED",
    ]);

    const status = store.getAutomationStatus({ executionId: "exec_1" });
    expect(status).toEqual({
      paused: false,
      scope: "execution",
      executionId: "exec_1",
      reason: "resolved",
      updatedBy: "operator_2",
    });
  });
});
