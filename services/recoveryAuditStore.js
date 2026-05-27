"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");
const { transitionState } = require("./recoveryLifecycle");

const RECOVERY_AUDIT_TYPES = Object.freeze({
  REQUESTED: "RECOVERY_REQUESTED",
  PREVIEWED: "RECOVERY_PREVIEWED",
  POLICY_DECISION: "RECOVERY_POLICY_DECISION",
  APPROVED: "RECOVERY_APPROVED",
  COMMIT_ATTEMPT: "RECOVERY_COMMIT_ATTEMPT",
  COMMITTED: "RECOVERY_COMMITTED",
  BLOCKED: "RECOVERY_BLOCKED",
  FAILED: "RECOVERY_FAILED",
  CANCELLED: "RECOVERY_CANCELLED",
});

const TERMINAL_STATES = new Set(["COMMITTED", "BLOCKED", "FAILED", "CANCELLED"]);

function success(data) {
  return { ok: true, data };
}

function failure(message) {
  return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY", message: String(message || "Recovery audit operation blocked.") };
}

function appendRecoveryAudit({ actor = "operator", type, message, payload }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listRecoveryAuditEvents(limit = 5000) {
  return listAuditEvents(limit)
    .filter((event) => String(event?.type || "").startsWith("RECOVERY_"));
}

function getTransitionEventForAudit(event) {
  switch (String(event?.type || "")) {
    case RECOVERY_AUDIT_TYPES.REQUESTED:
      return "CREATE_REQUEST";
    case RECOVERY_AUDIT_TYPES.POLICY_DECISION:
      if (event?.payload?.status === "AWAITING_APPROVAL") {
        return "MARK_AWAITING_APPROVAL";
      }
      if (event?.payload?.status === "PREVIEWED") {
        return "MARK_PREVIEWED";
      }
      if (event?.payload?.status === "BLOCKED") {
        return "MARK_BLOCKED";
      }
      return null;
    case RECOVERY_AUDIT_TYPES.APPROVED:
      return "APPROVE";
    case RECOVERY_AUDIT_TYPES.COMMITTED:
      return "COMMIT_SUCCESS";
    case RECOVERY_AUDIT_TYPES.BLOCKED:
      return "COMMIT_BLOCK";
    case RECOVERY_AUDIT_TYPES.FAILED:
      return "FAIL";
    case RECOVERY_AUDIT_TYPES.CANCELLED:
      return "CANCEL";
    default:
      return null;
  }
}

function buildRequestFromEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }

  const ordered = [...events].reverse();
  let state = null;
  let request = null;
  for (const event of ordered) {
    const transitionEvent = getTransitionEventForAudit(event);
    if (transitionEvent) {
      const transition = transitionState(state, transitionEvent);
      if (!transition.ok) {
        return null;
      }
      state = transition.data.state;
    }

    const payload = event?.payload || {};
    request = {
      ...(request || {}),
      recoveryRequestId: String(payload.recoveryRequestId || request?.recoveryRequestId || ""),
      executionId: String(payload.executionId || request?.executionId || ""),
      recoveryMode: String(payload.recoveryMode || request?.recoveryMode || ""),
      requestedBy: String(payload.requestedBy || request?.requestedBy || ""),
      approvedBy: payload.approvedBy || request?.approvedBy || null,
      plan: payload.plan || request?.plan || null,
      planHash: payload.planHash || request?.planHash || null,
      preview: payload.preview || request?.preview || null,
      policy: payload.policy || request?.policy || null,
      status: state,
      auditEvents: ordered,
    };
  }
  return request;
}

function getRecoveryRequest(recoveryRequestId) {
  const normalizedId = String(recoveryRequestId || "").trim();
  if (!normalizedId) {
    return null;
  }
  const events = listRecoveryAuditEvents().filter((event) => String(event?.payload?.recoveryRequestId || "") === normalizedId);
  return buildRequestFromEvents(events);
}

