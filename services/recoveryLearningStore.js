"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");

const LEARNING_TYPES = Object.freeze({
  RUN_STARTED: "RECOVERY_LEARNING_RUN_STARTED",
  SIGNALS_AGGREGATED: "RECOVERY_LEARNING_SIGNALS_AGGREGATED",
  POLICY_RECOMMENDED: "RECOVERY_LEARNING_POLICY_RECOMMENDED",
  REPORT_CREATED: "RECOVERY_LEARNING_REPORT_CREATED",
  RUN_FAILED: "RECOVERY_LEARNING_RUN_FAILED",
});

function appendLearningEvent({ type, message, payload, actor = "operator" }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listLearningEvents(limit = 5000) {
  return listAuditEvents(limit).filter((event) => String(event?.type || "").startsWith("RECOVERY_LEARNING_"));
}

function recordLearningRunStarted({ requestedBy, dryRun }) {
  return appendLearningEvent({
    type: LEARNING_TYPES.RUN_STARTED,
    message: "Recovery learning run started.",
    payload: {
      requestedBy,
      dryRun: Boolean(dryRun),
    },
  });
}

function recordLearningSignalsAggregated({ signals, requestedBy }) {
  return appendLearningEvent({
    type: LEARNING_TYPES.SIGNALS_AGGREGATED,
    message: "Recovery learning signals aggregated.",
    payload: {
      signals,
      requestedBy,
    },
  });
}

function recordLearningPolicyRecommended({ recommendations, requestedBy }) {
  return appendLearningEvent({
    type: LEARNING_TYPES.POLICY_RECOMMENDED,
    message: "Recovery learning policy recommendations generated.",
    payload: {
      recommendations,
      requestedBy,
    },
  });
}

function recordLearningReportCreated({ report, requestedBy }) {
  return appendLearningEvent({
    type: LEARNING_TYPES.REPORT_CREATED,
    message: "Recovery learning report created.",
    payload: {
      report,
      requestedBy,
    },
  });
}

function recordLearningRunFailed({ requestedBy, reason }) {
  return appendLearningEvent({
    type: LEARNING_TYPES.RUN_FAILED,
    message: "Recovery learning run failed.",
    payload: {
      requestedBy,
      reason,
    },
  });
}

function deriveLearningState() {
  const events = listLearningEvents();
  const latest = events[0] || null;
  const latestReport = getLatestLearningReport({ executionId: null });
  return {
    latestEventType: latest?.type || null,
    latestReport,
  };
}

function getLatestLearningReport({ executionId = null } = {}) {
  const normalizedExecutionId = executionId == null ? null : String(executionId);
  const reportEvent = listLearningEvents().find((event) => {
    if (String(event?.type || "") !== LEARNING_TYPES.REPORT_CREATED) {
      return false;
    }
    if (normalizedExecutionId == null) {
      return true;
    }
    return String(event?.payload?.report?.executionId || "") === normalizedExecutionId;
  });
  return reportEvent?.payload || null;
}

function listLearningReports({ limit = 20 } = {}) {
  return listLearningEvents(Math.max(Number(limit || 20), 1) * 5)
    .filter((event) => String(event?.type || "") === LEARNING_TYPES.REPORT_CREATED)
    .slice(0, Math.max(1, Number(limit || 20)))
    .map((event) => event?.payload || null)
    .filter(Boolean);
}

module.exports = {
  deriveLearningState,
  getLatestLearningReport,
  listLearningEvents,
  listLearningReports,
  recordLearningPolicyRecommended,
  recordLearningReportCreated,
  recordLearningRunFailed,
  recordLearningRunStarted,
  recordLearningSignalsAggregated,
};
