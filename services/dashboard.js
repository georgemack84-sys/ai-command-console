const fs = require("fs");
const path = require("path");
const { listTasks } = require("./taskQueue");
const { listSchedules, getSchedule } = require("./servicesSafeSchedulerImport");
const { getWatcherStatus } = require("./servicesSafeWatcherImport");
const { listInbox, getUnreadMessages } = require("./inbox");
const { listReviewItems } = require("./reviewQueue");
const { listAgentProfiles } = require("./agentRuntime");
const { loadAgentState } = require("./agentMemory");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");
const { getAgentsDataPath } = require("./runtimePaths");

const DASHBOARD_PATH = getAgentsDataPath("dashboard.json");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");
const DASHBOARD_KEY = "dashboard";

function ensureDashboardDir() {
  fs.mkdirSync(path.dirname(DASHBOARD_PATH), { recursive: true });
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function defaultDashboardState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSystemSnapshot: null,
    lastAgentSnapshots: {},
    lastHealthSnapshot: null
  };
}

function loadDashboardState() {
  ensureDashboardDir();
  return loadJsonDocument(DASHBOARD_KEY, DASHBOARD_PATH, defaultDashboardState, (parsed) => ({
    ...defaultDashboardState(),
    ...parsed,
    lastAgentSnapshots:
      parsed?.lastAgentSnapshots && typeof parsed.lastAgentSnapshots === "object"
        ? parsed.lastAgentSnapshots
        : {},
  }));
}

function saveDashboardState(state) {
  ensureDashboardDir();

  const normalized = {
    createdAt: state.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSystemSnapshot: state.lastSystemSnapshot || null,
    lastAgentSnapshots:
      state.lastAgentSnapshots && typeof state.lastAgentSnapshots === "object"
        ? state.lastAgentSnapshots
        : {},
    lastHealthSnapshot: state.lastHealthSnapshot || null
  };

  return saveJsonDocument(DASHBOARD_KEY, DASHBOARD_PATH, normalized);
}

