const { getDigestSchedulerStatus, updateDigestSchedulerStatus } = require("./digestSchedulerState");
const { loadWorkspaceDocument } = require("./workspaceDocuments");
const { getWorkspaceDataPath } = require("./runtimePaths");
const { assertLegacyAutonomyAllowed, legacyAutonomyStatus } = require("./legacyAutonomyPolicy");

let digestSchedulerTimer = null;
let digestSchedulerSweepPromise = null;
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

async function executeDigestSchedulerSweep() {
  try {
    const { executeControlledStructuredPlan } = require("./runtimeControl");
    const users = readUsersFromStorage();
    const workspaces = uniqueWorkspaceIds(users);
    const queued = [];

    for (const workspaceId of workspaces) {
      const actor = {
        id: "system:digest-scheduler",
        workspaceId,
        name: "Digest Scheduler",
        email: "digest-scheduler@local",
        role: "system",
      };
      const controlled = await executeControlledStructuredPlan({
        type: "single",
        action: "collaboration:digest-run-due",
        payload: {},
        originalRequest: `run due digests for workspace ${workspaceId}`,
        source: "digest_scheduler",
        meta: {
          userId: actor.id,
          workspaceId,
          userName: actor.name,
          userEmail: actor.email,
          userRole: actor.role,
        },
      }, {
        actor,
        identitySource: "system",
        modes: { confirmed: true },
      });
      if (!controlled?.ok) {
        throw new Error(
          controlled?.error || controlled?.control?.decision?.explanation || `Digest sweep was not authorized for ${workspaceId}.`,
        );
      }
      if (controlled.result?.queued && controlled.result.jobId) {
        queued.push(controlled.result.jobId);
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

function runDigestSchedulerSweep() {
  assertLegacyAutonomyAllowed("digest scheduler sweep");
  if (digestSchedulerSweepPromise) {
    return digestSchedulerSweepPromise;
  }

  const sweep = executeDigestSchedulerSweep();
  digestSchedulerSweepPromise = sweep.finally(() => {
    digestSchedulerSweepPromise = null;
  });
  return digestSchedulerSweepPromise;
}

function stopDigestScheduler() {
  if (digestSchedulerTimer) {
    clearInterval(digestSchedulerTimer);
    digestSchedulerTimer = null;
  }
  updateDigestSchedulerStatus({ enabled: false });
}

function ensureDigestScheduler(intervalMs = 60_000) {
  if (!legacyAutonomyStatus().allowed) {
    return null;
  }
  if (digestSchedulerTimer) {
    return digestSchedulerTimer;
  }

  const nextState = updateDigestSchedulerStatus({
    enabled: true,
    intervalMs: Math.max(10_000, Number(intervalMs || 60_000)),
  });

  digestSchedulerTimer = setInterval(() => {
    void runDigestSchedulerSweep().catch(() => {
      // The sweep records its own failure state; prevent an unhandled timer rejection.
    });
  }, nextState.intervalMs);

  return digestSchedulerTimer;
}

module.exports = {
  ensureDigestScheduler,
  stopDigestScheduler,
  runDigestSchedulerSweep,
  getDigestSchedulerStatus,
};
