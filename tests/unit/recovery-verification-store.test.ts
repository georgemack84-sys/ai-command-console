import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const storePath = require.resolve("../../services/recoveryVerificationStore.js");

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
  return require("../../services/recoveryVerificationStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery verification store", () => {
  it("records append-only verification events and derives latest verification state", () => {
    const store = loadStore();
    store.recordVerificationStarted({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      requestedBy: "operator_1",
    });
    store.recordVerificationPolicyEvaluated({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      policy: { action: "verify_outcome" },
      requestedBy: "operator_1",
    });
    store.recordVerificationResult({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      verification: { outcome: "VERIFIED", verified: true, reason: "ok" },
      requestedBy: "operator_1",
    });

    expect(events.map((event) => event.type)).toEqual([
      "RECOVERY_VERIFICATION_STARTED",
      "RECOVERY_VERIFICATION_POLICY_EVALUATED",
      "RECOVERY_VERIFICATION_VERIFIED",
    ]);

    expect(store.deriveVerificationState({ recoveryRequestId: "recovery_1" })).toEqual({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      latestOutcome: "VERIFIED",
      latestReason: "ok",
      verified: true,
    });
  });
});
