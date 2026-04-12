import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const alertsPath = require.resolve("../../services/alerts.js");
const taskQueuePath = require.resolve("../../services/taskQueue.js");
const reviewQueuePath = require.resolve("../../services/reviewQueue.js");
const schedulerPath = require.resolve("../../services/scheduler.js");
const watcherPath = require.resolve("../../services/watcher.js");
const agentRuntimePath = require.resolve("../../services/agentRuntime.js");
const agentMemoryPath = require.resolve("../../services/agentMemory.js");
const alertNotificationsPath = require.resolve("../../services/alertNotifications.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-alerts-"));
}

function loadAlerts(tempRoot: string, options?: {
  tasks?: () => Array<Record<string, unknown>>;
  reviews?: () => Array<Record<string, unknown>>;
  schedules?: () => Array<Record<string, unknown>>;
  watcher?: () => Record<string, unknown>;
  profiles?: () => Array<Record<string, unknown>>;
  agentState?: (agentName: string) => Record<string, unknown>;
  shouldNotify?: (alert: Record<string, unknown>) => boolean;
  sendAlertNotification?: (alert: Record<string, unknown>) => Promise<Record<string, unknown>>;
  getThrottleMs?: () => number;
}) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
  fs.mkdirSync(path.join(tempRoot, "agents"), { recursive: true });

  const originals = {
    alerts: require.cache[alertsPath],
    taskQueue: require.cache[taskQueuePath],
    reviewQueue: require.cache[reviewQueuePath],
    scheduler: require.cache[schedulerPath],
    watcher: require.cache[watcherPath],
    agentRuntime: require.cache[agentRuntimePath],
    agentMemory: require.cache[agentMemoryPath],
    alertNotifications: require.cache[alertNotificationsPath],
  };

  require.cache[taskQueuePath] = {
    id: taskQueuePath,
    filename: taskQueuePath,
    loaded: true,
    exports: { listTasks: options?.tasks || (() => []) },
  };
  require.cache[reviewQueuePath] = {
    id: reviewQueuePath,
    filename: reviewQueuePath,
    loaded: true,
    exports: { listReviewItems: options?.reviews || (() => []) },
  };
  require.cache[schedulerPath] = {
    id: schedulerPath,
    filename: schedulerPath,
    loaded: true,
    exports: { listSchedules: options?.schedules || (() => []) },
  };
  require.cache[watcherPath] = {
    id: watcherPath,
    filename: watcherPath,
    loaded: true,
    exports: { getWatcherStatus: options?.watcher || (() => ({ enabled: true, lastRunAt: null })) },
  };
  require.cache[agentRuntimePath] = {
    id: agentRuntimePath,
    filename: agentRuntimePath,
    loaded: true,
    exports: { listAgentProfiles: options?.profiles || (() => []) },
  };
  require.cache[agentMemoryPath] = {
    id: agentMemoryPath,
    filename: agentMemoryPath,
    loaded: true,
    exports: { loadAgentState: options?.agentState || (() => ({ active: true })) },
  };
  require.cache[alertNotificationsPath] = {
    id: alertNotificationsPath,
    filename: alertNotificationsPath,
    loaded: true,
    exports: {
      getThrottleMs: options?.getThrottleMs || (() => 1000),
      shouldNotify: options?.shouldNotify || (() => false),
      sendAlertNotification: options?.sendAlertNotification || (async () => ({ status: "sent" })),
    },
  };

  delete require.cache[alertsPath];
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];

  const alerts = require("../../services/alerts.js");
  const stateDatabase = require("../../services/stateDatabase.js");

  return {
    alerts,
    stateDatabase,
    restore() {
      stateDatabase.closeDatabase();
      delete require.cache[alertsPath];
      delete require.cache[stateDatabasePath];
      delete require.cache[runtimePathsPath];
      for (const [key, value] of Object.entries(originals)) {
        const mapping = {
          alerts: alertsPath,
          taskQueue: taskQueuePath,
          reviewQueue: reviewQueuePath,
          scheduler: schedulerPath,
          watcher: watcherPath,
          agentRuntime: agentRuntimePath,
          agentMemory: agentMemoryPath,
          alertNotifications: alertNotificationsPath,
        } as const;
        const modulePath = mapping[key as keyof typeof mapping];
        if (value) require.cache[modulePath] = value;
        else delete require.cache[modulePath];
      }
    },
  };
}

