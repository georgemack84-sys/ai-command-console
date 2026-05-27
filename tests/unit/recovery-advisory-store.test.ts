import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const advisoryStorePath = require.resolve("../../services/recoveryAdvisoryStore.js");

function loadStore() {
  delete require.cache[advisoryStorePath];
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
  return require("../../services/recoveryAdvisoryStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery advisory store", () => {
  it("is append-only and derives advisory state from event history", () => {
    const store = loadStore();

    store.recordAdvisoryCreated({
      advisoryId: "adv_1",
      executionId: "exec_1",
      candidate: { executionId: "exec_1", signalType: "FAILED_EXECUTION" },
    });
    store.recordAdvisoryRecommendation({
      advisoryId: "adv_1",
      executionId: "exec_1",
      recommendation: { recommendation: "retry_safe_steps" },
    });
    store.recordAdvisoryEscalated({
      advisoryId: "adv_1",
      executionId: "exec_1",
      escalatedBy: "operator_1",
      reason: "needs_human_attention",
    });

    expect(events.map((event) => event.type)).toEqual([
      "RECOVERY_ADVISORY_CREATED",
      "RECOVERY_ADVISORY_RECOMMENDED",
      "RECOVERY_ADVISORY_ESCALATED",
    ]);

    const advisory = store.getAdvisoryById("adv_1");
    expect(advisory).toEqual(
      expect.objectContaining({
        advisoryId: "adv_1",
        executionId: "exec_1",
        state: "ESCALATED",
      }),
    );
  });
});
