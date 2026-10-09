import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeAdminAccessAction = vi.fn().mockResolvedValue({
  data: { user: { id: "user_2", status: "disabled" } },
});

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadAdminAccessActionService: () => ({ executeAdminAccessAction }),
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed admin routing", () => {
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

  it("dispatches reviewed admin action IDs to the typed admin service", async () => {
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "admin:user-status",
        payload: { type: "user-status", userId: "user_2", status: "disabled", confirmed: true },
        originalRequest: "user-status",
        source: "admin_access_api",
        meta: {
          userId: "admin_1",
          workspaceId: "workspace_1",
          userName: "Admin",
          userEmail: "admin@example.com",
          userRole: "admin",
        },
      },
      {
        actor: {
          id: "admin_1",
          workspaceId: "workspace_1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
        },
        identitySource: "human",
        modes: { confirmed: true },
      },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ data: { user: { id: "user_2", status: "disabled" } } });
    expect(executeAdminAccessAction).toHaveBeenCalledWith(
      { type: "user-status", userId: "user_2", status: "disabled", confirmed: true },
      expect.objectContaining({ id: "admin_1", workspaceId: "workspace_1", role: "admin" }),
    );
  });
});
