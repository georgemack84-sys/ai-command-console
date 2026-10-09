import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeDashboardAction = vi.fn().mockResolvedValue({
  action: "alert:acknowledge",
  output: "Acknowledged alert.",
});

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadDashboardActionService: () => ({ executeDashboardAction }),
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed dashboard routing", () => {
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
      safeMode: { enabled: false, enteredAt: null, reason: null },
      sequenceLearning: { status: "GAP_UNKNOWN_STRUCTURE" },
    });
    stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, reviewSurface.defaultReviewSurfaceState());
    stateDatabase.saveDocument("execution-backtests", { createdAt: now, updatedAt: now, derivedRecords: [] });
    stateDatabase.saveDocument(reviewSurface.LEARNING_STATE_KEY, reviewSurface.defaultLearningState());
  });

  it("dispatches reviewed dashboard action IDs to the typed dashboard service", async () => {
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "dashboard:alert-acknowledge",
        payload: { alertId: "alert_1", owner: "dashboard" },
        originalRequest: "alert:acknowledge",
        source: "dashboard_api",
        meta: {
          userId: "user_1",
          workspaceId: "workspace_1",
          userName: "Operator",
          userEmail: "operator@example.com",
          userRole: "admin",
        },
      },
      {
        actor: {
          id: "user_1",
          workspaceId: "workspace_1",
          name: "Operator",
          email: "operator@example.com",
          role: "admin",
        },
        identitySource: "human",
        modes: { confirmed: true },
      },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toBe("Acknowledged alert.");
    expect(executeDashboardAction).toHaveBeenCalledWith(
      { action: "alert:acknowledge", payload: { alertId: "alert_1", owner: "dashboard" } },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1", role: "admin" }),
    );
  });
});
