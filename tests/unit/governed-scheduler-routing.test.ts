import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");

const SCHEDULER_ACTOR = {
  id: "system:agent-scheduler",
  workspaceId: "legacy-global",
  name: "Agent Scheduler",
  email: "agent-scheduler@local",
  role: "system",
};

function schedulerPlan(actor = SCHEDULER_ACTOR, source = "agent_scheduler") {
  return {
    type: "single",
    action: "scheduler:agent-tick",
    payload: { agentName: "planner" },
    originalRequest: "run scheduled tick for agent planner",
    source,
    meta: {
      userId: actor.id,
      workspaceId: actor.workspaceId,
      userName: actor.name,
      userEmail: actor.email,
      userRole: actor.role,
    },
  };
}

afterAll(() => {
  stateDatabase.closeDatabase();
});

describe("governed scheduler routing", () => {
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

  it("dispatches scheduler ticks through control, review, engine, and router", async () => {
    const result = await runtimeControl.executeControlledStructuredPlan(
      schedulerPlan(),
      { actor: SCHEDULER_ACTOR, identitySource: "system", modes: { confirmed: true } },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toEqual({
      ok: true,
      scheduledTick: expect.objectContaining({
        ok: false,
        message: 'No enabled schedule for agent "planner".',
      }),
    });
  });

  it("fails closed when a non-scheduler system identity invokes the internal action", async () => {
    const actor = { ...SCHEDULER_ACTOR, id: "system:other" };
    const result = await runtimeControl.executeControlledStructuredPlan(
      schedulerPlan(actor),
      { actor, identitySource: "system", modes: { confirmed: true } },
    );

    expect(result.result).toEqual(expect.objectContaining({
      ok: false,
      error: "Scheduled agent ticks require scheduler system authority.",
    }));
  });
});
