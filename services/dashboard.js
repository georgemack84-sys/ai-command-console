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
const { listActiveAlerts } = require("./alerts");
const { listAuditEvents } = require("./auditTrail");
const { loadWorkspaceDocument } = require("./workspaceDocuments");
const { getAgentsDataPath, getWorkspaceDataPath } = require("./runtimePaths");

const DASHBOARD_PATH = getAgentsDataPath("dashboard.json");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");
const DASHBOARD_KEY = "dashboard";
const USERS_PATH = getWorkspaceDataPath("workspace-users.json");
const ROUTES_PATH = getWorkspaceDataPath("workspace-user-routes.json");
const BRIEFS_PATH = getWorkspaceDataPath("research-briefs.json");
const REPORTS_PATH = getWorkspaceDataPath("research-reports.json");

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

function collectSystemSummary() {
  const tasks = safeValue(() => listTasks(), []) || [];
  const reviews = safeValue(() => listReviewItems(), []) || [];
  const schedules = safeValue(() => listSchedules(), []) || [];
  const watcher = safeValue(() => getWatcherStatus(), null);
  const agents = safeValue(() => listAgentProfiles(), []) || [];

  return {
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
}

function collectHealthSummary() {
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

  return {
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
}

function readWorkspaceStore(key, legacyPath, fallback) {
  return loadWorkspaceDocument(key, fallback, { legacyPath });
}

function buildWorkspaceInventory() {
  const users = readWorkspaceStore("workspace.users", USERS_PATH, []);
  const routes = readWorkspaceStore("workspace.routes", ROUTES_PATH, {});
  const briefs = readWorkspaceStore("workspace.research-briefs", BRIEFS_PATH, {});
  const reports = readWorkspaceStore("workspace.research-reports", REPORTS_PATH, {});
  const map = new Map();

  (Array.isArray(users) ? users : []).forEach((user) => {
    if (!user || user.status === "disabled") {
      return;
    }
    const workspaceId = String(user.workspaceId || "default");
    const current = map.get(workspaceId) || {
      workspaceId,
      name: user.workspaceName || "Main Workspace",
      members: 0,
      briefs: 0,
      reports: 0,
      routes: 0,
      updatedAt: user.createdAt || null,
    };
    current.members += 1;
    current.name = user.workspaceName || current.name;
    current.updatedAt = current.updatedAt || user.createdAt || null;
    map.set(workspaceId, current);
  });

  for (const [workspaceId, workspace] of map.entries()) {
    const routeCount = Array.isArray(routes?.[workspaceId]) ? routes[workspaceId].length : 0;
    const briefItems = Array.isArray(briefs?.[workspaceId]) ? briefs[workspaceId] : [];
    const reportItems = Array.isArray(reports?.[workspaceId]) ? reports[workspaceId] : [];
    const latestTimestamps = [
      workspace.updatedAt,
      ...briefItems.map((item) => item?.updatedAt || item?.createdAt || null),
      ...reportItems.map((item) => item?.updatedAt || item?.createdAt || null),
    ].filter(Boolean);

    workspace.routes = routeCount;
    workspace.briefs = briefItems.length;
    workspace.reports = reportItems.length;
    workspace.updatedAt = latestTimestamps.sort().slice(-1)[0] || null;
  }

  return [...map.values()].sort((left, right) => {
    const leftScore = left.members + left.briefs + left.reports + left.routes;
    const rightScore = right.members + right.briefs + right.reports + right.routes;
    return rightScore - leftScore;
  });
}

function formatEventTitle(type) {
  return String(type || "activity")
    .replaceAll(":", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildLiveDashboardSnapshot() {
  const system = collectSystemSummary();
  const health = collectHealthSummary();
  const workspaces = buildWorkspaceInventory();
  const activeAlerts = safeValue(() => listActiveAlerts(), []) || [];
  const audits = safeValue(() => listAuditEvents(6), []) || [];

  return {
    generatedAt: new Date().toISOString(),
    summaryCards: [
      {
        label: "Active Workspaces",
        value: String(workspaces.length),
        detail: `${system.agentCount} active agents across the console`,
        icon: "LayoutGrid",
      },
      {
        label: "Queued Tasks",
        value: String(system.queuedTasks),
        detail: `${system.claimedTasks} claimed and ${system.completedTasks} completed`,
        icon: "Gauge",
      },
      {
        label: "Pending Reviews",
        value: String(system.reviewPending),
        detail: `${system.reviewCompleted} reviewed decisions recorded`,
        icon: "ShieldCheck",
      },
      {
        label: "System Posture",
        value: String(health.overall),
        detail: `${health.watcherStatus} watcher with ${health.inactiveAgents} inactive agents`,
        icon: "Sparkles",
      },
    ],
    workspaces: workspaces.slice(0, 3).map((workspace) => {
      const totalTracked = workspace.briefs + workspace.reports + workspace.routes;
      const state =
        workspace.briefs > workspace.reports
          ? "Research active"
          : workspace.routes > 0
            ? "Route tracking live"
            : "Steady";
      return {
        name: workspace.name,
        state,
        tone:
          workspace.briefs > workspace.reports
            ? "bg-sky-300"
            : workspace.routes > 0
              ? "bg-emerald-400"
              : "bg-slate-400",
        updatedAt: workspace.updatedAt,
        summary:
          totalTracked > 0
            ? `${workspace.briefs} briefs, ${workspace.reports} reports, and ${workspace.routes} saved routes are currently attached to this workspace.`
            : "This workspace is ready for new briefs, reports, or route monitoring without any lingering backlog.",
        meta: [
          { label: "Members", value: String(workspace.members) },
          { label: "Tracked items", value: String(totalTracked) },
        ],
      };
    }),
    activityFeed: audits.slice(0, 4).map((entry, index) => ({
      title: entry.message || formatEventTitle(entry.type),
      time: entry.timestamp,
      tag: formatEventTitle(entry.type),
      tone: index === 0 ? "highlight" : "default",
    })),
    timelineFeed: activeAlerts.slice(0, 3).map((alert, index) => ({
      title: alert.title,
      time: alert.createdAt || new Date().toISOString(),
      tag: formatEventTitle(alert.type),
      tone: index === 0 ? "highlight" : "default",
    })),
  };
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
  const summary = collectSystemSummary();

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
  const health = collectHealthSummary();

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
  buildLiveDashboardSnapshot,
  buildWorkloadSummary,
  buildReviewSummary,
  getAgentDashboard
};