describe("alerts service", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = createTempRoot();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("detects queue pressure, review backlog, inactive agents, scheduler anomalies, and a stopped watcher", () => {
    const { alerts, restore } = loadAlerts(tempRoot, {
      tasks: () => Array.from({ length: 7 }, (_, index) => ({ id: `task_${index}`, status: "queued" })),
      reviews: () => Array.from({ length: 4 }, (_, index) => ({ id: `review_${index}`, status: "pending" })),
      schedules: () => [{ agentName: "planner", enabled: true, cycleCount: 3, maxCycles: 3 }],
      watcher: () => ({ enabled: false, lastRunAt: "2026-04-09T01:00:00.000Z" }),
      profiles: () => [{ name: "planner" }, { name: "researcher" }],
      agentState: (agentName: string) => ({ active: agentName === "planner" ? false : false }),
    });

    try {
      const result = alerts.runAlertChecks();
      const activeTypes = result.state.alerts.map((alert: { type: string }) => alert.type).sort();

      expect(result.ok).toBe(true);
      expect(activeTypes).toEqual([
        "inactive_agents",
        "queue_pressure",
        "review_backlog",
        "scheduler_anomaly",
        "watcher_stopped",
      ]);
      expect(result.state.lastResult.activeAlertCount).toBe(5);
    } finally {
      restore();
    }
  });

  it("preserves workflow state and resolves alerts by type", () => {
    const { alerts, restore } = loadAlerts(tempRoot);

    try {
      const created = alerts.upsertAlert("queue_pressure", "moderate", "Queue pressure", { queuedTasks: 9 });
      const acknowledged = alerts.acknowledgeAlert(created.id, "manager");
      expect(acknowledged.ok).toBe(true);

      const updated = alerts.upsertAlert("queue_pressure", "high", "Queue pressure", { queuedTasks: 12 });
      expect(updated.id).toBe(created.id);
      expect(updated.workflow.acknowledged).toBe(true);
      expect(updated.workflow.owner).toBe("manager");

      const resolved = alerts.resolveAlertByType("queue_pressure", "Recovered automatically.");
      expect(resolved.status).toBe("resolved");
      expect(resolved.workflow.resolutionNote).toBe("Recovered automatically.");
    } finally {
      restore();
    }
  });

  it("records notification success and failure on alert updates", async () => {
    const sendAlertNotification = vi
      .fn()
      .mockResolvedValueOnce({ status: "sent" })
      .mockRejectedValueOnce(new Error("webhook offline"));
    const { alerts, restore } = loadAlerts(tempRoot, {
      shouldNotify: () => true,
      sendAlertNotification,
      getThrottleMs: () => 0,
    });

    try {
      const first = alerts.upsertAlert("queue_pressure", "high", "Queue pressure", { queuedTasks: 12 });
      await new Promise((resolve) => setTimeout(resolve, 0));
      const sent = alerts.getAlertById(first.id);
      expect(sent.workflow.externalNotification.lastStatus).toBe("sent");
      expect(sent.workflow.externalNotification.lastError).toBeNull();

      const second = alerts.upsertAlert("review_backlog", "high", "Review backlog", { pendingReviews: 7 });
      await new Promise((resolve) => setTimeout(resolve, 0));
      const failed = alerts.getAlertById(second.id);
      expect(failed.workflow.externalNotification.lastStatus).toBe("failed");
      expect(failed.workflow.externalNotification.lastError).toBe("webhook offline");
      expect(sendAlertNotification).toHaveBeenCalledTimes(2);
    } finally {
      restore();
    }
  });
});
