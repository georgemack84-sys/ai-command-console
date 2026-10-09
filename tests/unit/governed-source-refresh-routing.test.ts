import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeSourceRefreshAction = vi.fn().mockResolvedValue({ data: { job: { id: "job_1" } }, status: 202 });

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadSourceRefreshActionService: () => ({ executeSourceRefreshAction }),
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed source refresh routing", () => {
  beforeEach(() => {
    executeSourceRefreshAction.mockClear();
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

  it("dispatches confirmed refresh admission through the typed service", async () => {
    const actor = {
      id: "user_1",
      workspaceId: "workspace_1",
      name: "Manager",
      email: "manager@example.com",
      role: "admin",
    };
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "sources:refresh",
        payload: { sourceId: "source_1", confirmed: true },
        originalRequest: "refresh",
        source: "source_refresh_api",
        reviewAcknowledged: true,
        meta: {
          userId: actor.id,
          workspaceId: actor.workspaceId,
          userName: actor.name,
          userEmail: actor.email,
          userRole: actor.role,
        },
      },
      { actor, identitySource: "human", modes: { confirmed: true } },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ data: { job: { id: "job_1" } }, status: 202 });
    expect(executeSourceRefreshAction).toHaveBeenCalledWith(
      { sourceId: "source_1", confirmed: true },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1", role: "admin" }),
    );
  });
});
