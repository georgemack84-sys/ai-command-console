import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const executeJobAction = vi.fn().mockResolvedValue({ data: { job: { id: "job_1" } }, status: 202 });
const executeReviewedJobProcessor = vi.fn().mockResolvedValue({ ok: true, processed: true });

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadJobActionService: () => ({ executeJobAction }),
  executeReviewedJobProcessor,
};

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__;
  stateDatabase.closeDatabase();
});

describe("governed job routing", () => {
  beforeEach(() => {
    executeJobAction.mockClear();
    executeReviewedJobProcessor.mockClear();
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

  it("dispatches reviewed jobs action IDs to the typed job service", async () => {
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
        action: "jobs:workspace-generate-insights",
        payload: { type: "workspace:generate-insights", confirmed: true },
        originalRequest: "workspace:generate-insights",
        source: "jobs_api",
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
    expect(executeJobAction).toHaveBeenCalledWith(
      { type: "workspace:generate-insights", confirmed: true },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1", role: "operator" }),
    );
  });

  it("dispatches reviewed worker execution through control, engine, and router authority", async () => {
    const actor = {
      id: "operator_1",
      workspaceId: "workspace_1",
      name: "Background job worker",
      email: "system@local",
      role: "system",
    };
    const result = await runtimeControl.executeControlledStructuredPlan(
      {
        type: "single",
        action: "jobs:execute-processor",
        payload: { jobId: "job_1", jobType: "workspace:generate-insights" },
        originalRequest: "execute background job workspace:generate-insights",
        source: "job_worker",
        meta: {
          userId: actor.id,
          workspaceId: actor.workspaceId,
          userName: actor.name,
          userEmail: actor.email,
          userRole: actor.role,
        },
      },
      { actor, identitySource: "system", modes: { confirmed: true } },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ ok: true, processed: true });
    expect(executeReviewedJobProcessor).toHaveBeenCalledWith(
      "job_1",
      expect.objectContaining({
        jobType: "workspace:generate-insights",
        reviewStatus: expect.stringMatching(/approved|downgraded|rewritten|split/),
        controlApproved: true,
        executionMode: "auto_execute",
      }),
    );
  });

});
