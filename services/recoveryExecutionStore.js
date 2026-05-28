"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");

const EXECUTION_TYPES = Object.freeze({
  POLICY_EVALUATED: "RECOVERY_EXECUTION_POLICY_EVALUATED",
  GATE_ALLOWED: "RECOVERY_EXECUTION_GATE_ALLOWED",
  GATE_BLOCKED: "RECOVERY_EXECUTION_GATE_BLOCKED",
  COMMIT_ATTEMPTED: "RECOVERY_EXECUTION_COMMIT_ATTEMPTED",
  COMMITTED: "RECOVERY_EXECUTION_COMMITTED",
  BLOCKED: "RECOVERY_EXECUTION_BLOCKED",
  FAILED: "RECOVERY_EXECUTION_FAILED",
  PAUSED: "RECOVERY_EXECUTION_PAUSED",
  RESUMED: "RECOVERY_EXECUTION_RESUMED",
});

function appendExecutionEvent({ type, message, payload, actor = "operator" }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listExecutionEvents(limit = 5000) {
  return listAuditEvents(limit).filter((event) => String(event?.type || "").startsWith("RECOVERY_EXECUTION_"));
}

function deriveRecoveryExecutionState({ executionId = null } = {}) {
  const normalizedExecutionId = executionId == null ? null : String(executionId);
  const events = listExecutionEvents();
  const pauseEvent = events.find((event) => {
    const type = String(event?.type || "");
    if (![EXECUTION_TYPES.PAUSED, EXECUTION_TYPES.RESUMED].includes(type)) {
      return false;
    }
    const scope = String(event?.payload?.scope || "global");
    const targetExecutionId = event?.payload?.executionId == null ? null : String(event.payload.executionId);
    if (normalizedExecutionId == null) {
      return scope === "global";
    }
    return (scope === "execution" && targetExecutionId === normalizedExecutionId) || scope === "global";
  });

  const successfulCommits = new Set(
    events
      .filter((event) => String(event?.type || "") === EXECUTION_TYPES.COMMITTED)
      .map((event) => String(event?.payload?.recoveryRequestId || ""))
      .filter(Boolean),
  );

  const attempted = events.filter((event) => String(event?.type || "") === EXECUTION_TYPES.COMMIT_ATTEMPTED);
  const resolvedIds = new Set(
    events
      .filter((event) => [EXECUTION_TYPES.COMMITTED, EXECUTION_TYPES.BLOCKED, EXECUTION_TYPES.FAILED].includes(String(event?.type || "")))
      .map((event) => String(event?.payload?.recoveryRequestId || ""))
      .filter(Boolean),
  );

  const inFlightExecutionIds = new Set(
    attempted
      .filter((event) => !resolvedIds.has(String(event?.payload?.recoveryRequestId || "")))
      .map((event) => String(event?.payload?.executionId || ""))
      .filter(Boolean),
  );

  return {
    paused: pauseEvent ? String(pauseEvent.type) === EXECUTION_TYPES.PAUSED : false,
    scope: pauseEvent?.payload?.scope ? String(pauseEvent.payload.scope) : (normalizedExecutionId == null ? "global" : "execution"),
    executionId: pauseEvent?.payload?.executionId == null ? normalizedExecutionId : String(pauseEvent.payload.executionId),
    reason: pauseEvent?.payload?.reason || null,
    updatedBy: pauseEvent?.payload?.pausedBy || pauseEvent?.payload?.resumedBy || null,
    successfulCommits,
    inFlightExecutionIds,
  };
}

function recordExecutionPolicyEvaluated({ recoveryRequestId, executionId, policy, requestedBy }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.POLICY_EVALUATED,
    message: `Recovery execution policy evaluated for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      policy,
      requestedBy,
    },
  });
}

function recordExecutionGateAllowed({ recoveryRequestId, executionId, gate, requestedBy }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.GATE_ALLOWED,
    message: `Recovery execution gate allowed for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      gate,
      requestedBy,
    },
  });
}

function recordExecutionGateBlocked({ recoveryRequestId, executionId, gate, requestedBy }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.GATE_BLOCKED,
    message: `Recovery execution gate blocked for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      gate,
      requestedBy,
    },
  });
}

function recordExecutionCommitAttempted({ recoveryRequestId, executionId, requestedBy, dryRun }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.COMMIT_ATTEMPTED,
    message: `Recovery execution commit attempted for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      dryRun: Boolean(dryRun),
    },
  });
}

function recordExecutionCommitted({ recoveryRequestId, executionId, requestedBy, result }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.COMMITTED,
    message: `Recovery execution committed for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      result,
    },
  });
}

function recordExecutionBlocked({ recoveryRequestId, executionId, requestedBy, result }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.BLOCKED,
    message: `Recovery execution blocked for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      result,
    },
  });
}

function recordExecutionFailed({ recoveryRequestId, executionId, requestedBy, result }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.FAILED,
    message: `Recovery execution failed for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      result,
    },
  });
}

function pauseRecoveryExecution({ scope, executionId = null, pausedBy, reason }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.PAUSED,
    message: "Recovery execution paused.",
    payload: {
      scope,
      executionId,
      pausedBy,
      reason,
    },
  });
}

function resumeRecoveryExecution({ scope, executionId = null, resumedBy, reason }) {
  return appendExecutionEvent({
    type: EXECUTION_TYPES.RESUMED,
    message: "Recovery execution resumed.",
    payload: {
      scope,
      executionId,
      resumedBy,
      reason,
    },
  });
}

module.exports = {
  deriveRecoveryExecutionState,
  listExecutionEvents,
  pauseRecoveryExecution,
  recordExecutionBlocked,
  recordExecutionCommitAttempted,
  recordExecutionCommitted,
  recordExecutionFailed,
  recordExecutionGateAllowed,
  recordExecutionGateBlocked,
  recordExecutionPolicyEvaluated,
  resumeRecoveryExecution,
};
