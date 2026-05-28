import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const events: Array<Record<string, unknown>> = [];

const auditTrailPath = require.resolve("../../services/auditTrail.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const recoveryAuditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const recoveryAdvisoryStorePath = require.resolve("../../services/recoveryAdvisoryStore.js");
const recoveryAutomationStorePath = require.resolve("../../services/recoveryAutomationStore.js");
const recoveryAutonomyStorePath = require.resolve("../../services/recoveryAutonomyStore.js");
const recoveryExecutionStorePath = require.resolve("../../services/recoveryExecutionStore.js");
const recoveryVerificationStorePath = require.resolve("../../services/recoveryVerificationStore.js");
const recoveryLearningStorePath = require.resolve("../../services/recoveryLearningStore.js");

function clearModule(modulePath: string) {
  delete require.cache[modulePath];
}

async function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  vi.resetModules();
  for (const modulePath of [
    stateDatabasePath,
    runtimePathsPath,
    executionStateStorePath,
    executionIntegrityStorePath,
    recoveryAuditStorePath,
    recoveryAdvisoryStorePath,
    recoveryAutomationStorePath,
    recoveryAutonomyStorePath,
    recoveryExecutionStorePath,
    recoveryVerificationStorePath,
    recoveryLearningStorePath,
  ]) {
    clearModule(modulePath);
  }
  require.cache[auditTrailPath] = {
    id: auditTrailPath,
    filename: auditTrailPath,
    loaded: true,
    exports: {
      appendAuditEvent: (event: Record<string, unknown>) => {
        const entry = {
          id: `audit_${events.length + 1}`,
          timestamp: new Date(1700000000000 + events.length * 1000).toISOString(),
          ...event,
        };
        events.push(entry);
        return entry;
      },
      listAuditEvents: (limit = 5000) => [...events].slice(-Math.max(1, Number(limit || 5000))).reverse(),
      clearAuditEvents: () => {
        events.splice(0, events.length);
      },
    },
  } as any;

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
  const recoveryAdvisoryStore = require("../../services/recoveryAdvisoryStore.js");
  const recoveryAutomationStore = require("../../services/recoveryAutomationStore.js");
  const recoveryAutonomyStore = require("../../services/recoveryAutonomyStore.js");
  const recoveryExecutionStore = require("../../services/recoveryExecutionStore.js");
  const recoveryVerificationStore = require("../../services/recoveryVerificationStore.js");
  const recoveryLearningStore = require("../../services/recoveryLearningStore.js");
  const { buildRecoveryReadModel } = await import("../../services/recovery/recoveryReadModel.ts");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    recoveryAuditStore,
    recoveryAdvisoryStore,
    recoveryAutomationStore,
    recoveryAutonomyStore,
    recoveryExecutionStore,
    recoveryVerificationStore,
    recoveryLearningStore,
    buildRecoveryReadModel,
  };
}

function seedExecutionSnapshot(executionStateStore: any, executionId: string, status = "running") {
  const plan = {
    id: `plan_${executionId}`,
    steps: [
      {
        id: "step_0",
        action: "read_file",
        payload: "file.txt",
        metadata: {
          idempotent: true,
          retryStrategy: "safe",
        },
      },
    ],
  };
  executionStateStore.startExecutionState(plan);
  executionStateStore.persistExecutionSnapshot({
    runId: executionId,
    planId: plan.id,
    globalState: status,
    reviewStatus: status === "paused_for_review" ? "pending" : "approved",
    triggerSource: "api",
    steps: [
      {
        id: "step_0",
        sequence: 1,
        stageId: "stage_1",
        status: status === "running" ? "pending" : status,
        action: "read_file",
        kind: "read_file",
        originalInput: "file.txt",
        normalizedInput: "file.txt",
        idempotencyClass: "safe_repeat",
        isIdempotent: true,
        sideEffects: [],
      },
    ],
    stages: [
      {
        id: "stage_1",
        sequence: 1,
        name: "Stage 1",
        status,
      },
    ],
  });
  return plan.id;
}

