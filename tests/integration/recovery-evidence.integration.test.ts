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
  const recoveryVerificationStore = require("../../services/recoveryVerificationStore.js");
  const recoveryLearningStore = require("../../services/recoveryLearningStore.js");
  const operatorController = await import("../../controllers/recoveryOperatorController.ts");
  const { buildRecoveryEvidenceBundle } = await import("../../services/recovery/recoveryEvidenceBuilder.ts");
  const { exportRecoveryEvidence } = await import("../../services/recovery/recoveryEvidenceExporter.ts");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    recoveryAuditStore,
    recoveryAdvisoryStore,
    recoveryVerificationStore,
    recoveryLearningStore,
    operatorController,
    buildRecoveryEvidenceBundle,
    exportRecoveryEvidence,
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

describe("recovery evidence integration", () => {
  it("normal lifecycle -> state = normal", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_ev_1", "failed");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_ev_1", eventType: "execution.failed", payload: {} });
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_ev_1", executionId: "exec_ev_1", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      runtime.recoveryAdvisoryStore.recordAdvisoryRequestCreated({ advisoryId: "adv_ev_1", executionId: "exec_ev_1", requestedBy: "operator_1", recoveryRequest: { recoveryRequestId: "recovery_ev_1" } });
      runtime.recoveryAuditStore.recordRecoveryRequest({ recoveryRequestId: "recovery_ev_1", executionId: "exec_ev_1", recoveryMode: "resume", requestedBy: "operator_1", plan: { executionId: "exec_ev_1", planId }, planHash: { token: "hash_1" } });
      runtime.recoveryAuditStore.recordApproval({ recoveryRequestId: "recovery_ev_1", executionId: "exec_ev_1", approvedBy: "operator_1" });
      runtime.executionIntegrityStore.createExecutionAttempt({ planId, executionId: "exec_ev_1", stepId: "step_0", sideEffectClass: "unknown" });
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_ev_1", executionId: "exec_ev_1", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_1", nowMs: 1700000000000 });
      expect(result.ok && result.data.state).toBe("normal");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("mismatch scenario -> state = disputed", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_ev_2", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_ev_2", executionId: "exec_ev_2", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const result = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_2", nowMs: 1700000000000 });
      expect(result.ok && result.data.state).toBe("disputed");
      expect(result.ok && result.data.integrity.matchesReadModel).toBe(false);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("mismatch still exports evidence", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_ev_3", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_ev_3", executionId: "exec_ev_3", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const bundle = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_3", nowMs: 1700000000000 });
      expect(bundle.ok).toBe(true);
      if (!bundle.ok) return;
      const exported = runtime.exportRecoveryEvidence(bundle.data, "markdown");
      expect(exported.ok).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("hash stable across runs", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_ev_4", "failed");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_ev_4", eventType: "execution.failed", payload: {} });
      const first = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_4", nowMs: 1700000000000 });
      const second = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_4", nowMs: 1700000000000 });
      expect(first.ok && second.ok && first.data.integrity.hash).toBe(second.ok ? second.data.integrity.hash : "");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("bundle reflects read model + timeline", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_ev_5", "failed");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_ev_5", eventType: "execution.failed", payload: {} });
      const result = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_5", nowMs: 1700000000000 });
      expect(result.ok && result.data.readModel.executionId).toBe("exec_ev_5");
      expect(result.ok && result.data.timeline.executionId).toBe("exec_ev_5");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("operator-view VIEW_EVIDENCE aligns with export behavior", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_ev_6", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({ recoveryRequestId: "recovery_ev_6", executionId: "exec_ev_6", verification: { outcome: "VERIFIED", verified: true, reason: "ok" }, requestedBy: "operator_1" });
      const view = await runtime.operatorController.getRecoveryOperatorView({ executionId: "exec_ev_6", nowMs: 1700000000000 });
      const evidence = await runtime.buildRecoveryEvidenceBundle({ executionId: "exec_ev_6", nowMs: 1700000000000 });
      expect(view.ok && view.data.allowedActions.find((action: any) => action.action === "VIEW_EVIDENCE")?.allowed).toBe(true);
      expect(evidence.ok).toBe(true);
      if (!evidence.ok) return;
      const exported = runtime.exportRecoveryEvidence(evidence.data, "json");
      expect(exported.ok).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });
});
