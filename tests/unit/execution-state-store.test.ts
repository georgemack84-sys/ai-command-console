import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const stepControllerPath = require.resolve("../../services/stepController.js");
const reviewSurfacePath = require.resolve("../../services/reviewSurface.js");

type RuntimeModules = {
  stateDatabase: {
    closeDatabase: () => void;
    getDatabasePath: () => string;
  };
  executionStateStore: {
    clearExecutionStateForTests: () => boolean;
    getResumableExecutions: () => Array<Record<string, unknown>>;
    loadExecutionState: (executionId: string) => Record<string, unknown>;
    persistExecutionSnapshot: (run: Record<string, unknown>, options?: Record<string, unknown>) => unknown;
  };
  stepController: {
    appendExecutionLog: (run: Record<string, unknown>, entry: Record<string, unknown>) => Record<string, unknown>;
    commitRuntimeSnapshot: (run: Record<string, unknown>, reviewRecord?: Record<string, unknown> | null) => unknown;
    createStagedRun: (
      plan: Record<string, unknown>,
      modes?: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => Record<string, unknown>;
    setStepStatus: (run: Record<string, unknown>, stepId: string, status: string, extra?: Record<string, unknown>) => Record<string, unknown>;
  };
  reviewSurface: {
    resolveReview: (runId: string, status?: string) => unknown;
    stageReview: (
      runId: string,
      steps?: Array<Record<string, unknown>>,
      executionMode?: string,
      options?: Record<string, unknown>
    ) => unknown;
  };
};

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-phase34a-"));
}

function cleanupTempRoot(tempRoot: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
      return;
    } catch {
      if (attempt === 4) {
        return;
      }
    }
  }
}

