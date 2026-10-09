import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeResearchAction = vi.fn().mockResolvedValue({ action: "review:create", output: "Created review." });

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RESEARCH_BRIDGE__ = {
  loadResearchActionService: () => ({ executeResearchAction }),
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RESEARCH_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed research routing", () => {
  beforeEach(() => {
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
      safeMode: {
        enabled: false,
        enteredAt: null,
        reason: null,
      },
      sequenceLearning: {
        status: "GAP_UNKNOWN_STRUCTURE",
      },
    });
    stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, reviewSurface.defaultReviewSurfaceState());
    stateDatabase.saveDocument("execution-backtests", {
      createdAt: now,
      updatedAt: now,
      derivedRecords: [],
    });
    stateDatabase.saveDocument(reviewSurface.LEARNING_STATE_KEY, reviewSurface.defaultLearningState());
  });

  it("dispatches reviewed research action IDs to the typed research service", async () => {
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "research:review-create",
        payload: { taskId: "task_1" },
        originalRequest: "review:create",
        source: "research_api",
        meta: {
          userId: "user_1",
          workspaceId: "workspace_1",
          userName: "Analyst",
          userEmail: "analyst@example.com",
          userRole: "admin",
        },
      },
      {
        actor: {
          id: "user_1",
          workspaceId: "workspace_1",
          name: "Analyst",
          email: "analyst@example.com",
          role: "admin",
        },
        identitySource: "human",
        modes: { confirmed: true },
      },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toBe("Created review.");
    expect(executeResearchAction).toHaveBeenCalledWith(
      { action: "review:create", payload: { taskId: "task_1" } },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1", role: "admin" }),
    );
  });
});
