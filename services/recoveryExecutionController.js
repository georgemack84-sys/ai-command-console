"use strict";

const { runApprovedRecoveryExecution } = require("./recoveryExecutionRunner");
const executionStore = require("./recoveryExecutionStore");

function success(data) {
  return { ok: true, data };
}

function failure(message) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_EXECUTION",
    message: String(message || "Recovery execution controller blocked."),
  };
}

async function runExecutionOnce({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  return runApprovedRecoveryExecution({
    db,
    modes,
    requestedBy,
    limit,
    dryRun,
  });
}

async function pauseRecoveryExecution({ scope, executionId = null, pausedBy, reason }) {
  if (!String(scope || "").trim()) {
    return failure("Recovery execution pause scope is required.");
  }
  executionStore.pauseRecoveryExecution({
    scope: String(scope),
    executionId,
    pausedBy: String(pausedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "paused",
  });
  return success({ paused: true });
}

async function resumeRecoveryExecution({ scope, executionId = null, resumedBy, reason }) {
  if (!String(scope || "").trim()) {
    return failure("Recovery execution resume scope is required.");
  }
  executionStore.resumeRecoveryExecution({
    scope: String(scope),
    executionId,
    resumedBy: String(resumedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "resumed",
  });
  return success({ paused: false });
}

async function getRecoveryExecutionStatus({ executionId = null } = {}) {
  return success(executionStore.deriveRecoveryExecutionState({ executionId }));
}

module.exports = {
  getRecoveryExecutionStatus,
  pauseRecoveryExecution,
  resumeRecoveryExecution,
  runExecutionOnce,
};
