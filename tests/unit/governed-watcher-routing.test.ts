import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimeControl = require("../../services/runtimeControl");
const reviewSurface = require("../../services/reviewSurface");
const scheduler = require("../../services/scheduler");
const stateDatabase = require("../../services/stateDatabase");

const WATCHER_ACTOR = {
  id: "system:watcher",
  workspaceId: "legacy-global",
  name: "Watcher",
  email: "watcher@local",
  role: "system",
};

function watcherPlan(actor = WATCHER_ACTOR, source = "watcher") {
  return {
    type: "single",
    action: "watcher:schedule-start",
    payload: {
      ruleName: "researcher_queue_rule",
      agentName: "researcher",
      intervalSeconds: 6,
      maxCycles: 4,
    },
    originalRequest: "start schedule for researcher from watcher rule researcher_queue_rule",
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

describe("governed watcher routing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  afterEach(() => {
    scheduler.stopSchedule("researcher", "test_cleanup");
    stateDatabase.closeDatabase();
    vi.useRealTimers();
  });

  it("dispatches watcher schedule starts through control, review, engine, and router", async () => {
    const result = await runtimeControl.executeControlledStructuredPlan(
      watcherPlan(),
      { actor: WATCHER_ACTOR, identitySource: "system", modes: { confirmed: true } },
    );

    expect(result.ok).toBe(true);
    expect(result.result).toEqual({
      ok: true,
      schedule: expect.objectContaining({
        agentName: "researcher",
        enabled: true,
        intervalSeconds: 6,
        maxCycles: 4,
      }),
    });
  });

  it("fails closed when a non-watcher system identity invokes the internal action", async () => {
    const actor = { ...WATCHER_ACTOR, id: "system:other" };
    const result = await runtimeControl.executeControlledStructuredPlan(
      watcherPlan(actor),
      { actor, identitySource: "system", modes: { confirmed: true } },
    );

    expect(result.result).toEqual(expect.objectContaining({
      ok: false,
      error: "Watcher schedule starts require watcher system authority.",
    }));
    expect(scheduler.getSchedule("researcher")).toBeNull();
  });
});
