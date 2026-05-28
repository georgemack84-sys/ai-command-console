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
  const { buildRecoveryTimeline } = await import("../../services/recovery/recoveryTimelineBuilder.ts");

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
    buildRecoveryTimeline,
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

describe("recovery timeline builder integration", () => {
  it("full lifecycle timeline", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_t1", "running");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_t1", eventType: "execution.started", payload: {} });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t1", nowMs: 1700000000000 });
      expect(result.ok && result.data.events.some((event) => event.type === "execution_started")).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("failure -> advisory -> request -> recovery -> verification", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_t2", "failed");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_t2", eventType: "execution.failed", payload: {} });
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_t2", executionId: "exec_t2", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      runtime.recoveryAdvisoryStore.recordAdvisoryRequestCreated({ advisoryId: "adv_t2", executionId: "exec_t2", requestedBy: "operator_1", recoveryRequest: { recoveryRequestId: "recovery_t2" } });
      runtime.recoveryAuditStore.recordRecoveryRequest({ recoveryRequestId: "recovery_t2", executionId: "exec_t2", recoveryMode: "resume", requestedBy: "operator_1", plan: { executionId: "exec_t2", planId }, planHash: { token: "hash_t2" } });
      runtime.recoveryAuditStore.recordApproval({ recoveryRequestId: "recovery_t2", executionId: "exec_t2", approvedBy: "operator_2" });
      runtime.executionIntegrityStore.createExecutionAttempt({ planId, executionId: "exec_t2", stepId: "step_0", sideEffectClass: "unknown" });
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_t2", executionId: "exec_t2", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t2", nowMs: 1700000000000 });
      expect(result.ok && result.data.events.some((event) => event.type === "execution_failed")).toBe(true);
      expect(result.ok && result.data.events.some((event) => event.type === "advisory_request_created")).toBe(true);
      expect(result.ok && result.data.events.some((event) => event.type === "recovery_request_created")).toBe(true);
      expect(result.ok && result.data.events.some((event) => event.type === "recovery_approved")).toBe(true);
      expect(result.ok && result.data.events.some((event) => event.type === "recovery_attempt_started")).toBe(true);
      expect(result.ok && result.data.events.some((event) => event.type === "verification_passed")).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("automation + autonomy included", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_t3", "paused_for_review");
      runtime.recoveryAutomationStore.recordAutomationBlocked({ executionId: "exec_t3", advisoryId: "adv_t3", signalType: "FAILED_EXECUTION", recommendation: "operator_recovery", policy: { allowed: false }, requestedBy: "operator_1", reason: "cooldown" });
      runtime.recoveryAutonomyStore.recordAutonomyPolicyEvaluated({ recoveryRequestId: "recovery_t3", executionId: "exec_t3", policy: { action: "manual_approval_required", reason: "manual" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t3", nowMs: 1700000000000 });
      expect(result.ok && result.data.events.some((event) => event.source === "automation")).toBe(true);
      expect(result.ok && result.data.events.some((event) => event.source === "autonomy")).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("learning appears after verification", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_t4", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_t4", executionId: "exec_t4", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      runtime.recoveryLearningStore.recordLearningReportCreated({ report: { summary: "report", recommendations: [] }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t4", nowMs: 1700000000000 });
      const verificationEvent = result.ok ? result.data.events.find((event) => event.type === "verification_passed") : null;
      const learningEvent = result.ok ? result.data.events.find((event) => event.type === "learning_report_created") : null;
      expect(result.ok && verificationEvent && learningEvent && verificationEvent.timestamp <= learningEvent.timestamp).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("timeline matches 3.5A read model", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_t5", "failed");
      runtime.executionIntegrityStore.createExecutionAttempt({ planId, executionId: "exec_t5", stepId: "step_0", sideEffectClass: "unknown" });
      runtime.executionIntegrityStore.failExecutionAttempt(planId, "exec_t5", "step_0", 1, { code: "ERR" });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t5", nowMs: 1700000000000 });
      expect(result.ok && result.data.meta.matchesReadModel).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("mismatch sets matchesReadModel = false", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_t6", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_t6", executionId: "exec_t6", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t6", nowMs: 1700000000000 });
      expect(result.ok && result.data.meta.matchesReadModel).toBe(false);
      expect(result.ok && result.data.meta.warnings).toContain("TIMELINE_STATE_MISMATCH");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("timeline does not contradict read model", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_t7", "running");
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_t7", executionId: "exec_t7", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t7", nowMs: 1700000000000 });
      expect(result.ok && result.data.meta.matchesReadModel).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("read model performs no mutation", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_t8", "running");
      const before = events.length;
      const result = await runtime.buildRecoveryTimeline({ executionId: "exec_t8", nowMs: 1700000000000 });
      expect(result.ok).toBe(true);
      expect(events.length).toBe(before);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });
});
