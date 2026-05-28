import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const runnerPath = require.resolve("../../services/recoveryLearningRunner.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const learningStorePath = require.resolve("../../services/recoveryLearningStore.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");
const recoveryControllerPath = require.resolve("../../services/recoveryController.js");
const executionRunnerPath = require.resolve("../../services/recoveryExecutionRunner.js");

function loadRunner() {
  delete require.cache[runnerPath];
  delete require.cache[learningStorePath];
  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("D-13 must not call D-6 commit");
      },
    },
  } as any;
  require.cache[recoveryControllerPath] = {
    id: recoveryControllerPath,
    filename: recoveryControllerPath,
    loaded: true,
    exports: {
      commitRecovery: () => {
        throw new Error("D-13 must not call D-7 commit");
      },
      approveRecovery: () => {
        throw new Error("D-13 must not call D-7 approve");
      },
    },
  } as any;
  require.cache[executionRunnerPath] = {
    id: executionRunnerPath,
    filename: executionRunnerPath,
    loaded: true,
    exports: {
      runApprovedRecoveryExecution: () => {
        throw new Error("D-13 must not call D-11 execution");
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
  return require("../../services/recoveryLearningRunner.js");
}

beforeEach(() => {
  events.splice(0, events.length);
});

describe("recovery learning runner", () => {
  it("dryRun records no learning events", () => {
    const runner = loadRunner();
    const verificationStore = require("../../services/recoveryVerificationStore.js");
    verificationStore.recordVerificationResult({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      verification: { outcome: "VERIFIED", verified: true, reason: "ok" },
      requestedBy: "operator_1",
    });

    const before = events.length;
    const result = runner.runRecoveryLearningPass({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: true,
    });

    expect(result.ok).toBe(true);
    expect(events.length).toBe(before);
  });

  it("records learning events without calling execution, approval, or commit paths", () => {
    const runner = loadRunner();
    const verificationStore = require("../../services/recoveryVerificationStore.js");
    const executionStore = require("../../services/recoveryExecutionStore.js");
    const autonomyStore = require("../../services/recoveryAutonomyStore.js");
    const automationStore = require("../../services/recoveryAutomationStore.js");
    const advisoryStore = require("../../services/recoveryAdvisoryStore.js");

    verificationStore.recordVerificationResult({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      verification: { outcome: "VERIFIED", verified: true, reason: "ok" },
      requestedBy: "operator_1",
    });
    executionStore.recordExecutionCommitted({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      requestedBy: "operator_1",
      result: { committed: true },
    });
    autonomyStore.recordAutonomyPolicyEvaluated({
      recoveryRequestId: "recovery_1",
      executionId: "exec_1",
      policy: { action: "auto_approve" },
      requestedBy: "operator_1",
    });
    automationStore.recordAutomationPolicyEvaluated({
      executionId: "exec_1",
      advisoryId: "advisory_1",
      signalType: "FAILED_EXECUTION",
      recommendation: "retry_safe_steps",
      policy: { action: "create_request" },
      requestedBy: "operator_1",
    });
    advisoryStore.recordAdvisoryRecommendation({
      advisoryId: "advisory_1",
      executionId: "exec_1",
      signal: { signalType: "FAILED_EXECUTION" },
      recommendation: { recommendation: "retry_safe_steps" },
      explanation: { summary: "advisory" },
      requestedBy: "operator_1",
    });

    const result = runner.runRecoveryLearningPass({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          recommendations: expect.any(Array),
        }),
      }),
    );
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "RECOVERY_LEARNING_RUN_STARTED",
        "RECOVERY_LEARNING_SIGNALS_AGGREGATED",
        "RECOVERY_LEARNING_POLICY_RECOMMENDED",
        "RECOVERY_LEARNING_REPORT_CREATED",
      ]),
    );
  });
});
