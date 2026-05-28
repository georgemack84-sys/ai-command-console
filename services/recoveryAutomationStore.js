"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");

const AUTOMATION_TYPES = Object.freeze({
  SCAN_STARTED: "RECOVERY_AUTOMATION_SCAN_STARTED",
  SCAN_COMPLETED: "RECOVERY_AUTOMATION_SCAN_COMPLETED",
  POLICY_EVALUATED: "RECOVERY_AUTOMATION_POLICY_EVALUATED",
  SUPPRESSED: "RECOVERY_AUTOMATION_SUPPRESSED",
  REQUEST_OPENED: "RECOVERY_AUTOMATION_REQUEST_OPENED",
  BLOCKED: "RECOVERY_AUTOMATION_BLOCKED",
  FAILED: "RECOVERY_AUTOMATION_FAILED",
  PAUSED: "RECOVERY_AUTOMATION_PAUSED",
  RESUMED: "RECOVERY_AUTOMATION_RESUMED",
});

function appendAutomationEvent({ type, message, payload, actor = "operator" }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listAutomationEvents(limit = 5000) {
  return listAuditEvents(limit).filter((event) => String(event?.type || "").startsWith("RECOVERY_AUTOMATION_"));
}

function getAutomationStatus({ executionId = null } = {}) {
  const normalizedExecutionId = executionId == null ? null : String(executionId);
  const events = listAutomationEvents().filter((event) => {
    const scope = String(event?.payload?.scope || "global");
    const targetExecutionId = event?.payload?.executionId == null ? null : String(event.payload.executionId);
    if (normalizedExecutionId == null) {
      return scope === "global";
    }
    return (scope === "execution" && targetExecutionId === normalizedExecutionId) || scope === "global";
  });

  const latest = events.find((event) => ["RECOVERY_AUTOMATION_PAUSED", "RECOVERY_AUTOMATION_RESUMED"].includes(String(event?.type || "")));
  if (!latest) {
    return {
      paused: false,
      scope: normalizedExecutionId == null ? "global" : "execution",
      executionId: normalizedExecutionId,
      reason: null,
      updatedBy: null,
    };
  }

  return {
    paused: String(latest.type) === AUTOMATION_TYPES.PAUSED,
    scope: String(latest?.payload?.scope || (normalizedExecutionId == null ? "global" : "execution")),
    executionId: latest?.payload?.executionId == null ? normalizedExecutionId : String(latest.payload.executionId),
    reason: latest?.payload?.reason || null,
    updatedBy: latest?.payload?.pausedBy || latest?.payload?.resumedBy || null,
  };
}

function recordAutomationScanStarted({ requestedBy, limit, dryRun }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.SCAN_STARTED,
    message: "Recovery automation scan started.",
    payload: {
      requestedBy,
      limit: Number(limit || 0),
      dryRun: Boolean(dryRun),
    },
  });
}

function recordAutomationScanCompleted({ requestedBy, advisoriesProcessed, requestsOpened, dryRun }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.SCAN_COMPLETED,
    message: "Recovery automation scan completed.",
    payload: {
      requestedBy,
      advisoriesProcessed: Number(advisoriesProcessed || 0),
      requestsOpened: Number(requestsOpened || 0),
      dryRun: Boolean(dryRun),
    },
  });
}

function recordAutomationPolicyEvaluated({ executionId, advisoryId, signalType, recommendation, policy, requestedBy }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.POLICY_EVALUATED,
    message: `Recovery automation policy evaluated for ${executionId}.`,
    payload: {
      executionId,
      advisoryId,
      signalType,
      recommendation,
      policy,
      requestedBy,
    },
  });
}

function recordAutomationSuppressed({ executionId, advisoryId, signalType, recommendation, policy, throttle, requestedBy }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.SUPPRESSED,
    message: `Recovery automation suppressed for ${executionId}.`,
    payload: {
      executionId,
      advisoryId,
      signalType,
      recommendation,
      policy,
      throttle,
      requestedBy,
    },
  });
}

function recordAutomationRequestOpened({ executionId, advisoryId, signalType, recommendation, recoveryRequest, requestedBy }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.REQUEST_OPENED,
    message: `Recovery automation opened a recovery request for ${executionId}.`,
    payload: {
      executionId,
      advisoryId,
      signalType,
      recommendation,
      recoveryRequest,
      requestedBy,
    },
  });
}

function recordAutomationBlocked({ executionId, advisoryId, signalType, recommendation, policy, requestedBy, reason }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.BLOCKED,
    message: `Recovery automation blocked for ${executionId}.`,
    payload: {
      executionId,
      advisoryId,
      signalType,
      recommendation,
      policy,
      requestedBy,
      reason,
    },
  });
}

function recordAutomationFailed({ executionId = null, advisoryId = null, requestedBy, reason }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.FAILED,
    message: "Recovery automation failed.",
    payload: {
      executionId,
      advisoryId,
      requestedBy,
      reason,
    },
  });
}

function recordAutomationPaused({ scope, executionId = null, pausedBy, reason }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.PAUSED,
    message: "Recovery automation paused.",
    payload: {
      scope,
      executionId,
      pausedBy,
      reason,
    },
  });
}

function recordAutomationResumed({ scope, executionId = null, resumedBy, reason }) {
  return appendAutomationEvent({
    type: AUTOMATION_TYPES.RESUMED,
    message: "Recovery automation resumed.",
    payload: {
      scope,
      executionId,
      resumedBy,
      reason,
    },
  });
}

module.exports = {
  AUTOMATION_TYPES,
  getAutomationStatus,
  listAutomationEvents,
  recordAutomationBlocked,
  recordAutomationFailed,
  recordAutomationPaused,
  recordAutomationPolicyEvaluated,
  recordAutomationRequestOpened,
  recordAutomationResumed,
  recordAutomationScanCompleted,
  recordAutomationScanStarted,
  recordAutomationSuppressed,
};
