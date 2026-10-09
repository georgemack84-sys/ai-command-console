import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeAgentTaskAction = vi.fn().mockResolvedValue({
  data: { task: { id: "task_1" }, job: { id: "job_1" } },
  status: 201,
});

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadAgentTaskActionService: () => ({ executeAgentTaskAction }),
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed agent task routing", () => {
  beforeEach(() => {
    executeAgentTaskAction.mockClear();
    process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
    stateDatabase.closeDatabase();
    const now = new Date().toISOString();
    stateDatabase.saveDocument("execution-orchestration-state", {
      createdAt: now,
      updatedAt: now,
      globalState: "idle",
      runs: [],
      bootstraps: [],
      approvalQueue: [],
      anomalies: [],
      safeMode: { enabled: false, enteredAt: null, reason: null },
      sequenceLearning: { status: "GAP_UNKNOWN_STRUCTURE" },
    });
    stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, reviewSurface.defaultReviewSurfaceState());
    stateDatabase.saveDocument("execution-backtests", { createdAt: now, updatedAt: now, derivedRecords: [] });
    stateDatabase.saveDocument(reviewSurface.LEARNING_STATE_KEY, reviewSurface.defaultLearningState());
  });

  it("dispatches reviewed task admission through the typed service", async () => {
    const actor = {
      id: "user_1",
      workspaceId: "workspace_1",
      name: "Operator",
      email: "operator@example.com",
      role: "operator",
    };
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "agent-tasks:create",
        payload: { type: "research", runNow: true },
        originalRequest: "create",
        source: "agent_tasks_api",
        meta: {
          userId: actor.id,
          workspaceId: actor.workspaceId,
          userName: actor.name,
          userEmail: actor.email,
          userRole: actor.role,
        },
      },
      { actor, identitySource: "human", modes: { confirmed: false } },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ data: { task: { id: "task_1" }, job: { id: "job_1" } }, status: 201 });
    expect(executeAgentTaskAction).toHaveBeenCalledWith(
      { type: "research", runNow: true },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1", role: "operator" }),
    );
  });
});
