import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const executionEnginePath = require.resolve("../../services/executionEngine.js");
const recoveryPlanBuilderPath = require.resolve("../../services/recoveryPlanBuilder.js");
const recoveryPreviewPath = require.resolve("../../services/recoveryPreview.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    recoveryPreviewPath,
    recoveryPlanBuilderPath,
    executionEnginePath,
    executionIntegrityStorePath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const recoveryPlanBuilder = require("../../services/recoveryPlanBuilder.js");
  const recoveryPreview = require("../../services/recoveryPreview.js");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    recoveryPlanBuilder,
    recoveryPreview,
  };
}

function makePlan(stepCount = 2, overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_recovery_preview",
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

function seedSnapshot(executionStateStore: any, executionId: string, plan = makePlan(2), stepOverrides: Array<Record<string, unknown>> = []) {
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

describe("recovery preview", () => {
  it("builds a read-only preview with stale token and explanation", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview } = loadRuntime();

    try {
      seedSnapshot(executionStateStore, "exec_preview_ok");
      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_preview_ok",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);

      const preview = recoveryPreview.previewRecoveryPlan({
        plan: built.data,
      });

      expect(preview).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            executionId: "exec_preview_ok",
            planId: "plan_recovery_preview",
            recoveryMode: "resume",
            staleToken: expect.objectContaining({
              executionStatus: expect.any(String),
              lockOwner: null,
              leaseExpiresAt: null,
              lastLedgerEventId: null,
              checkpointHash: expect.any(String),
              stepStateHash: expect.any(String),
              containmentHash: expect.any(String),
            }),
            explanation: expect.any(Object),
            replayCandidates: expect.any(Array),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not mutate runtime state during preview", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview } = loadRuntime();

    try {
      seedSnapshot(executionStateStore, "exec_preview_readonly");
      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_preview_readonly",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);

      const before = stateDatabase.withDatabase((db: any) => ({
        ledger: db.prepare("SELECT COUNT(*) AS total FROM execution_ledger").get().total,
        locks: db.prepare("SELECT COUNT(*) AS total FROM execution_locks").get().total,
        audits: db.prepare("SELECT COUNT(*) AS total FROM audit_events").get().total,
      }));

      const preview = recoveryPreview.previewRecoveryPlan({
        plan: built.data,
      });
      expect(preview.ok).toBe(true);

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

  it("classifies the replay candidate conservatively in preview", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder, recoveryPreview } = loadRuntime();

    try {
      const plan = makePlan(2);
      seedSnapshot(executionStateStore, "exec_preview_unsafe", plan, [
        {},
        {
          idempotencyClass: "unsafe_repeat",
          isIdempotent: false,
          sideEffects: ["filesystem"],
        },
      ]);

      const built = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_preview_unsafe",
        recoveryMode: "retry_safe_steps",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });
      expect(built.ok).toBe(true);

      const preview = recoveryPreview.previewRecoveryPlan({
        plan: built.data,
      });

      expect(preview).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            replayCandidates: expect.arrayContaining([
              expect.objectContaining({
                stepId: "step_1",
                classification: "UNSAFE_REPLAY",
              }),
            ]),
            blocked: true,
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});
