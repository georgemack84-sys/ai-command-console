"use strict";

const { runRecoveryAutomationScan } = require("./recoveryAutomationRunner");
const automationStore = require("./recoveryAutomationStore");

function success(data) {
  return { ok: true, data };
}

function failure(message) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_AUTOMATION",
    message: String(message || "Recovery automation controller blocked."),
  };
}

async function runAutomationOnce({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  return runRecoveryAutomationScan({
    db,
    modes,
    requestedBy,
    limit,
    dryRun,
  });
}

async function pauseAutomation({ scope, executionId = null, pausedBy, reason }) {
  if (!String(scope || "").trim()) {
    return failure("Automation pause scope is required.");
  }
  automationStore.recordAutomationPaused({
    scope: String(scope),
    executionId,
    pausedBy: String(pausedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "paused",
  });
  return success({
    paused: true,
  });
}

async function resumeAutomation({ scope, executionId = null, resumedBy, reason }) {
  if (!String(scope || "").trim()) {
    return failure("Automation resume scope is required.");
  }
  automationStore.recordAutomationResumed({
    scope: String(scope),
    executionId,
    resumedBy: String(resumedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "resumed",
  });
  return success({
    paused: false,
  });
}

async function getAutomationStatus({ executionId = null } = {}) {
  return success(automationStore.getAutomationStatus({ executionId }));
}

module.exports = {
  getAutomationStatus,
  pauseAutomation,
  resumeAutomation,
  runAutomationOnce,
};