function listRecoveryRequestsForExecution(executionId) {
  const normalizedExecutionId = String(executionId || "").trim();
  if (!normalizedExecutionId) {
    return [];
  }
  const grouped = new Map();
  for (const event of listRecoveryAuditEvents()) {
    const payload = event?.payload || {};
    if (String(payload.executionId || "") !== normalizedExecutionId) {
      continue;
    }
    const recoveryRequestId = String(payload.recoveryRequestId || "").trim();
    if (!recoveryRequestId) {
      continue;
    }
    if (!grouped.has(recoveryRequestId)) {
      grouped.set(recoveryRequestId, []);
    }
    grouped.get(recoveryRequestId).push(event);
  }
  return Array.from(grouped.values())
    .map((events) => buildRequestFromEvents(events))
    .filter(Boolean);
}

function findActiveRecoveryForExecution(executionId) {
  return listRecoveryRequestsForExecution(executionId)
    .find((request) => request?.status && !TERMINAL_STATES.has(request.status)) || null;
}

function recordRecoveryRequest({ recoveryRequestId, executionId, recoveryMode, requestedBy, plan, planHash }) {
  const event = appendRecoveryAudit({
    actor: "operator",
    type: RECOVERY_AUDIT_TYPES.REQUESTED,
    message: `Recovery requested for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      recoveryMode,
      requestedBy,
      plan,
      planHash,
      status: "REQUESTED",
    },
  });
  return success(event);
}

function recordPreview({ recoveryRequestId, executionId, preview, requestedBy }) {
  const event = appendRecoveryAudit({
    actor: "operator",
    type: RECOVERY_AUDIT_TYPES.PREVIEWED,
    message: `Recovery preview created for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      preview,
    },
  });
  return success(event);
}

function recordPolicyDecision({ recoveryRequestId, executionId, policy, requestedBy }) {
  const status = policy?.allowed
    ? (policy.requiresApproval ? "AWAITING_APPROVAL" : "PREVIEWED")
    : "BLOCKED";
  const event = appendRecoveryAudit({
    actor: "operator",
    type: RECOVERY_AUDIT_TYPES.POLICY_DECISION,
    message: `Recovery policy decided for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      policy,
      status,
    },
  });
  return success(event);
}

function recordApproval({ recoveryRequestId, executionId, approvedBy }) {
  const event = appendRecoveryAudit({
    actor: "operator",
    type: RECOVERY_AUDIT_TYPES.APPROVED,
    message: `Recovery approved for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      approvedBy,
      status: "APPROVED",
    },
  });
  return success(event);
}

function recordCommitAttempt({ recoveryRequestId, executionId, requestedBy, dryRun }) {
  const event = appendRecoveryAudit({
    actor: "operator",
    type: RECOVERY_AUDIT_TYPES.COMMIT_ATTEMPT,
    message: `Recovery commit attempted for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      dryRun: Boolean(dryRun),
    },
  });
  return success(event);
}

function recordCommitResult({ recoveryRequestId, executionId, requestedBy, result }) {
  const type = result?.ok
    ? RECOVERY_AUDIT_TYPES.COMMITTED
    : String(result?.code || "") === "STALE_RECOVERY_PLAN"
      ? RECOVERY_AUDIT_TYPES.BLOCKED
      : RECOVERY_AUDIT_TYPES.FAILED;
  const status = type === RECOVERY_AUDIT_TYPES.COMMITTED
    ? "COMMITTED"
    : type === RECOVERY_AUDIT_TYPES.BLOCKED
      ? "BLOCKED"
      : "FAILED";
  const event = appendRecoveryAudit({
    actor: "operator",
    type,
    message: `Recovery commit ${status.toLowerCase()} for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
      result,
      status,
    },
  });
  return success(event);
}

function recordCancellation({ recoveryRequestId, executionId }) {
  const event = appendRecoveryAudit({
    actor: "operator",
    type: RECOVERY_AUDIT_TYPES.CANCELLED,
    message: `Recovery cancelled for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      status: "CANCELLED",
    },
  });
  return success(event);
}

module.exports = {
  RECOVERY_AUDIT_TYPES,
  findActiveRecoveryForExecution,
  getRecoveryRequest,
  listRecoveryRequestsForExecution,
  recordApproval,
  recordCancellation,
  recordCommitAttempt,
  recordCommitResult,
  recordPolicyDecision,
  recordPreview,
  recordRecoveryRequest,
};
