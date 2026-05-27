import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const executionEnginePath = require.resolve("../../services/executionEngine.js");
const recoveryPlanBuilderPath = require.resolve("../../services/recoveryPlanBuilder.js");
const recoveryPreviewPath = require.resolve("../../services/recoveryPreview.js");
const recoveryCommitterPath = require.resolve("../../services/recoveryCommitter.js");
const toolRouterPath = require.resolve("../../services/toolRouter.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    recoveryCommitterPath,
    recoveryPreviewPath,
    recoveryPlanBuilderPath,
    executionEnginePath,
    executionIntegrityStorePath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
    toolRouterPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const recoveryPlanBuilder = require("../../services/recoveryPlanBuilder.js");
  const recoveryPreview = require("../../services/recoveryPreview.js");
  const recoveryCommitter = require("../../services/recoveryCommitter.js");
  const toolRouter = require("../../services/toolRouter.js");

  executionStateStore.clearExecutionStateForTests();
  toolRouter.route = vi.fn().mockResolvedValue("ok");

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    recoveryPlanBuilder,
    recoveryPreview,
    recoveryCommitter,
    toolRouter,
  };
}

function makePlan(stepCount = 2, overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_recovery_commit",
    steps: Array.from({ length: stepCount }, (_, index) => ({
      id: `step_${index}`,
      action: "read_file",
      payload: `file_${index}.txt`,
      metadata: {
        idempotent: true,
        retryStrategy: "safe",
        sideEffectClass: "pure_read",
      },
    })),
    ...overrides,
  };
}

function seedRunningSnapshot(executionStateStore: any, executionId: string, plan = makePlan(2), stepOverrides: Array<Record<string, unknown>> = []) {
  executionStateStore.startExecutionState(plan);
  executionStateStore.persistExecutionSnapshot({
    runId: executionId,
    planId: plan.id,
    globalState: "running",
    reviewStatus: "approved",
    triggerSource: "api",
    steps: plan.steps.map((step: any, index: number) => ({
      id: step.id,
      sequence: index + 1,
      stageId: "stage_1",
      status: index === 0 ? "completed" : "pending",
      action: step.action,
      kind: step.action,
      originalInput: step.payload,
      normalizedInput: step.payload,
      idempotencyClass: "safe_repeat",
      isIdempotent: true,
      sideEffects: [],
      ...stepOverrides[index],
    })),
    stages: [
      {
        id: "stage_1",
        sequence: 1,
        name: "Stage 1",
        status: "running",
      },
    ],
  });
  executionStateStore.checkpointAfterStep(plan.id, 0, plan.steps.length);
  return plan;
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("recovery committer", () => {
  it("uses preview only for dry run and mutates nothing", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview, recoveryCommitter } = loadRuntime();

    try {
      seedRunningSnapshot(executionStateStore, "exec_commit_dry_run");
      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_commit_dry_run",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);
      const preview = recoveryPreview.previewRecoveryPlan({ plan: built.data });
      expect(preview.ok).toBe(true);

      const before = stateDatabase.withDatabase((db: any) => ({
        ledger: db.prepare("SELECT COUNT(*) AS total FROM execution_ledger").get().total,
        locks: db.prepare("SELECT COUNT(*) AS total FROM execution_locks").get().total,
        audits: db.prepare("SELECT COUNT(*) AS total FROM audit_events").get().total,
      }));

      const result = await recoveryCommitter.commitRecoveryPlan({
        plan: {
          ...built.data,
          staleToken: preview.data.staleToken,
        },
        requestedBy: "operator_1",
        dryRun: true,
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            committed: false,
            dryRun: true,
            preview: expect.any(Object),
          }),
        }),
      );

      const after = stateDatabase.withDatabase((db: any) => ({
        ledger: db.prepare("SELECT COUNT(*) AS total FROM execution_ledger").get().total,
        locks: db.prepare("SELECT COUNT(*) AS total FROM execution_locks").get().total,
        audits: db.prepare("SELECT COUNT(*) AS total FROM audit_events").get().total,
      }));

      expect(after).toEqual(before);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("blocks stale commits when the state token has changed", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview, recoveryCommitter } = loadRuntime();

    try {
      const plan = seedRunningSnapshot(executionStateStore, "exec_commit_stale");
      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_commit_stale",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);
      const preview = recoveryPreview.previewRecoveryPlan({ plan: built.data });
      expect(preview.ok).toBe(true);

      executionStateStore.checkpointAfterStep(plan.id, 1, 2);

      const result = await recoveryCommitter.commitRecoveryPlan({
        plan: {
          ...built.data,
          staleToken: preview.data.staleToken,
        },
        requestedBy: "operator_1",
        dryRun: false,
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "STALE_RECOVERY_PLAN",
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("commits a resume recovery boundary and writes the recovery ledger event", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview, recoveryCommitter, toolRouter } = loadRuntime();

    try {
      seedRunningSnapshot(executionStateStore, "exec_commit_resume");
      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_commit_resume",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);
      const preview = recoveryPreview.previewRecoveryPlan({ plan: built.data });
      expect(preview.ok).toBe(true);
      expect(preview.data.blocked).toBe(false);

      const result = await recoveryCommitter.commitRecoveryPlan({
        plan: {
          ...built.data,
          staleToken: preview.data.staleToken,
        },
        requestedBy: "operator_7",
        dryRun: false,
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            committed: true,
            recoveryMode: "resume",
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const persisted = executionStateStore.loadLatestExecutionStateForPlan("plan_recovery_commit");
      expect(persisted.execution.status).toBe("running");

      const ledger = stateDatabase.withDatabase((db: any) =>
        db.prepare("SELECT event_type AS eventType FROM execution_ledger WHERE plan_id = ? ORDER BY id ASC").all("plan_recovery_commit")
      );
      expect(ledger).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventType: "recovery.commit.started" }),
          expect.objectContaining({ eventType: "recovery.resume.applied" }),
        ]),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("blocks commit when preview marks replay as unsafe", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview, recoveryCommitter } = loadRuntime();

    try {
      const plan = makePlan(2);
      seedRunningSnapshot(executionStateStore, "exec_commit_blocked", plan, [
        {},
        {
          idempotencyClass: "unsafe_repeat",
          isIdempotent: false,
          sideEffects: ["filesystem"],
        },
      ]);
      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_commit_blocked",
        recoveryMode: "retry_safe_steps",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);
      const preview = recoveryPreview.previewRecoveryPlan({ plan: built.data });
      expect(preview.ok).toBe(true);
      expect(preview.data.blocked).toBe(true);

      const result = await recoveryCommitter.commitRecoveryPlan({
        plan: {
          ...built.data,
          staleToken: preview.data.staleToken,
        },
        requestedBy: "operator_9",
        dryRun: false,
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "RECOVERY_COMMIT_BLOCKED",
        }),
      );

      const ledger = stateDatabase.withDatabase((db: any) =>
        db.prepare("SELECT event_type AS eventType FROM execution_ledger WHERE plan_id = ? ORDER BY id ASC").all("plan_recovery_commit")
      );
      expect(ledger).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventType: "recovery.commit.blocked" }),
        ]),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});
