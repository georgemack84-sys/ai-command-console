import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

vi.mock("../../services/auditTrail", () => ({
  appendAuditEvent: vi.fn((event: Record<string, unknown>) => ({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...event,
  })),
  listAuditEvents: vi.fn(() => []),
  clearAuditEvents: vi.fn(),
}));

vi.mock("../../services/toolRouter", () => ({
  route: vi.fn(),
}));

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionReconciliationPath = require.resolve("../../services/executionReconciliation.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const reviewSurfacePath = require.resolve("../../services/reviewSurface.js");
const operatorRecoveryPath = require.resolve("../../services/operatorRecovery.js");
const stepControllerPath = require.resolve("../../services/stepController.js");
const executionEnginePath = require.resolve("../../services/executionEngine.js");

function loadRuntime() {
  vi.doUnmock("../../services/executionIntegrityStore.js");
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    executionEnginePath,
    executionReconciliationPath,
    executionIntegrityStorePath,
    stepControllerPath,
    reviewSurfacePath,
    operatorRecoveryPath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const executionEngine = require("../../services/executionEngine.js");
  const operatorRecovery = require("../../services/operatorRecovery.js");
  const toolRouter = require("../../services/toolRouter.js");

  executionStateStore.clearExecutionStateForTests();
  stateDatabase.saveDocument("execution-orchestration-state", {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    globalState: "idle",
    runs: [],
    bootstraps: [],
    approvalQueue: [],
    anomalies: [],
    safeMode: { enabled: false, enteredAt: null, reason: null },
    sequenceLearning: { status: "GAP_UNKNOWN_STRUCTURE" },
  });

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    executionEngine,
    operatorRecovery,
    toolRouter,
  };
}

function makePausedReviewPlan(planId = "plan_operator_review") {
  return {
    id: planId,
    type: "multi",
    originalRequest: "rewrite then continue",
    reviewStatus: "approved",
    currentStageExecutable: true,
    finalMode: "auto_execute",
    stages: [
      {
        id: "stage_1",
        name: "Inspect",
        steps: [
          {
            id: "rewrite_step",
            action: "read_file",
            payload: "notes.txt",
            originalInput: "cat notes.txt",
            normalizedInput: "Get-Content notes.txt",
          },
          {
            id: "followup_step",
            action: "read_file",
            payload: "summary.txt",
          },
        ],
      },
    ],
  };
}

