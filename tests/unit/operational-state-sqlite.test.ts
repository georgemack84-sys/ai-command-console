import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };
const modulePaths = [
  require.resolve("../../services/alerts.js"),
  require.resolve("../../services/scheduler.js"),
  require.resolve("../../services/watcher.js"),
  require.resolve("../../services/collaboration.js"),
  require.resolve("../../services/stateDatabase.js"),
  require.resolve("../../services/runtimePaths.js"),
];

type OperationalStores = {
  alerts: { loadAlertsState: () => Record<string, unknown>; saveAlertsState: (state: Record<string, unknown>) => unknown };
  scheduler: { loadSchedulerState: () => Record<string, unknown>; saveSchedulerState: (state: Record<string, unknown>) => unknown };
  watcher: { loadWatcherState: () => Record<string, unknown>; saveWatcherState: (state: Record<string, unknown>) => unknown };
  collaboration: { loadCollaborationState: () => Record<string, unknown>; saveCollaborationState: (state: Record<string, unknown>) => unknown };
  database: { closeDatabase: () => void; withDatabase: (work: (database: { prepare: (sql: string) => { all: () => unknown[] } }) => unknown) => unknown };
};

function clearOperationalModules() {
  modulePaths.forEach((modulePath) => delete require.cache[modulePath]);
}

function loadStores(tempRoot: string, writeMirrors = false): OperationalStores {
  process.env = {
    ...originalEnv,
    NODE_ENV: "production",
    AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
    AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS: writeMirrors ? "true" : "false",
  };
  clearOperationalModules();
  return {
    alerts: require("../../services/alerts.js"),
    scheduler: require("../../services/scheduler.js"),
    watcher: require("../../services/watcher.js"),
    collaboration: require("../../services/collaboration.js"),
    database: require("../../services/stateDatabase.js"),
  };
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value), "utf8");
}

function legacyPaths(tempRoot: string) {
  const agents = path.join(tempRoot, "agents");
  return {
    alerts: path.join(agents, "alerts.json"),
    scheduler: path.join(agents, "scheduler.json"),
    watcher: path.join(agents, "watcher.json"),
    collaboration: path.join(agents, "collaboration.json"),
  };
}

function seedLegacyState(tempRoot: string) {
  const paths = legacyPaths(tempRoot);
  const createdAt = "2026-01-01T00:00:00.000Z";
  writeJson(paths.alerts, {
    createdAt,
    thresholds: { queuedTasksHigh: 11, pendingReviewsHigh: 5, inactiveAgentsHigh: 3 },
    alerts: [{ id: "alert_legacy", status: "active" }],
  });
  writeJson(paths.scheduler, {
    createdAt,
    schedules: { planner: { agentName: "planner", enabled: false, cycleCount: 2 } },
  });
  writeJson(paths.watcher, {
    createdAt,
    enabled: false,
    intervalSeconds: 17,
    rules: [{ name: "legacy_rule", agentName: "planner", enabled: true }],
    history: [],
  });
  writeJson(paths.collaboration, {
    createdAt,
    governance: { currentEnvironment: "staging" },
    sharedSessions: [{ id: "session_legacy", status: "active" }],
    sharedMacros: [],
    handoffs: [],
    approvals: [],
  });
  return paths;
}

let activeDatabase: OperationalStores["database"] | null = null;
let activeTempRoot: string | null = null;

afterEach(() => {
  activeDatabase?.closeDatabase();
  activeDatabase = null;
  clearOperationalModules();
  process.env = { ...originalEnv };
  if (activeTempRoot) fs.rmSync(activeTempRoot, { recursive: true, force: true });
  activeTempRoot = null;
});

