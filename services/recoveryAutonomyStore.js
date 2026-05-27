"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");

const AUTONOMY_TYPES = Object.freeze({
  POLICY_EVALUATED: "RECOVERY_AUTONOMY_POLICY_EVALUATED",
  RISK_SCORED: "RECOVERY_AUTONOMY_RISK_SCORED",
  AUTO_APPROVAL_ALLOWED: "RECOVERY_AUTONOMY_AUTO_APPROVAL_ALLOWED",
  AUTO_APPROVAL_BLOCKED: "RECOVERY_AUTONOMY_AUTO_APPROVAL_BLOCKED",
  PAUSED: "RECOVERY_AUTONOMY_PAUSED",
  RESUMED: "RECOVERY_AUTONOMY_RESUMED",
  LEVEL_CHANGED: "RECOVERY_AUTONOMY_LEVEL_CHANGED",
  FAILED: "RECOVERY_AUTONOMY_FAILED",
});

function appendAutonomyEvent({ type, message, payload, actor = "operator" }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listAutonomyEvents(limit = 5000) {
  return listAuditEvents(limit).filter((event) => String(event?.type || "").startsWith("RECOVERY_AUTONOMY_"));
}

function getRecoveryAutonomyStatus({ executionId = null } = {}) {
  const normalizedExecutionId = executionId == null ? null : String(executionId);
  const events = listAutonomyEvents();
  const levelEvent = events.find((event) => String(event?.type || "") === AUTONOMY_TYPES.LEVEL_CHANGED);
  const pauseEvent = events.find((event) => {
    const type = String(event?.type || "");
    if (![AUTONOMY_TYPES.PAUSED, AUTONOMY_TYPES.RESUMED].includes(type)) {
      return false;
    }
    const scope = String(event?.payload?.scope || "global");
    const targetExecutionId = event?.payload?.executionId == null ? null : String(event.payload.executionId);
    if (normalizedExecutionId == null) {
      return scope === "global";
    }
    return (scope === "execution" && targetExecutionId === normalizedExecutionId) || scope === "global";
  });

  return {
    level: levelEvent?.payload?.level ? String(levelEvent.payload.level) : "OFF",
    paused: pauseEvent ? String(pauseEvent.type) === AUTONOMY_TYPES.PAUSED : false,
    scope: pauseEvent?.payload?.scope ? String(pauseEvent.payload.scope) : (normalizedExecutionId == null ? "global" : "execution"),
    executionId: pauseEvent?.payload?.executionId == null ? normalizedExecutionId : String(pauseEvent.payload.executionId),
    reason: pauseEvent?.payload?.reason || null,
    updatedBy: pauseEvent?.payload?.pausedBy || pauseEvent?.payload?.resumedBy || levelEvent?.payload?.changedBy || null,
  };
}

function recordAutonomyPolicyEvaluated({ recoveryRequestId, executionId, policy, requestedBy }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.POLICY_EVALUATED,
    message: `Recovery autonomy policy evaluated for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      policy,
      requestedBy,
    },
  });
}

function recordAutonomyRiskScored({ recoveryRequestId, executionId, riskScore, requestedBy }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.RISK_SCORED,
    message: `Recovery autonomy risk scored for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      riskScore,
      requestedBy,
    },
  });
}

function recordAutonomyAutoApprovalAllowed({ recoveryRequestId, executionId, gate, requestedBy }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.AUTO_APPROVAL_ALLOWED,
    message: `Recovery autonomy allowed auto-approval for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      gate,
      requestedBy,
    },
  });
}

function recordAutonomyAutoApprovalBlocked({ recoveryRequestId, executionId, gate, requestedBy }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.AUTO_APPROVAL_BLOCKED,
    message: `Recovery autonomy blocked auto-approval for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      gate,
      requestedBy,
    },
  });
}

function recordAutonomyPaused({ scope, executionId = null, pausedBy, reason }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.PAUSED,
    message: "Recovery autonomy paused.",
    payload: {
      scope,
      executionId,
      pausedBy,
      reason,
    },
  });
}

function recordAutonomyResumed({ scope, executionId = null, resumedBy, reason }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.RESUMED,
    message: "Recovery autonomy resumed.",
    payload: {
      scope,
      executionId,
      resumedBy,
      reason,
    },
  });
}

function recordAutonomyLevelChanged({ level, changedBy, reason }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.LEVEL_CHANGED,
    message: `Recovery autonomy level changed to ${level}.`,
    payload: {
      level,
      changedBy,
      reason,
    },
  });
}

function recordAutonomyFailed({ recoveryRequestId = null, executionId = null, requestedBy, reason }) {
  return appendAutonomyEvent({
    type: AUTONOMY_TYPES.FAILED,
    message: "Recovery autonomy failed.",
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      reason,
    },
  });
}

module.exports = {
  AUTONOMY_TYPES,
  getRecoveryAutonomyStatus,
  listAutonomyEvents,
  recordAutonomyAutoApprovalAllowed,
  recordAutonomyAutoApprovalBlocked,
  recordAutonomyFailed,
  recordAutonomyLevelChanged,
  recordAutonomyPaused,
  recordAutonomyPolicyEvaluated,
  recordAutonomyResumed,
  recordAutonomyRiskScored,
};
