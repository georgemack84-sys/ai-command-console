"use strict";

const { listAuditEvents } = require("./auditTrail");
const verificationStore = require("./recoveryVerificationStore");
const executionStore = require("./recoveryExecutionStore");
const autonomyStore = require("./recoveryAutonomyStore");
const automationStore = require("./recoveryAutomationStore");
const learningStore = require("./recoveryLearningStore");
const { aggregateRecoveryLearningSignals } = require("./recoveryLearningSignalAggregator");
const { recommendRecoveryPolicyAdjustments } = require("./recoveryLearningPolicyAdvisor");
const { explainRecoveryLearningReport } = require("./recoveryLearningExplainer");

function failure(message) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_LEARNING",
    message: String(message || "Recovery learning run blocked."),
  };
}

function success(data) {
  return { ok: true, data };
}

function runRecoveryLearningPass({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  try {
    const verificationEvents = verificationStore.listVerificationEvents(5000);
    const executionEvents = executionStore.listExecutionEvents(5000);
    const autonomyEvents = autonomyStore.listAutonomyEvents(5000);
    const automationEvents = automationStore.listAutomationEvents(5000);
    const advisoryEvents = listAuditEvents(5000).filter((event) => String(event?.type || "").startsWith("RECOVERY_ADVISORY_"));

    const learningSignalsResult = aggregateRecoveryLearningSignals({
      verificationEvents,
      executionEvents,
      advisoryEvents,
      automationEvents,
      autonomyEvents,
    });
    if (!learningSignalsResult.ok) {
      return learningSignalsResult;
    }

    const recommendationsResult = recommendRecoveryPolicyAdjustments({
      learningSignals: learningSignalsResult.data,
      modes,
    });
    if (!recommendationsResult.ok) {
      return recommendationsResult;
    }

    const report = explainRecoveryLearningReport({
      learningSignals: learningSignalsResult.data,
      recommendations: recommendationsResult.data.recommendations,
    });

    if (!dryRun) {
      learningStore.recordLearningRunStarted({ requestedBy, dryRun });
      learningStore.recordLearningSignalsAggregated({ signals: learningSignalsResult.data, requestedBy });
      learningStore.recordLearningPolicyRecommended({
        recommendations: recommendationsResult.data.recommendations,
        requestedBy,
      });
      learningStore.recordLearningReportCreated({
        report: {
          ...report,
          requestedBy,
          limit: Number(limit || 0),
        },
        requestedBy,
      });
    }

    return success({
      learningSignals: learningSignalsResult.data,
      recommendations: recommendationsResult.data.recommendations,
      report,
    });
  } catch (error) {
    if (!dryRun) {
      learningStore.recordLearningRunFailed({
        requestedBy,
        reason: String(error?.message || "unknown_error"),
      });
    }
    return failure(error.message);
  }
}

module.exports = {
  runRecoveryLearningPass,
};