describe("operational SQLite state", () => {
  it("imports legacy operational documents once and preserves them across a SQLite restart", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "operational-state-sqlite-"));
    activeTempRoot = tempRoot;
    const paths = seedLegacyState(tempRoot);
    let stores = loadStores(tempRoot);
    activeDatabase = stores.database;

    expect(stores.alerts.loadAlertsState()).toMatchObject({ thresholds: { queuedTasksHigh: 11 }, alerts: [{ id: "alert_legacy" }] });
    expect(stores.scheduler.loadSchedulerState()).toMatchObject({ schedules: { planner: { cycleCount: 2 } } });
    expect(stores.watcher.loadWatcherState()).toMatchObject({ intervalSeconds: 17, rules: [{ name: "legacy_rule" }] });
    expect(stores.collaboration.loadCollaborationState()).toMatchObject({
      governance: { currentEnvironment: "staging" },
      sharedSessions: [{ id: "session_legacy" }],
    });

    const keys = stores.database.withDatabase((database) =>
      database.prepare("SELECT key FROM documents ORDER BY key").all(),
    ) as Array<{ key: string }>;
    expect(keys.map((row) => row.key)).toEqual(expect.arrayContaining(["alerts", "scheduler", "watcher", "collaboration"]));

    stores.database.closeDatabase();
    activeDatabase = null;
    Object.values(paths).forEach((filePath) => fs.rmSync(filePath, { force: true }));
    stores = loadStores(tempRoot);
    activeDatabase = stores.database;

    expect(stores.alerts.loadAlertsState()).toMatchObject({ alerts: [{ id: "alert_legacy" }] });
    expect(stores.scheduler.loadSchedulerState()).toMatchObject({ schedules: { planner: { cycleCount: 2 } } });
    expect(stores.watcher.loadWatcherState()).toMatchObject({ rules: [{ name: "legacy_rule" }] });
    expect(stores.collaboration.loadCollaborationState()).toMatchObject({ sharedSessions: [{ id: "session_legacy" }] });
  });

  it("keeps SQLite authoritative when stale JSON mirrors reappear", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "operational-state-precedence-"));
    activeTempRoot = tempRoot;
    const paths = seedLegacyState(tempRoot);
    let stores = loadStores(tempRoot);
    activeDatabase = stores.database;
    stores.alerts.loadAlertsState();
    stores.scheduler.loadSchedulerState();
    stores.watcher.loadWatcherState();
    stores.collaboration.loadCollaborationState();
    stores.database.closeDatabase();
    activeDatabase = null;

    writeJson(paths.alerts, { thresholds: { queuedTasksHigh: 999 }, alerts: [] });
    writeJson(paths.scheduler, { schedules: {} });
    writeJson(paths.watcher, { intervalSeconds: 999, rules: [], history: [] });
    writeJson(paths.collaboration, { governance: { currentEnvironment: "production" }, sharedSessions: [] });

    stores = loadStores(tempRoot);
    activeDatabase = stores.database;
    expect(stores.alerts.loadAlertsState()).toMatchObject({ thresholds: { queuedTasksHigh: 11 } });
    expect(stores.scheduler.loadSchedulerState()).toMatchObject({ schedules: { planner: { cycleCount: 2 } } });
    expect(stores.watcher.loadWatcherState()).toMatchObject({ intervalSeconds: 17 });
    expect(stores.collaboration.loadCollaborationState()).toMatchObject({ governance: { currentEnvironment: "staging" } });
  });

  it("does not emit legacy mirrors in production unless compatibility is explicitly enabled", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "operational-state-mirrors-"));
    activeTempRoot = tempRoot;
    const paths = legacyPaths(tempRoot);
    const stores = loadStores(tempRoot);
    activeDatabase = stores.database;

    stores.alerts.saveAlertsState({ thresholds: {}, alerts: [] });
    stores.scheduler.saveSchedulerState({ schedules: {} });
    stores.watcher.saveWatcherState({ enabled: false, rules: [], history: [] });
    stores.collaboration.saveCollaborationState({ governance: {}, sharedSessions: [], sharedMacros: [], handoffs: [], approvals: [] });

    Object.values(paths).forEach((filePath) => expect(fs.existsSync(filePath)).toBe(false));
    expect(fs.existsSync(path.join(tempRoot, "agents", "console.sqlite"))).toBe(true);

    process.env.AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS = "true";
    stores.alerts.saveAlertsState({ thresholds: { queuedTasksHigh: 8 }, alerts: [] });
    stores.scheduler.saveSchedulerState({ schedules: {} });
    stores.watcher.saveWatcherState({ enabled: false, rules: [], history: [] });
    stores.collaboration.saveCollaborationState({ governance: {}, sharedSessions: [], sharedMacros: [], handoffs: [], approvals: [] });
    Object.values(paths).forEach((filePath) => expect(fs.existsSync(filePath)).toBe(true));
  });
});
