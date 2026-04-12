const { getDigestSchedulerStatus, updateDigestSchedulerStatus } = require("./digestSchedulerState");
const { loadWorkspaceDocument } = require("./workspaceDocuments");
const { getWorkspaceDataPath } = require("./runtimePaths");

let digestSchedulerTimer = null;
const USERS_PATH = getWorkspaceDataPath("workspace-users.json");

function readUsersFromStorage() {
  return loadWorkspaceDocument("workspace.users", [], { legacyPath: USERS_PATH });
}

function uniqueWorkspaceIds(users) {
  return [...new Set(
    (Array.isArray(users) ? users : [])
      .filter((user) => user && user.status !== "disabled")
      .map((user) => String(user.workspaceId || "default"))
  )];
}

async function runDigestSchedulerSweep() {
  try {
    const { queueLegacyDueDigestSweepIfNeeded } = require("./legacyConsoleCompat");
    const users = readUsersFromStorage();
    const workspaces = uniqueWorkspaceIds(users);
    const queued = [];

    for (const workspaceId of workspaces) {
      const job = queueLegacyDueDigestSweepIfNeeded(workspaceId, {
        actorId: "digest-scheduler",
        actorName: "Digest Scheduler",
      });
      if (job) {
        queued.push(job.id);
      }
    }

    const nextState = updateDigestSchedulerStatus({
      lastRunAt: new Date().toISOString(),
      lastError: null,
      lastResult: {
      ok: true,
      workspaceCount: workspaces.length,
      queuedJobCount: queued.length,
      queuedJobIds: queued,
      },
    });

    return nextState.lastResult;
  } catch (error) {
    updateDigestSchedulerStatus({
      lastRunAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : "Digest scheduler sweep failed.",
      lastResult: {
        ok: false,
        error: error instanceof Error ? error.message : "Digest scheduler sweep failed.",
      },
    });
    throw error;
  }
}

function stopDigestScheduler() {
  if (digestSchedulerTimer) {
    clearInterval(digestSchedulerTimer);
    digestSchedulerTimer = null;
  }
  updateDigestSchedulerStatus({ enabled: false });
}

function ensureDigestScheduler(intervalMs = 60_000) {
  if (digestSchedulerTimer) {
    return digestSchedulerTimer;
  }

  const nextState = updateDigestSchedulerStatus({
    enabled: true,
    intervalMs: Math.max(10_000, Number(intervalMs || 60_000)),
  });

  digestSchedulerTimer = setInterval(() => {
    void runDigestSchedulerSweep();
  }, nextState.intervalMs);

  return digestSchedulerTimer;
}

module.exports = {
  ensureDigestScheduler,
  stopDigestScheduler,
  runDigestSchedulerSweep,
  getDigestSchedulerStatus,
};
