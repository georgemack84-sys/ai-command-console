"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");

const ADVISORY_TYPES = Object.freeze({
  CREATED: "RECOVERY_ADVISORY_CREATED",
  RECOMMENDED: "RECOVERY_ADVISORY_RECOMMENDED",
  DISMISSED: "RECOVERY_ADVISORY_DISMISSED",
  ESCALATED: "RECOVERY_ADVISORY_ESCALATED",
  REQUEST_CREATED: "RECOVERY_ADVISORY_REQUEST_CREATED",
});

function success(data) {
  return { ok: true, data };
}

function appendAdvisoryEvent({ type, message, payload, actor = "operator" }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listAdvisoryEvents(limit = 5000) {
  return listAuditEvents(limit).filter((event) => String(event?.type || "").startsWith("RECOVERY_ADVISORY_"));
}

function deriveAdvisoryState(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return "OPEN";
  }
  const latest = events[0];
  switch (String(latest?.type || "")) {
    case ADVISORY_TYPES.DISMISSED:
      return "DISMISSED";
    case ADVISORY_TYPES.ESCALATED:
      return "ESCALATED";
    case ADVISORY_TYPES.REQUEST_CREATED:
      return "REQUEST_CREATED";
    default:
      return "OPEN";
  }
}

function buildAdvisory(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }
  const ordered = [...events].reverse();
  let advisory = null;
  for (const event of ordered) {
    const payload = event?.payload || {};
    advisory = {
      ...(advisory || {}),
      advisoryId: String(payload.advisoryId || advisory?.advisoryId || ""),
      executionId: String(payload.executionId || advisory?.executionId || ""),
      candidate: payload.candidate || advisory?.candidate || null,
      signal: payload.signal || advisory?.signal || null,
      recommendation: payload.recommendation || advisory?.recommendation || null,
      explanation: payload.explanation || advisory?.explanation || null,
      requestedBy: String(payload.requestedBy || advisory?.requestedBy || ""),
      recoveryRequest: payload.recoveryRequest || advisory?.recoveryRequest || null,
      events: ordered,
    };
  }
  if (!advisory) {
    return null;
  }
  return {
    ...advisory,
    state: deriveAdvisoryState(events),
  };
}

function getAdvisoryById(advisoryId) {
  const normalized = String(advisoryId || "").trim();
  if (!normalized) {
    return null;
  }
  const events = listAdvisoryEvents().filter((event) => String(event?.payload?.advisoryId || "") === normalized);
  return buildAdvisory(events);
}

function listOpenAdvisories() {
  const grouped = new Map();
  for (const event of listAdvisoryEvents()) {
    const advisoryId = String(event?.payload?.advisoryId || "").trim();
    if (!advisoryId) {
      continue;
    }
    if (!grouped.has(advisoryId)) {
      grouped.set(advisoryId, []);
    }
    grouped.get(advisoryId).push(event);
  }
  return Array.from(grouped.values())
    .map((events) => buildAdvisory(events))
    .filter((advisory) => advisory && advisory.state === "OPEN");
}

function recordAdvisoryCreated({ advisoryId, executionId, candidate, requestedBy = "system" }) {
  return success(
    appendAdvisoryEvent({
      type: ADVISORY_TYPES.CREATED,
      message: `Recovery advisory created for ${executionId}.`,
      payload: {
        advisoryId,
        executionId,
        candidate,
        requestedBy,
      },
    }),
  );
}

function recordAdvisoryRecommendation({ advisoryId, executionId, signal = null, recommendation = null, explanation = null, requestedBy = "system" }) {
  return success(
    appendAdvisoryEvent({
      type: ADVISORY_TYPES.RECOMMENDED,
      message: `Recovery advisory recommendation recorded for ${executionId}.`,
      payload: {
        advisoryId,
        executionId,
        signal,
        recommendation,
        explanation,
        requestedBy,
      },
    }),
  );
}

function recordAdvisoryDismissed({ advisoryId, executionId, dismissedBy, reason }) {
  return success(
    appendAdvisoryEvent({
      type: ADVISORY_TYPES.DISMISSED,
      message: `Recovery advisory dismissed for ${executionId}.`,
      payload: {
        advisoryId,
        executionId,
        dismissedBy,
        reason,
      },
    }),
  );
}

function recordAdvisoryEscalated({ advisoryId, executionId, escalatedBy, reason }) {
  return success(
    appendAdvisoryEvent({
      type: ADVISORY_TYPES.ESCALATED,
      message: `Recovery advisory escalated for ${executionId}.`,
      payload: {
        advisoryId,
        executionId,
        escalatedBy,
        reason,
      },
    }),
  );
}

function recordAdvisoryRequestCreated({ advisoryId, executionId, requestedBy, recoveryRequest }) {
  return success(
    appendAdvisoryEvent({
      type: ADVISORY_TYPES.REQUEST_CREATED,
      message: `Recovery request created from advisory for ${executionId}.`,
      payload: {
        advisoryId,
        executionId,
        requestedBy,
        recoveryRequest,
      },
    }),
  );
}

module.exports = {
  deriveAdvisoryState,
  getAdvisoryById,
  listOpenAdvisories,
  recordAdvisoryCreated,
  recordAdvisoryDismissed,
  recordAdvisoryEscalated,
  recordAdvisoryRecommendation,
  recordAdvisoryRequestCreated,
};
