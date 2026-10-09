import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeResearchBriefMutation = vi.fn().mockResolvedValue({ data: { briefs: [] } });

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadResearchBriefMutationService: () => ({ executeResearchBriefMutation }),
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed research brief mutation routing", () => {
  beforeEach(() => {
    executeResearchBriefMutation.mockClear();
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

  it("dispatches confirmed brief routing through the typed service", async () => {
    const actor = {
      id: "user_1",
      workspaceId: "workspace_1",
      name: "Analyst",
      email: "analyst@example.com",
      role: "operator",
    };
    const payload = { id: "brief_1", routeToQueue: true };
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "research:briefs-route",
        payload,
        originalRequest: "route",
        source: "research_briefs_api",
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
    expect(result.result).toEqual({ data: { briefs: [] } });
    expect(executeResearchBriefMutation).toHaveBeenCalledWith(
      { action: "route", payload },
      expect.objectContaining({ id: actor.id, workspaceId: actor.workspaceId, role: actor.role }),
    );
  });
});