function logDashboardEvent(payload) {
  ensureDashboardDir();
  const logPath = path.join(AGENT_LOG_DIR, "manager.log");
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    dashboardEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function safeCount(fn, fallback = 0) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function safeValue(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function buildAgentSummary(agentName) {
  const tasks = safeValue(() => listTasks(), []) || [];
  const inbox = safeValue(() => listInbox(agentName), []) || [];
  const unread = safeValue(() => getUnreadMessages(agentName), []) || [];
  const reviews = safeValue(() => listReviewItems(), []) || [];
  const schedule = safeValue(() => getSchedule(agentName), null);
  const state = safeValue(() => loadAgentState(agentName), null);

  const agentTasks = tasks.filter(
    (task) => String(task.agentName).toLowerCase() === String(agentName).toLowerCase()
  );

  const queuedTasks = agentTasks.filter((task) => task.status === "queued").length;
  const claimedTasks = agentTasks.filter((task) => task.status === "claimed").length;
  const completedTasks = agentTasks.filter((task) => task.status === "completed").length;

  const pendingReviews = reviews.filter(
    (item) =>
      String(item.agentName).toLowerCase() === String(agentName).toLowerCase() &&
      item.status === "pending"
  ).length;

  const reviewedItems = reviews.filter(
    (item) =>
      String(item.agentName).toLowerCase() === String(agentName).toLowerCase() &&
      item.status === "reviewed"
  ).length;

  return {
    agentName,
    active: Boolean(state?.active),
    status: state?.status || "unknown",
    currentGoal: state?.goal || null,
    currentTaskId: state?.currentTask?.id || null,
    queuedTasks,
    claimedTasks,
    completedTasks,
    inboxCount: inbox.length,
    unreadCount: unread.length,
    pendingReviews,
    reviewedItems,
    scheduleEnabled: Boolean(schedule?.enabled),
    scheduleCycleCount: schedule?.cycleCount || 0,
    scheduleMaxCycles: schedule?.maxCycles || 0,
    lastRunAt: state?.lastRunAt || null,
    updatedAt: new Date().toISOString()
  };
}

function buildSystemSummary() {
  const tasks = safeValue(() => listTasks(), []) || [];
  const reviews = safeValue(() => listReviewItems(), []) || [];
  const schedules = safeValue(() => listSchedules(), []) || [];
  const watcher = safeValue(() => getWatcherStatus(), null);
  const agents = safeValue(() => listAgentProfiles(), []) || [];

  const summary = {
    generatedAt: new Date().toISOString(),
    agentCount: agents.length,
    totalTasks: tasks.length,
    queuedTasks: tasks.filter((task) => task.status === "queued").length,
    claimedTasks: tasks.filter((task) => task.status === "claimed").length,
    completedTasks: tasks.filter((task) => task.status === "completed").length,
    reviewPending: reviews.filter((item) => item.status === "pending").length,
    reviewCompleted: reviews.filter((item) => item.status === "reviewed").length,
    activeSchedules: schedules.filter((schedule) => schedule.enabled).length,
    watcherEnabled: Boolean(watcher?.enabled),
    watcherLastRunAt: watcher?.lastRunAt || null
  };

  const state = loadDashboardState();
  state.lastSystemSnapshot = summary;
  saveDashboardState(state);

  logDashboardEvent({
    event: "dashboard_system_generated",
    summary
  });

  return summary;
}

function buildHealthSummary() {
  const tasks = safeValue(() => listTasks(), []) || [];
  const reviews = safeValue(() => listReviewItems(), []) || [];
  const schedules = safeValue(() => listSchedules(), []) || [];
  const watcher = safeValue(() => getWatcherStatus(), null);
  const agents = safeValue(() => listAgentProfiles(), []) || [];

  const queuedTasks = tasks.filter((task) => task.status === "queued").length;
  const pendingReviews = reviews.filter((item) => item.status === "pending").length;
  const stuckSchedules = schedules.filter(
    (schedule) => schedule.enabled && Number(schedule.cycleCount || 0) >= Number(schedule.maxCycles || 0)
  ).length;
  const inactiveAgents = agents.filter((agent) => {
    const state = safeValue(() => loadAgentState(agent.name), null);
    return !state || !state.active;
  }).length;

  const health = {
    generatedAt: new Date().toISOString(),
    queuePressure: queuedTasks > 5 ? "high" : queuedTasks > 0 ? "moderate" : "low",
    reviewPressure: pendingReviews > 3 ? "high" : pendingReviews > 0 ? "moderate" : "low",
    watcherStatus: watcher?.enabled ? "running" : "stopped",
    stuckSchedules,
    inactiveAgents,
    overall:
      queuedTasks > 8 || pendingReviews > 5
        ? "attention"
        : stuckSchedules > 0
          ? "watch"
          : "stable"
  };

  const state = loadDashboardState();
  state.lastHealthSnapshot = health;
  saveDashboardState(state);

  logDashboardEvent({
    event: "dashboard_health_generated",
    health
  });

  return health;
}

function buildWorkloadSummary() {
  const agents = safeValue(() => listAgentProfiles(), []) || [];
  return agents.map((agent) => buildAgentSummary(agent.name));
}

function buildReviewSummary() {
  const reviews = safeValue(() => listReviewItems(), []) || [];
  return {
    generatedAt: new Date().toISOString(),
    pending: reviews.filter((item) => item.status === "pending"),
    reviewed: reviews.filter((item) => item.status === "reviewed")
  };
}

function getAgentDashboard(agentName) {
  const snapshot = buildAgentSummary(agentName);
  const state = loadDashboardState();
  state.lastAgentSnapshots[agentName] = snapshot;
  saveDashboardState(state);

  logDashboardEvent({
    event: "dashboard_agent_generated",
    agentName,
    snapshot
  });

  return snapshot;
}

module.exports = {
  loadDashboardState,
  saveDashboardState,
  buildSystemSummary,
  buildHealthSummary,
  buildWorkloadSummary,
  buildReviewSummary,
  getAgentDashboard
};