function loadRuntimeModules(tempRoot: string): RuntimeModules {
  process.env = {
    ...originalEnv,
    AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
  };

  for (const modulePath of [
    reviewSurfacePath,
    stepControllerPath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  return {
    stateDatabase: require("../../services/stateDatabase.js"),
    executionStateStore: require("../../services/executionStateStore.js"),
    stepController: require("../../services/stepController.js"),
    reviewSurface: require("../../services/reviewSurface.js"),
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("execution state persistence", () => {
  it("persists executions, steps, pending reviews, and audit events", () => {
    const tempRoot = makeTempRoot();
    const { stateDatabase, executionStateStore, stepController } = loadRuntimeModules(tempRoot);

    try {
      executionStateStore.clearExecutionStateForTests();

      const run = stepController.createStagedRun(
        {
          runId: "exec_pending_review",
          triggerSource: "api",
          originalRequest: "Inspect the workspace",
          steps: [
            {
              id: "step_read",
              sequence: 1,
              actionClass: "read",
              action: "list",
              tool: "shell",
              description: "List files in the workspace",
              idempotencyClass: "safe_repeat",
            },
          ],
        },
        { triggerSource: "api", executionMode: "simulate" },
        { timeoutMs: 1000 }
      );

      stepController.commitRuntimeSnapshot(run, {
        runId: run.runId,
        status: "pending",
        reviewMode: "standard",
        steps: [
          {
            stepId: "step_read",
            commandPreview: "Get-ChildItem",
            intent: "List files in the workspace",
          },
        ],
      });

      const state = executionStateStore.loadExecutionState(String(run.runId)) as {
        execution: Record<string, unknown>;
        steps: Array<Record<string, unknown>>;
        pendingReviews: Array<Record<string, unknown>>;
        auditTimeline: Array<{ eventType: string }>;
      };

      expect(state.execution.id).toBe("exec_pending_review");
      expect(state.execution.triggerSource).toBe("api");
      expect(state.steps.map((step) => step.id)).toEqual(["step_read"]);
      expect(state.pendingReviews).toHaveLength(1);
      expect(state.auditTimeline.map((entry) => entry.eventType)).toEqual(
        expect.arrayContaining(["execution.created", "step.created", "review.requested"])
      );
    } finally {
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });

  it("tracks lifecycle state and returns only resumable executions", () => {
    const tempRoot = makeTempRoot();
    const { stateDatabase, executionStateStore, stepController } = loadRuntimeModules(tempRoot);

    try {
      executionStateStore.clearExecutionStateForTests();

      let run = stepController.createStagedRun(
        {
          runId: "exec_lifecycle",
          triggerSource: "cli",
          originalRequest: "Run a safe read",
          steps: [
            {
              id: "step_scan",
              sequence: 1,
              actionClass: "read",
              action: "scan",
              tool: "shell",
              description: "Scan the workspace",
            },
          ],
        },
        { triggerSource: "cli", executionMode: "safe_execute" },
        { timeoutMs: 1000 }
      );

      run = stepController.appendExecutionLog(
        {
          ...run,
          globalState: "running",
        },
        {
          eventType: "execution_start",
          status: "running",
          timestamp: Date.now(),
        }
      );
      run = stepController.setStepStatus(run, "step_scan", "running", {
        startedAt: new Date().toISOString(),
      });

      const resumableWhileRunning = executionStateStore.getResumableExecutions();
      expect(resumableWhileRunning.map((entry) => entry.id)).toContain("exec_lifecycle");

      run = stepController.setStepStatus(run, "step_scan", "completed", {
        finishedAt: new Date().toISOString(),
      });
      stepController.appendExecutionLog(
        {
          ...run,
          globalState: "idle",
        },
        {
          eventType: "verification",
          status: "completed",
          timestamp: Date.now(),
        }
      );

      const state = executionStateStore.loadExecutionState("exec_lifecycle") as {
        execution: Record<string, unknown>;
        steps: Array<Record<string, unknown>>;
        auditTimeline: Array<{ eventType: string }>;
      };

      expect(state.execution.status).toBe("completed");
      expect(state.steps[0]?.status).toBe("completed");
      expect(state.auditTimeline.map((entry) => entry.eventType)).toEqual(
        expect.arrayContaining(["execution.started", "step.started", "step.completed", "execution.completed"])
      );
      expect(executionStateStore.getResumableExecutions().map((entry) => entry.id)).not.toContain("exec_lifecycle");
    } finally {
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });

  it("prevents duplicate step sequences within one execution", () => {
    const tempRoot = makeTempRoot();
    const { stateDatabase, executionStateStore } = loadRuntimeModules(tempRoot);

    try {
      executionStateStore.clearExecutionStateForTests();

      expect(() =>
        executionStateStore.persistExecutionSnapshot(
          {
            runId: "exec_duplicate_sequence",
            triggerSource: "api",
            steps: [
              { id: "step_one", sequence: 1, status: "staged", description: "First" },
              { id: "step_two", sequence: 1, status: "staged", description: "Second" },
            ],
          },
          { triggerSource: "api" }
        )
      ).toThrow(/UNIQUE|sequence/i);
    } finally {
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });

  it("preserves original_text and rejects rerunning completed steps", () => {
    const tempRoot = makeTempRoot();
    const { stateDatabase, executionStateStore } = loadRuntimeModules(tempRoot);

    try {
      executionStateStore.clearExecutionStateForTests();

      executionStateStore.persistExecutionSnapshot(
        {
          runId: "exec_completed_step",
          triggerSource: "system",
          globalState: "idle",
          steps: [
            {
              id: "step_done",
              sequence: 1,
              status: "completed",
              description: "Initial immutable text",
              finishedAt: new Date().toISOString(),
            },
          ],
        },
        {
          triggerSource: "system",
          auditEvents: [
            {
              executionId: "exec_completed_step",
              stepId: "step_done",
              eventType: "step.completed",
              payload: { status: "completed" },
            },
          ],
        }
      );

      executionStateStore.persistExecutionSnapshot(
        {
          runId: "exec_completed_step",
          triggerSource: "system",
          globalState: "idle",
          steps: [
            {
              id: "step_done",
              sequence: 1,
              status: "completed",
              description: "Changed text should not replace the original",
              finishedAt: new Date().toISOString(),
            },
          ],
        },
        { triggerSource: "system" }
      );

      const loaded = executionStateStore.loadExecutionState("exec_completed_step") as {
        steps: Array<Record<string, unknown>>;
      };
      expect(loaded.steps[0]?.originalText).toBe("Initial immutable text");

      expect(() =>
        executionStateStore.persistExecutionSnapshot(
          {
            runId: "exec_completed_step",
            triggerSource: "system",
            globalState: "running",
            steps: [
              {
                id: "step_done",
                sequence: 1,
                status: "running",
                description: "Attempt to rerun completed step",
              },
            ],
          },
          { triggerSource: "system" }
        )
      ).toThrow(/Invalid (step|execution) status transition/i);
    } finally {
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });

  it("reconstructs resumable execution state after restart", () => {
    const tempRoot = makeTempRoot();
    const firstLoad = loadRuntimeModules(tempRoot);

    try {
      firstLoad.executionStateStore.clearExecutionStateForTests();
      firstLoad.executionStateStore.persistExecutionSnapshot(
        {
          runId: "exec_restart_recovery",
          triggerSource: "webhook",
          globalState: "running",
          steps: [
            {
              id: "step_completed",
              sequence: 1,
              status: "completed",
              description: "Completed before restart",
              finishedAt: new Date().toISOString(),
              dependsOn: [],
            },
            {
              id: "step_running",
              sequence: 2,
              status: "running",
              description: "Running during restart",
              startedAt: new Date().toISOString(),
              dependsOn: ["step_completed"],
            },
          ],
        },
        {
          triggerSource: "webhook",
          auditEvents: [
            {
              executionId: "exec_restart_recovery",
              eventType: "execution.started",
              payload: { status: "running" },
            },
          ],
        }
      );

      firstLoad.reviewSurface.stageReview(
        "exec_restart_recovery",
        [{ stepId: "step_running", commandPreview: "Invoke-RestMethod", intent: "Continue webhook task" }],
        "confirm_required",
        { reviewMode: "deep" }
      );
    } finally {
      firstLoad.stateDatabase.closeDatabase();
    }

    const secondLoad = loadRuntimeModules(tempRoot);
    try {
      const reconstructed = secondLoad.executionStateStore.loadExecutionState("exec_restart_recovery") as {
        execution: Record<string, unknown>;
        steps: Array<Record<string, unknown>>;
        pendingReviews: Array<Record<string, unknown>>;
      };

      expect(reconstructed.execution.status).toBe("running");
      expect(reconstructed.steps.map((step) => [step.id, step.status])).toEqual([
        ["step_completed", "completed"],
        ["step_running", "running"],
      ]);
      expect(reconstructed.steps[1]?.dependsOnStepIds).toEqual(["step_completed"]);
      expect(reconstructed.pendingReviews).toHaveLength(1);
      expect(secondLoad.executionStateStore.getResumableExecutions().map((entry) => entry.id)).toContain(
        "exec_restart_recovery"
      );
    } finally {
      secondLoad.stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });

  it("rejects unsupported strict audit event types", () => {
    const tempRoot = makeTempRoot();
    const { stateDatabase, executionStateStore } = loadRuntimeModules(tempRoot);

    try {
      executionStateStore.clearExecutionStateForTests();

      expect(() =>
        executionStateStore.persistExecutionSnapshot(
          {
            runId: "exec_bad_audit",
            triggerSource: "system",
            steps: [{ id: "step_one", sequence: 1, status: "staged", description: "No-op" }],
          },
          {
            triggerSource: "system",
            auditEvents: [
              {
                executionId: "exec_bad_audit",
                eventType: "execution.unknown",
                payload: {},
              },
            ],
          }
        )
      ).toThrow(/GAP DETECTED/i);
    } finally {
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });
});
