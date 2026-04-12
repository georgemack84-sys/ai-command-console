import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { restoreFiles, snapshotFiles } from "./state-fixture.mjs";

const require = createRequire(import.meta.url);
const { closeDatabase } = require("../../services/stateDatabase");
const { closeJobStore } = require("../../services/jobQueueStore");
const { getProfilePath } = require("../../services/agentProfiles");
const { getWorkspaceDataPath } = require("../../services/runtimePaths");
const {
  getWorkspaceDatabasePath,
  closeWorkspaceDatabase,
  saveWorkspaceDocument,
} = require("../../services/workspaceDocuments");

export { fs, path, restoreFiles, snapshotFiles };

export const { handleConsoleRequest, queueDueDigestSweepIfNeeded } = require("../../services/consoleApi");
export const { runDigestSchedulerSweep, stopDigestScheduler } = require("../../services/digestScheduler");
export const { loadQueue, saveQueue, completeTask } = require("../../services/taskQueue");
export const { saveReviewState } = require("../../services/reviewQueue");
export const { saveAlertsState } = require("../../services/alerts");
export const { clearAuditEvents, listAuditEvents } = require("../../services/auditTrail");
export const { saveSchedulerState } = require("../../services/scheduler");
export const {
  loadCollaborationState,
  saveCollaborationState,
  listDigestRuns,
  updateDigestWorkspaceState,
} = require("../../services/collaboration");
export const { clearTelemetry, buildTelemetrySummary } = require("../../services/telemetry");
export const { clearJobs, runPendingJobs, enqueueJob, updateJob, registerJobProcessor } = require("../../services/jobQueue");

export const FILES = [
  "console.sqlite",
  "taskQueue.json",
  "reviewQueue.json",
  "alerts.json",
  "audit-log.jsonl",
  "scheduler.json",
  "watcher.json",
  "automation-policy.json",
  "collaboration.json",
  "telemetry.json",
  "jobs.json",
];

export const AGENT_PROFILE_PATH = getProfilePath("researcher");
export const ROUTES_STORE_PATH = getWorkspaceDataPath("workspace-user-routes.json");
export const BRIEFS_STORE_PATH = getWorkspaceDataPath("research-briefs.json");
export const REPORTS_STORE_PATH = getWorkspaceDataPath("research-reports.json");
export const WORKSPACE_USERS_PATH = getWorkspaceDataPath("workspace-users.json");

export function saveWorkspaceRoutesStore(store) {
  return saveWorkspaceDocument("workspace.routes", store, { legacyPath: ROUTES_STORE_PATH });
}

export function saveWorkspaceBriefStore(store) {
  return saveWorkspaceDocument("workspace.research-briefs", store, { legacyPath: BRIEFS_STORE_PATH });
}

export function saveWorkspaceReportStore(store) {
  return saveWorkspaceDocument("workspace.research-reports", store, { legacyPath: REPORTS_STORE_PATH });
}

export function saveWorkspaceUsersStore(users) {
  return saveWorkspaceDocument("workspace.users", users, { legacyPath: WORKSPACE_USERS_PATH });
}

export function resetState() {
  closeJobStore();
  closeDatabase();
  closeWorkspaceDatabase();
  clearJobs();
  const workspaceDatabasePath = getWorkspaceDatabasePath();
  for (const filePath of [workspaceDatabasePath, `${workspaceDatabasePath}-wal`, `${workspaceDatabasePath}-shm`]) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }

  saveQueue({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: [],
  });
  saveReviewState({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  });
  saveAlertsState({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thresholds: {
      queuedTasksHigh: 6,
      pendingReviewsHigh: 4,
      inactiveAgentsHigh: 2,
    },
    lastRunAt: null,
    lastResult: null,
    alerts: [],
  });
  saveSchedulerState({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schedules: {},
  });
  saveCollaborationState({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    governance: {
      sensitiveActionsRequireApproval: true,
    },
    sharedSessions: [],
    handoffs: [],
    approvals: [],
  });
  clearTelemetry();
  clearAuditEvents();
}
