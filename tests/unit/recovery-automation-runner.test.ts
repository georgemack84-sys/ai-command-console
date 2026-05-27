import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedScanAndRecommendRecoveries = vi.fn();
const mockedCreateRecoveryRequestFromAdvisory = vi.fn();
const mockedEvaluateAutomationPolicy = vi.fn();
const mockedShouldThrottleAutomation = vi.fn();
const mockedExplainAutomationDecision = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const runnerPath = require.resolve("../../services/recoveryAutomationRunner.js");
const controllerPath = require.resolve("../../services/recoveryAdvisoryController.js");
const policyPath = require.resolve("../../services/recoveryAutomationPolicy.js");
const throttlePath = require.resolve("../../services/recoveryAutomationThrottle.js");
const storePath = require.resolve("../../services/recoveryAutomationStore.js");
const explainerPath = require.resolve("../../services/recoveryAutomationExplainer.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");

function loadRunner() {
  delete require.cache[runnerPath];
  delete require.cache[storePath];
  require.cache[controllerPath] = {
    id: controllerPath,
    filename: controllerPath,
    loaded: true,
    exports: {
      scanAndRecommendRecoveries: mockedScanAndRecommendRecoveries,
      createRecoveryRequestFromAdvisory: mockedCreateRecoveryRequestFromAdvisory,
    },
  } as any;
  require.cache[policyPath] = {
    id: policyPath,
    filename: policyPath,
    loaded: true,
    exports: {
      evaluateAutomationPolicy: mockedEvaluateAutomationPolicy,
    },
  } as any;
  require.cache[throttlePath] = {
    id: throttlePath,
    filename: throttlePath,
    loaded: true,
    exports: {
      shouldThrottleAutomation: mockedShouldThrottleAutomation,
    },
  } as any;
  require.cache[explainerPath] = {
    id: explainerPath,
    filename: explainerPath,
    loaded: true,
    exports: {
      explainAutomationDecision: mockedExplainAutomationDecision,
    },
  } as any;
  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("D-9 must not call D-6 commit directly");
      },
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
  return require("../../services/recoveryAutomationRunner.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedScanAndRecommendRecoveries.mockReset();
  mockedCreateRecoveryRequestFromAdvisory.mockReset();
  mockedEvaluateAutomationPolicy.mockReset();
  mockedShouldThrottleAutomation.mockReset();
  mockedExplainAutomationDecision.mockReset();
});

describe("recovery automation runner", () => {
  it("uses D-8 and never D-6 directly", async () => {
    const runner = loadRunner();
    mockedScanAndRecommendRecoveries.mockResolvedValue({
      ok: true,
      data: {
        advisories: [
          {
            advisoryId: "adv_1",
            executionId: "exec_1",
            signal: { signalType: "FAILED_EXECUTION" },
            recommendation: { recommendation: "retry_safe_steps", confidence: 0.9, requiresOperator: false },
          },
        ],
      },
    });
    mockedEvaluateAutomationPolicy.mockReturnValue({
      allowed: true,
      action: "create_request",
      requiresOperator: false,
      reason: "safe_retry",
      policyCode: "ALLOW_CREATE_REQUEST",
    });
    mockedShouldThrottleAutomation.mockReturnValue({
      throttled: false,
      reason: "eligible",
      nextEligibleAt: null,
    });
    mockedExplainAutomationDecision.mockReturnValue({
      summary: "opened request",
      actionTaken: "create_request",
      reason: "safe_retry",
      safetyNotes: [],
    });
    mockedCreateRecoveryRequestFromAdvisory.mockResolvedValue({
      ok: true,
      data: { recoveryRequestId: "recovery_1", status: "REQUESTED" },
    });

    const result = await runner.runRecoveryAutomationScan({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          advisoriesProcessed: 1,
          requestsOpened: 1,
        }),
      }),
    );
    expect(mockedCreateRecoveryRequestFromAdvisory).toHaveBeenCalledWith({
      advisoryId: "adv_1",
      requestedBy: "operator_1",
    });
  });

  it("does not create requests during dry run", async () => {
    const runner = loadRunner();
    mockedScanAndRecommendRecoveries.mockResolvedValue({
      ok: true,
      data: {
        advisories: [
          {
            advisoryId: "adv_1",
            executionId: "exec_1",
            signal: { signalType: "FAILED_EXECUTION" },
            recommendation: { recommendation: "retry_safe_steps", confidence: 0.9, requiresOperator: false },
          },
        ],
      },
    });
    mockedEvaluateAutomationPolicy.mockReturnValue({
      allowed: true,
      action: "create_request",
      requiresOperator: false,
      reason: "safe_retry",
      policyCode: "ALLOW_CREATE_REQUEST",
    });
    mockedShouldThrottleAutomation.mockReturnValue({
      throttled: false,
      reason: "eligible",
      nextEligibleAt: null,
    });
    mockedExplainAutomationDecision.mockReturnValue({
      summary: "dry run",
      actionTaken: "create_request",
      reason: "safe_retry",
      safetyNotes: [],
    });

    const result = await runner.runRecoveryAutomationScan({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: true,
    });

    expect(result.ok).toBe(true);
    expect(mockedCreateRecoveryRequestFromAdvisory).not.toHaveBeenCalled();
  });

  it("stops when automation is paused", async () => {
    const runner = loadRunner();
    const store = require("../../services/recoveryAutomationStore.js");
    store.recordAutomationPaused({
      scope: "global",
      executionId: null,
      pausedBy: "operator_1",
      reason: "maintenance",
    });

    const result = await runner.runRecoveryAutomationScan({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY_AUTOMATION",
      }),
    );
    expect(mockedScanAndRecommendRecoveries).not.toHaveBeenCalled();
  });
});
