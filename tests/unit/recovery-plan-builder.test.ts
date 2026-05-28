import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const executionEnginePath = require.resolve("../../services/executionEngine.js");
const recoveryPlanBuilderPath = require.resolve("../../services/recoveryPlanBuilder.js");
const toolRouterPath = require.resolve("../../services/toolRouter.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
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
  const executionEngine = require("../../services/executionEngine.js");
  const recoveryPlanBuilder = require("../../services/recoveryPlanBuilder.js");
  const toolRouter = require("../../services/toolRouter.js");

  executionStateStore.clearExecutionStateForTests();
  toolRouter.route = vi.fn().mockResolvedValue("ok");

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    executionEngine,
    recoveryPlanBuilder,
    toolRouter,
  };
}

function makePlan(stepCount = 2) {
  return {
    id: "plan_recovery_builder",
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
  };
}

function seedSnapshot(executionStateStore: any, executionId: string, plan = makePlan(2)) {
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

describe("recovery plan builder", () => {
  it("builds a recovery plan after successful preflight", async () => {
    const { stateDatabase, executionStateStore, recoveryPlanBuilder } = loadRuntime();

    try {
      const plan = seedSnapshot(executionStateStore, "exec_builder_ok");

      const result = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_builder_ok",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            executionId: "exec_builder_ok",
            planId: plan.id,
            recoveryMode: "resume",
            checkpoint: expect.objectContaining({
              currentStep: 1,
              status: "running",
            }),
            nextStep: expect.objectContaining({
              id: "step_1",
            }),
            source: expect.objectContaining({
              preflight: expect.objectContaining({
                eligible: true,
              }),
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("fails closed when the execution snapshot cannot be found", async () => {
    const { stateDatabase, recoveryPlanBuilder } = loadRuntime();

    try {
      const result = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "missing_exec",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_NOT_FOUND",
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("fails closed when preflight reports the execution is still active", async () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, recoveryPlanBuilder } = loadRuntime();

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_builder_live",
        planId: plan.id,
        globalState: "running",
        reviewStatus: "approved",
        triggerSource: "api",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "running",
            action: "read_file",
            kind: "read_file",
            originalInput: "file_0.txt",
            normalizedInput: "file_0.txt",
            idempotencyClass: "safe_repeat",
            isIdempotent: true,
            sideEffects: [],
          },
          {
            id: "step_1",
            sequence: 2,
            stageId: "stage_1",
            status: "pending",
            action: "read_file",
            kind: "read_file",
            originalInput: "file_1.txt",
            normalizedInput: "file_1.txt",
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
            status: "running",
          },
        ],
      });
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_builder_live");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_builder_live",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });

      const result = await recoveryPlanBuilder.buildRecoveryPlan({
        executionId: "exec_builder_live",
        recoveryMode: "resume",
        modes: {
          executionMode: "auto_execute",
          controlApproved: true,
          triggerSource: "api",
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_ACTIVE",
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});
