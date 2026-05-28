import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const storePath = require.resolve("../../services/recoveryLearningStore.js");

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
  return require("../../services/recoveryLearningStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery learning store", () => {
  it("records append-only learning events and derives latest report state", () => {
    const store = loadStore();

    store.recordLearningRunStarted({ requestedBy: "operator_1", dryRun: false });
    store.recordLearningSignalsAggregated({ signals: { totals: { verified: 1 } }, requestedBy: "operator_1" });
    store.recordLearningPolicyRecommended({ recommendations: [{ target: "advisory_policy" }], requestedBy: "operator_1" });
    store.recordLearningReportCreated({ report: { summary: "report" }, requestedBy: "operator_1" });

    expect(events.map((event) => event.type)).toEqual([
      "RECOVERY_LEARNING_RUN_STARTED",
      "RECOVERY_LEARNING_SIGNALS_AGGREGATED",
      "RECOVERY_LEARNING_POLICY_RECOMMENDED",
      "RECOVERY_LEARNING_REPORT_CREATED",
    ]);

    expect(store.getLatestLearningReport({ executionId: null })).toEqual(
      expect.objectContaining({
        report: { summary: "report" },
      }),
    );
    expect(store.listLearningReports({ limit: 10 }).length).toBe(1);
  });
});
