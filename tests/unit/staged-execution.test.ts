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
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const executionReconciliationPath = require.resolve("../../services/executionReconciliation.js");
const reviewSurfacePath = require.resolve("../../services/reviewSurface.js");
const stepControllerPath = require.resolve("../../services/stepController.js");
const executionEnginePath = require.resolve("../../services/executionEngine.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    executionEnginePath,
    executionReconciliationPath,
    stepControllerPath,
    reviewSurfacePath,
    executionIntegrityStorePath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const reviewSurface = require("../../services/reviewSurface.js");
  const executionEngine = require("../../services/executionEngine.js");
  const toolRouter = require("../../services/toolRouter.js");
  const auditTrail = require("../../services/auditTrail.js");

  executionStateStore.clearExecutionStateForTests();
  stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, reviewSurface.defaultReviewSurfaceState());
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
    reviewSurface,
    executionEngine,
    toolRouter,
    auditTrail,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("staged execution", () => {
  it("wraps flat plans into a default stage", async () => {
    const { executionEngine, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const result = await executionEngine.execute(
        {
          type: "single",
          id: "step_read",
          action: "read_file",
          payload: "notes.txt",
          originalRequest: "read notes",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result.ok).toBe(true);
      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.stages).toHaveLength(1);
      expect(state.stages[0]).toEqual(expect.objectContaining({ name: "Default Stage", status: "completed" }));
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("executes stages sequentially and logs stage lifecycle", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    const order: string[] = [];
    toolRouter.route = vi.fn().mockImplementation(async (step: { id: string }) => {
      order.push(step.id);
      return "ok";
    });

    try {
      const result = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "run staged work",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                { id: "s1_step1", action: "read_file", payload: "a.txt" },
                { id: "s1_step2", action: "read_file", payload: "b.txt" },
              ],
            },
            {
              id: "stage_2",
              name: "Apply",
              steps: [
                { id: "s2_step1", action: "write_file", payload: "c.txt", content: "x", reviewAcknowledged: true },
                { id: "s2_step2", action: "write_file", payload: "d.txt", content: "y", reviewAcknowledged: true },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result.ok).toBe(true);
      expect(order).toEqual(["s1_step1", "s1_step2", "s2_step1", "s2_step2"]);
      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.stages.map((stage: { status: string }) => stage.status)).toEqual(["completed", "completed"]);
      expect(state.auditTimeline.map((entry: { eventType: string }) => entry.eventType)).toEqual(
        expect.arrayContaining(["stage.started", "stage.completed"])
      );
      const attempts = executionIntegrityStore.listExecutionAttempts(result.run.planId, result.run.runId);
      expect(attempts).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ stepId: "s1_step1", attemptNumber: 1, status: "completed" }),
            expect.objectContaining({ stepId: "s2_step2", attemptNumber: 1, status: "completed" }),
          ]),
        }),
      );
      const ledger = executionIntegrityStore.listLedgerEvents(result.run.planId, result.run.runId);
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "execution.created" }),
            expect.objectContaining({ eventType: "execution.started" }),
            expect.objectContaining({ eventType: "stage.started" }),
            expect.objectContaining({ eventType: "stage.completed" }),
            expect.objectContaining({ eventType: "attempt.started", stepId: "s1_step1", attemptNumber: 1 }),
            expect.objectContaining({ eventType: "attempt.completed", stepId: "s2_step2", attemptNumber: 1 }),
            expect.objectContaining({ eventType: "execution.completed" }),
          ]),
        }),
      );
      const locks = executionIntegrityStore.listExecutionLocks(result.run.planId);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ planId: result.run.planId, executionId: result.run.runId, lockReleasedAt: expect.any(Number) }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses on rewritten steps and resumes from the paused step", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "run rewrite then continue",
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
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      expect(paused.reviewSurface).toEqual(
        expect.objectContaining({
          plan_id: paused.run.runId,
          pending_reviews: expect.arrayContaining([
            expect.objectContaining({ step_id: "rewrite_step", issue_type: "rewrite" }),
          ]),
        })
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
      const pausedLedger = executionIntegrityStore.listLedgerEvents(paused.run.planId, paused.run.runId);
      expect(pausedLedger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.paused_for_review" }),
            expect.objectContaining({ eventType: "execution.paused" }),
            expect.objectContaining({ eventType: "review.requested", stepId: "rewrite_step" }),
          ]),
        }),
      );

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed.ok).toBe(true);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual(["rewrite_step", "followup_step"]);
      const state = executionStateStore.loadExecutionState(paused.run.runId);
      expect(state.execution.status).toBe("completed");
      expect(reviewSurface.getReviewSurface(paused.run.runId).pending_reviews).toEqual([]);
      const resumedLedger = executionIntegrityStore.listLedgerEvents(paused.run.planId, paused.run.runId);
      expect(resumedLedger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.resumed" }),
            expect.objectContaining({ eventType: "execution.completed" }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("surfaces deferred steps for review", async () => {
    const { executionEngine, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const result = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "pause on deferred work",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                { id: "deferred_step", action: "read_file", payload: "notes.txt", deferred: true, deferReason: "manual_hold" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result.paused).toBe(true);
      expect(reviewSurface.getReviewSurface(result.run.runId).pending_reviews).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ step_id: "deferred_step", issue_type: "deferred" }),
        ])
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses for review before executing side-effecting steps without idempotency evidence", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const result = await executionEngine.execute(
        {
          type: "single",
          id: "network_step",
          action: "api_call",
          payload: "deploy",
          originalRequest: "run remote mutation",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          metadata: {
            idempotent: false,
            sideEffectClass: "network_call",
            sideEffects: ["network"],
          },
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          paused: true,
          error: "idempotency_key_required",
          run: expect.objectContaining({
            globalState: "paused",
            requiresReview: true,
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const checkpoint = executionStateStore.loadExecutionCheckpoint(result.run.planId);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );

      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
        }),
      );

      const ledger = executionIntegrityStore.listLedgerEvents(result.run.planId, result.run.runId);
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.paused_for_review" }),
            expect.objectContaining({ eventType: "execution.paused" }),
            expect.objectContaining({ eventType: "review.requested", stepId: "network_step" }),
          ]),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks(result.run.planId);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: result.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );

      expect(reviewSurface.getReviewSurface(result.run.runId)).toEqual(
        expect.objectContaining({
          pending_reviews: expect.arrayContaining([
            expect.objectContaining({
              step_id: "network_step",
              explanation: "idempotency_key_required",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses for review when execution lease ownership changes during a running step", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockImplementation(async () => {
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare(
          "UPDATE execution_locks SET execution_id = ?, worker_id = ?, lock_released_at = NULL WHERE plan_id = ?",
        ).run("exec_stolen", "worker_other", "plan_lease_loss");
        db.prepare(
          "UPDATE executions SET lease_owner = ?, lease_expires_at = ? WHERE id = ?",
        ).run("worker_other", Date.now() + 60000, "run_lease_loss");
      });
      return "ok";
    });

    try {
      const result = await executionEngine.execute(
        {
          type: "single",
          id: "run_lease_loss",
          planId: "plan_lease_loss",
          action: "read_file",
          payload: "notes.txt",
          originalRequest: "lose lease mid-step",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          paused: true,
          error: "lease_lost",
          run: expect.objectContaining({
            globalState: "paused",
            requiresReview: true,
          }),
        }),
      );
      expect(toolRouter.route).toHaveBeenCalledTimes(1);

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_lease_loss");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );

      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
        }),
      );

      const ledger = executionIntegrityStore.listLedgerEvents("plan_lease_loss", result.run.runId);
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.paused_for_review" }),
            expect.objectContaining({ eventType: "execution.paused" }),
            expect.objectContaining({ eventType: "review.requested", stepId: "run_lease_loss" }),
          ]),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks("plan_lease_loss");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_stolen",
              workerId: "worker_other",
              lockReleasedAt: null,
            }),
          ]),
        }),
      );

      expect(reviewSurface.getReviewSurface(result.run.runId)).toEqual(
        expect.objectContaining({
          pending_reviews: expect.arrayContaining([
            expect.objectContaining({
              step_id: "run_lease_loss",
              explanation: "lease_lost",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("stops downstream stages after a stage failure", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockImplementation(async (step: { id: string }) => {
      if (step.id === "fail_step") {
        throw new Error("boom");
      }
      return "ok";
    });

    try {
      const result = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "fail stage one",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              steps: [
                { id: "pass_step", action: "read_file", payload: "a.txt" },
                { id: "fail_step", action: "read_file", payload: "b.txt" },
              ],
            },
            {
              id: "stage_2",
              steps: [{ id: "never_runs", action: "read_file", payload: "c.txt" }],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result.ok).toBe(false);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual(["pass_step", "fail_step"]);
      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.stages.map((stage: { status: string }) => stage.status)).toEqual(["failed", "pending"]);
      const ledger = executionIntegrityStore.listLedgerEvents(result.run.planId, result.run.runId);
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.failed" }),
            expect.objectContaining({ eventType: "execution.failed" }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("atomically finalizes dependency failures with terminal ledger and released lock", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, stateDatabase } = loadRuntime();

    try {
      const result = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "missing dependency",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          steps: [
            {
              id: "step_2",
              action: "read_file",
              payload: "hello.txt",
              dependsOn: ["step_1"],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          error: "Execution blocked because prerequisite step_1 was not satisfied before step_2.",
          lockReleased: true,
        }),
      );

      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.execution.status).toBe("failed");
      const checkpoint = executionStateStore.loadExecutionCheckpoint(result.run.planId);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "failed",
          }),
        }),
      );

      const ledger = executionIntegrityStore.listLedgerEvents(result.run.planId, result.run.runId);
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "execution.failed" }),
          ]),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks(result.run.planId);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: result.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("atomically pauses for review when safe mode is already active", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    stateDatabase.saveDocument("execution-orchestration-state", {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      globalState: "safe_mode",
      runs: [],
      bootstraps: [],
      approvalQueue: [],
      anomalies: [],
      safeMode: {
        enabled: true,
        enteredAt: new Date().toISOString(),
        reason: "manual_test",
      },
      sequenceLearning: { status: "GAP_UNKNOWN_STRUCTURE" },
    });

    try {
      const result = await executionEngine.execute(
        {
          type: "single",
          id: "safe_mode_step",
          action: "read_file",
          payload: "notes.txt",
          originalRequest: "safe mode hold",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          forcedManualReview: true,
          error: "Execution held because safe_mode is active.",
          run: expect.objectContaining({
            globalState: "safe_mode",
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const checkpoint = executionStateStore.loadExecutionCheckpoint(result.run.planId);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );

      const state = executionStateStore.loadExecutionState(result.run.runId);
      expect(state.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
        }),
      );

      const ledger = executionIntegrityStore.listLedgerEvents(result.run.planId, result.run.runId);
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "execution.paused" }),
            expect.objectContaining({ eventType: "review.requested" }),
          ]),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks(result.run.planId);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: result.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );

      expect(reviewSurface.getReviewSurface(result.run.runId)).toEqual(
        expect.objectContaining({
          pending_reviews: expect.arrayContaining([
            expect.objectContaining({
              step_id: "safe_mode_step",
              explanation: "safe_mode_active",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("handles zero-stage plans, empty stages, non-paused resumes, and queued review history", async () => {
    const { executionEngine, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const zeroStages = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "empty",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );
      expect(zeroStages.ok).toBe(false);
      expect(zeroStages.error).toContain("zero stages");

      const withEmptyStage = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "empty stage first",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            { id: "stage_empty", steps: [] },
            { id: "stage_work", steps: [{ id: "work_step", action: "read_file", payload: "x.txt" }] },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );
      expect(withEmptyStage.ok).toBe(true);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toContain("work_step");

      const notPaused = await executionEngine.resumeExecution(withEmptyStage.run.runId, "operator_1", "approve");
      expect(notPaused.ok).toBe(false);
      expect(notPaused.error).toContain("not paused");

      const firstPause = await executionEngine.execute(
        {
          type: "multi",
          originalRequest: "two pauses",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_a",
              steps: [{ id: "pause_a", action: "read_file", payload: "a.txt", originalInput: "a", normalizedInput: "A" }],
            },
            {
              id: "stage_b",
              steps: [{ id: "pause_b", action: "read_file", payload: "b.txt", originalInput: "b", normalizedInput: "B" }],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );
      expect(firstPause.paused).toBe(true);

      const secondPause = await executionEngine.resumeExecution(firstPause.run.runId, "operator_1", "approve");
      expect(secondPause.paused).toBe(true);
      expect((reviewSurface.loadReviewSurfaceState().reviews || []).filter((review: { runId: string }) => review.runId === firstPause.run.runId).length)
        .toBeGreaterThanOrEqual(2);
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});