beforeEach(() => {
  events.splice(0, events.length);
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("recovery read model integration", () => {
  it("execution lifecycle with no recovery", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_1", "running");
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
      expect(result.ok && result.data.execution.status).toBe("running");
      expect(result.ok && result.data.recovery.status).toBe("none");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("failed execution with D-8 advisory", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_2", "failed");
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_1", executionId: "exec_2", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      runtime.recoveryAdvisoryStore.recordAdvisoryRecommendation({ advisoryId: "adv_1", executionId: "exec_2", signal: { signalType: "FAILED_EXECUTION" }, recommendation: { recommendation: "operator_recovery", requiresOperator: true }, requestedBy: "system" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_2", nowMs: 1700000000000 });
      expect(result.ok && result.data.execution.status).toBe("failed");
      expect(result.ok && result.data.advisory.status).toBe("open");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-8 advisory escalated but no D-7 request", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_3", "running");
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_2", executionId: "exec_3", candidate: { signalType: "EXPIRED_LEASE" }, requestedBy: "system" });
      runtime.recoveryAdvisoryStore.recordAdvisoryEscalated({ advisoryId: "adv_2", executionId: "exec_3", escalatedBy: "operator_1", reason: "needs review" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_3", nowMs: 1700000000000 });
      expect(result.ok && result.data.advisory.status).toBe("escalated");
      expect(result.ok && result.data.recoveryControl.status).toBe("none");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-8 advisory request_created and D-7 request exists", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_4", "paused_for_review");
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_3", executionId: "exec_4", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      runtime.recoveryAdvisoryStore.recordAdvisoryRequestCreated({ advisoryId: "adv_3", executionId: "exec_4", requestedBy: "operator_1", recoveryRequest: { recoveryRequestId: "recovery_3" } });
      runtime.recoveryAuditStore.recordRecoveryRequest({ recoveryRequestId: "recovery_3", executionId: "exec_4", recoveryMode: "resume", requestedBy: "operator_1", plan: { executionId: "exec_4", planId: "plan_exec_4" }, planHash: { token: "hash_1" } });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_4", nowMs: 1700000000000 });
      expect(result.ok && result.data.advisory.status).toBe("request_created");
      expect(result.ok && result.data.recoveryControl.status).toBe("requested");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-7 approval required", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_5", "paused_for_review");
      runtime.recoveryAuditStore.recordRecoveryRequest({ recoveryRequestId: "recovery_5", executionId: "exec_5", recoveryMode: "resume", requestedBy: "operator_1", plan: { executionId: "exec_5", planId: "plan_exec_5" }, planHash: { token: "hash_1" } });
      runtime.recoveryAuditStore.recordPolicyDecision({ recoveryRequestId: "recovery_5", executionId: "exec_5", requestedBy: "operator_1", policy: { allowed: true, requiresApproval: true, reason: "approval", policyCode: "SAFE" } });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_5", nowMs: 1700000000000 });
      expect(result.ok && result.data.recoveryControl.status).toBe("approval_required");
      expect(result.ok && result.data.recoveryControl.requiresApproval).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-9 automation blocked", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_6", "running");
      runtime.recoveryAutomationStore.recordAutomationBlocked({ executionId: "exec_6", advisoryId: "adv_6", signalType: "FAILED_EXECUTION", recommendation: "operator_recovery", policy: { allowed: false }, requestedBy: "operator_1", reason: "cooldown" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_6", nowMs: 1700000000000 });
      expect(result.ok && result.data.automation.status).toBe("blocked");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-10 autonomy requires operator", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_7", "paused_for_review");
      runtime.recoveryAutonomyStore.recordAutonomyPolicyEvaluated({ recoveryRequestId: "recovery_7", executionId: "exec_7", policy: { action: "manual_approval_required", reason: "operator_required" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_7", nowMs: 1700000000000 });
      expect(result.ok && result.data.autonomy.status).toBe("requires_operator");
      expect(result.ok && result.data.risk.requiresOperatorAttention).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-11 recovery completed", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_8", "running");
      runtime.recoveryExecutionStore.recordExecutionCommitted({ recoveryRequestId: "recovery_8", executionId: "exec_8", requestedBy: "operator_1", result: { committed: true } });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_8", nowMs: 1700000000000 });
      expect(result.ok && result.data.recoveryControl.status).toBe("none");
      expect(result.ok && result.data.ledger.totalEvents).toBeGreaterThanOrEqual(0);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-12 verification passed", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_9", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_9", executionId: "exec_9", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_9", nowMs: 1700000000000 });
      expect(result.ok && result.data.verification.status).toBe("passed");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-13 learning report available", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_10", "running");
      runtime.recoveryLearningStore.recordLearningReportCreated({ report: { summary: "report", recommendations: [{ target: "advisory_policy" }] }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_10", nowMs: 1700000000000 });
      expect(result.ok && result.data.learning.status).toBe("report_available");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("D-13 learning warnings reflected in risk", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_11", "running");
      runtime.recoveryLearningStore.recordLearningSignalsAggregated({ signals: { totals: { unknown: 1 }, warnings: ["missing_verification_history"] }, requestedBy: "operator_1" });
      runtime.recoveryLearningStore.recordLearningReportCreated({ report: { summary: "report", recommendations: [] }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_11", nowMs: 1700000000000 });
      expect(result.ok && result.data.learning.hasWarnings).toBe(true);
      expect(result.ok && result.data.risk.hasLearningWarnings).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("ledger populated", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_12", "running");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_12", eventType: "execution.started", payload: {} });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_12", nowMs: 1700000000000 });
      expect(result.ok && result.data.ledger.totalEvents).toBeGreaterThan(0);
      expect(result.ok && result.data.ledger.lastEventType).toBe("execution.started");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("final read model reflects all sources", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_13", "failed");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_13", eventType: "execution.failed", payload: {} });
      runtime.executionIntegrityStore.acquireExecutionLock(planId, "exec_13");
      runtime.executionIntegrityStore.createExecutionAttempt({ planId, executionId: "exec_13", stepId: "step_0", sideEffectClass: "unknown" });
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_13", executionId: "exec_13", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      runtime.recoveryAdvisoryStore.recordAdvisoryEscalated({ advisoryId: "adv_13", executionId: "exec_13", escalatedBy: "operator_1", reason: "needs review" });
      runtime.recoveryAutomationStore.recordAutomationBlocked({ executionId: "exec_13", advisoryId: "adv_13", signalType: "FAILED_EXECUTION", recommendation: "operator_recovery", policy: { allowed: false }, requestedBy: "operator_1", reason: "cooldown" });
      runtime.recoveryAutonomyStore.recordAutonomyPolicyEvaluated({ recoveryRequestId: "recovery_13", executionId: "exec_13", policy: { action: "manual_approval_required", reason: "manual" }, requestedBy: "operator_1" });
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_13", executionId: "exec_13", verification: { outcome: "FAILED", verified: false, reason: "bad" }, requestedBy: "operator_1" });
      runtime.recoveryLearningStore.recordLearningSignalsAggregated({ signals: { totals: { unknown: 1 }, warnings: ["missing"] }, requestedBy: "operator_1" });
      runtime.recoveryLearningStore.recordLearningReportCreated({ report: { summary: "report", recommendations: [{ target: "advisory_policy" }] }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_13", nowMs: 1700000060000 });
      expect(result.ok && result.data.execution.status).toBe("failed");
      expect(result.ok && result.data.advisory.status).toBe("escalated");
      expect(result.ok && result.data.automation.status).toBe("blocked");
      expect(result.ok && result.data.autonomy.status).toBe("requires_operator");
      expect(result.ok && result.data.verification.status).toBe("failed");
      expect(result.ok && result.data.learning.status).toBe("report_available");
      expect(result.ok && result.data.risk.requiresOperatorAttention).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("read model performs no mutation", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_14", "running");
      const before = {
        auditCount: events.length,
        activeExecutions: runtime.executionStateStore.countActiveExecutions?.() ?? runtime.executionStateStore.getResumableExecutions?.()?.length ?? 0,
      };
      const result = await runtime.buildRecoveryReadModel({ executionId: "exec_14", nowMs: 1700000000000 });
      expect(result.ok).toBe(true);
      const after = {
        auditCount: events.length,
        activeExecutions: runtime.executionStateStore.countActiveExecutions?.() ?? runtime.executionStateStore.getResumableExecutions?.()?.length ?? 0,
      };
      expect(after).toEqual(before);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });
});