function countPersistenceTables(stateDatabase: {
  withDatabase: <T>(work: (db: { prepare: (sql: string) => { get: () => T } }) => T) => T;
}) {
  return stateDatabase.withDatabase((db) => ({
    ledger: db.prepare("SELECT COUNT(*) AS total FROM execution_ledger").get().total,
    audit: db.prepare("SELECT COUNT(*) AS total FROM audit_events").get().total,
    idempotency: db.prepare("SELECT COUNT(*) AS total FROM operator_action_idempotency").get().total,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("operator recovery layer", () => {
  it("builds a read-only operator recovery surface from D-2 state", async () => {
    const { executionEngine, operatorRecovery, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(makePausedReviewPlan(), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(paused.paused).toBe(true);
      const surface = operatorRecovery.getOperatorRecoverySurface("plan_operator_review");
      expect(surface).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_operator_review",
            status: "paused",
            whyPaused: expect.any(String),
            currentFocus: expect.objectContaining({
              stage: expect.objectContaining({ id: "stage_1" }),
              step: expect.objectContaining({
                id: "rewrite_step",
                sideEffectSafety: expect.objectContaining({
                  class: "pure_read",
                  replaySafety: "safe",
                }),
              }),
            }),
            safeActions: expect.arrayContaining([
              expect.objectContaining({
                action: "approve_resume",
                allowed: true,
                usesLocking: true,
                usesIdempotency: true,
              }),
              expect.objectContaining({
                action: "cancel_execution",
                constraints: expect.arrayContaining([expect.stringContaining("Terminal transition")]),
              }),
            ]),
            recommendedAction: expect.objectContaining({
              action: "approve_resume",
              reason: expect.any(String),
              basis: expect.objectContaining({
                activeStepId: "rewrite_step",
              }),
            }),
            recommendedAlternatives: expect.arrayContaining([
              expect.objectContaining({
                action: "modify_resume",
                whyNotRecommended: expect.any(String),
              }),
            ]),
            timelineSummary: expect.objectContaining({
              totalEvents: expect.any(Number),
              latestEventType: expect.any(String),
            }),
            timelineNarrative: expect.arrayContaining([
              expect.stringContaining("Execution is currently paused"),
              expect.stringContaining("Active step: rewrite_step"),
            ]),
            recommendationContext: expect.objectContaining({
              pauseReason: expect.any(String),
              sideEffectSafety: expect.objectContaining({
                class: "pure_read",
              }),
            }),
            riskLevel: expect.any(String),
            timeline: expect.any(Array),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("previews operator recovery actions without writing DB state or audit", async () => {
    const { executionEngine, operatorRecovery, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(makePausedReviewPlan("plan_operator_preview"), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });
      expect(paused.paused).toBe(true);

      const before = countPersistenceTables(stateDatabase);
      const preview = operatorRecovery.previewOperatorRecoveryAction("plan_operator_preview", "approve_resume");
      const after = countPersistenceTables(stateDatabase);

      expect(preview).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            action: "approve_resume",
            allowed: true,
            preview: expect.objectContaining({
              willWrite: false,
              whyRecommended: expect.any(String),
              alternativeSummary: expect.any(Array),
            }),
            surface: expect.objectContaining({
              safeActions: expect.arrayContaining([
                expect.objectContaining({
                  action: "approve_resume",
                  notes: expect.arrayContaining([expect.stringContaining("Resumes execution")]),
                }),
              ]),
            }),
          }),
        }),
      );
      expect(after).toEqual(before);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("applies approve_resume through resumeExecution and releases the persisted lock", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, operatorRecovery, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(makePausedReviewPlan("plan_operator_resume"), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });
      expect(paused.paused).toBe(true);

      const result = await operatorRecovery.applyOperatorRecoveryAction(
        "plan_operator_resume",
        "approve_resume",
        {
          operatorId: "operator_1",
          idempotencyKey: "resume_key_1",
        },
      );

      expect(result.ok).toBe(true);
      const persisted = executionStateStore.loadLatestExecutionStateForPlan("plan_operator_resume");
      expect(persisted.execution.status).toBe("completed");
      expect(persisted.auditTimeline.map((entry: { eventType: string }) => entry.eventType)).toEqual(
        expect.arrayContaining(["review.approved", "execution.completed"]),
      );

      const ledger = executionIntegrityStore.listLedgerEvents("plan_operator_resume");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.resumed" }),
            expect.objectContaining({ eventType: "execution.completed" }),
          ]),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks("plan_operator_resume");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: paused.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("replays cancel_execution idempotently", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, operatorRecovery, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(makePausedReviewPlan("plan_operator_cancel"), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });
      expect(paused.paused).toBe(true);

      const first = await operatorRecovery.applyOperatorRecoveryAction(
        "plan_operator_cancel",
        "cancel_execution",
        {
          operatorId: "operator_2",
          reason: "Operator chose to cancel.",
          idempotencyKey: "cancel_key_1",
        },
      );
      const countsAfterFirst = countPersistenceTables(stateDatabase);
      const second = await operatorRecovery.applyOperatorRecoveryAction(
        "plan_operator_cancel",
        "cancel_execution",
        {
          operatorId: "operator_2",
          reason: "Operator chose to cancel.",
          idempotencyKey: "cancel_key_1",
        },
      );
      const countsAfterSecond = countPersistenceTables(stateDatabase);

      expect(first).toEqual(second);
      expect(countsAfterSecond).toEqual(countsAfterFirst);
      expect(executionStateStore.loadExecutionCheckpoint("plan_operator_cancel")).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "cancelled",
          }),
        }),
      );
      expect(executionIntegrityStore.listLedgerEvents("plan_operator_cancel")).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "execution.cancelled" }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("retries a failed step using the original stored input and writes an operator audit event", async () => {
    const {
      executionIntegrityStore,
      executionStateStore,
      operatorRecovery,
      toolRouter,
      stateDatabase,
    } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const planId = "plan_operator_retry";
      const executionId = "exec_operator_retry";

      expect(executionStateStore.startExecutionState({ id: planId, steps: [{ id: "step_retry", action: "read_file", payload: "notes.txt" }] }).ok).toBe(true);
      expect(executionStateStore.setExecutionCheckpointStatus(planId, "failed", { currentStep: 0, lastCompletedStepIndex: -1 }).ok).toBe(true);
      executionStateStore.persistExecutionSnapshot(
        {
          runId: executionId,
          planId,
          globalState: "error",
          reviewStatus: "pending",
          triggerSource: "api",
          steps: [
            {
              id: "step_retry",
              sequence: 1,
              stageId: "stage_1",
              status: "failed",
              action: "read_file",
              originalInput: "notes.txt",
              normalizedInput: "notes.txt",
              errorType: "execution_failure",
              error: "boom",
              idempotencyClass: "safe_repeat",
            },
          ],
          stages: [
            {
              id: "stage_1",
              sequence: 1,
              name: "Retry Stage",
              status: "failed",
            },
          ],
        },
        {
          triggerSource: "api",
          auditEvents: [
            {
              executionId,
              stepId: "step_retry",
              eventType: "step.failed",
              payload: { error: "boom" },
            },
            {
              executionId,
              eventType: "execution.failed",
              payload: { reason: "boom" },
            },
          ],
        },
      );

      const result = await operatorRecovery.applyOperatorRecoveryAction(
        planId,
        "retry_step",
        {
          operatorId: "operator_3",
          reason: "Verified original input is safe to rerun.",
          idempotencyKey: "retry_key_1",
          stepId: "step_retry",
        },
      );

      expect(result.ok).toBe(true);
      expect(toolRouter.route).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "step_retry",
          payload: "notes.txt",
        }),
        expect.any(Object),
      );

      const persisted = executionStateStore.loadLatestExecutionStateForPlan(planId);
      expect(persisted.execution.status).toBe("completed");
      expect(persisted.auditTimeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: "operator.retry_requested",
            eventPayload: expect.objectContaining({
              actorId: "operator_3",
              originalInput: "notes.txt",
            }),
          }),
        ]),
      );

      const locks = executionIntegrityStore.listExecutionLocks(planId);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rejects operator cancel once an execution is already terminal", async () => {
    const { executionStateStore, stateDatabase } = loadRuntime();

    try {
      const planId = "plan_operator_terminal_guard";
      const executionId = "exec_operator_terminal_guard";

      expect(
        executionStateStore.startExecutionState({
          id: planId,
          steps: [{ id: "step_done", action: "read_file", payload: "notes.txt" }],
        }).ok,
      ).toBe(true);
      expect(
        executionStateStore.setExecutionCheckpointStatus(
          planId,
          "completed",
          { currentStep: 1, lastCompletedStepIndex: 0 },
        ).ok,
      ).toBe(true);
      executionStateStore.persistExecutionSnapshot({
        runId: executionId,
        planId,
        globalState: "completed",
        reviewStatus: "approved",
        triggerSource: "api",
        steps: [
          {
            id: "step_done",
            sequence: 1,
            stageId: "stage_1",
            status: "completed",
            action: "read_file",
            originalInput: "notes.txt",
            normalizedInput: "notes.txt",
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Done",
            status: "completed",
          },
        ],
      });

      const result = executionStateStore.applyOperatorRecoveryAction(planId, executionId, {
        action: "cancel_execution",
        operatorId: "operator_terminal",
        reason: "Too late",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "INVALID_TRANSITION",
          message: `Operator action "cancel_execution" is not allowed after execution ${executionId} reached terminal state.`,
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rejects operator retry unless the execution is actually paused for review", async () => {
    const { executionStateStore, stateDatabase } = loadRuntime();

    try {
      const planId = "plan_operator_nonreview_guard";
      const executionId = "exec_operator_nonreview_guard";

      expect(
        executionStateStore.startExecutionState({
          id: planId,
          steps: [{ id: "step_retry", action: "read_file", payload: "notes.txt" }],
        }).ok,
      ).toBe(true);
      expect(
        executionStateStore.setExecutionCheckpointStatus(
          planId,
          "running",
          { currentStep: 0, lastCompletedStepIndex: -1 },
        ).ok,
      ).toBe(true);
      executionStateStore.persistExecutionSnapshot({
        runId: executionId,
        planId,
        globalState: "running",
        reviewStatus: "approved",
        triggerSource: "api",
        steps: [
          {
            id: "step_retry",
            sequence: 1,
            stageId: "stage_1",
            status: "failed",
            action: "read_file",
            originalInput: "notes.txt",
            normalizedInput: "notes.txt",
            errorType: "execution_failure",
            error: "boom",
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Retry",
            status: "running",
          },
        ],
      });

      const result = executionStateStore.applyOperatorRecoveryAction(planId, executionId, {
        action: "retry_step",
        operatorId: "operator_nonreview",
        reason: "Try again",
        stepId: "step_retry",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "INVALID_TRANSITION",
          message: `Operator action "retry_step" is only allowed while execution ${executionId} is paused for review.`,
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});
