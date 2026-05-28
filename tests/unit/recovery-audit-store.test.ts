import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const auditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");

function loadAuditStore() {
  delete require.cache[auditStorePath];
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
  return require("../../services/recoveryAuditStore.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery audit store", () => {
  it("records append-only recovery lifecycle events", () => {
    const auditStore = loadAuditStore();

    const request = auditStore.recordRecoveryRequest({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
      plan: { executionId: "exec_1", planId: "plan_1" },
      planHash: { token: "one" },
    });
    expect(request.ok).toBe(true);

    const preview = auditStore.recordPreview({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      preview: { staleToken: { token: "one" }, blocked: false },
      requestedBy: "operator_1",
    });
    expect(preview.ok).toBe(true);

    const policy = auditStore.recordPolicyDecision({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      policy: {
        allowed: true,
        requiresApproval: false,
        reason: "safe_replay",
        policyCode: "SAFE_REPLAY",
      },
      requestedBy: "operator_1",
    });
    expect(policy.ok).toBe(true);

    expect(events.map((event) => event.type)).toEqual([
      "RECOVERY_REQUESTED",
      "RECOVERY_PREVIEWED",
      "RECOVERY_POLICY_DECISION",
    ]);
  });

  it("derives request state from audit history and finds one active recovery per execution", () => {
    const auditStore = loadAuditStore();

    auditStore.recordRecoveryRequest({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      recoveryMode: "resume",
      requestedBy: "operator_1",
      plan: { executionId: "exec_1", planId: "plan_1" },
      planHash: { token: "one" },
    });
    auditStore.recordPreview({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      preview: { staleToken: { token: "one" }, blocked: true },
      requestedBy: "operator_1",
    });
    auditStore.recordPolicyDecision({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      policy: {
        allowed: true,
        requiresApproval: true,
        reason: "requires_operator",
        policyCode: "REQUIRES_OPERATOR",
      },
      requestedBy: "operator_1",
    });

    const request = auditStore.getRecoveryRequest("recovery_1");
    expect(request).toEqual(
      expect.objectContaining({
        recoveryRequestId: "recovery_1",
        executionId: "exec_1",
        status: "AWAITING_APPROVAL",
      }),
    );

    const active = auditStore.findActiveRecoveryForExecution("exec_1");
    expect(active).toEqual(
      expect.objectContaining({
        recoveryRequestId: "recovery_1",
        status: "AWAITING_APPROVAL",
      }),
    );
  });
});
