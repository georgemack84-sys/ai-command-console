"use strict";

const advisoryController = require("./recoveryAdvisoryController");
const { evaluateAutomationPolicy } = require("./recoveryAutomationPolicy");
const { shouldThrottleAutomation } = require("./recoveryAutomationThrottle");
const automationStore = require("./recoveryAutomationStore");
const { explainAutomationDecision } = require("./recoveryAutomationExplainer");

function success(data) {
  return { ok: true, data };
}

function failure(message, details = {}) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_AUTOMATION",
    message: String(message || "Recovery automation blocked."),
    ...details,
  };
}

async function runRecoveryAutomationScan({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  const status = automationStore.getAutomationStatus({});
  if (status.paused) {
    return failure("Recovery automation is paused.");
  }

  automationStore.recordAutomationScanStarted({
    requestedBy,
    limit,
    dryRun,
  });

  const scanned = await advisoryController.scanAndRecommendRecoveries({
    db,
    modes,
    requestedBy,
    limit,
  });
  if (!scanned.ok) {
    automationStore.recordAutomationFailed({
      requestedBy,
      reason: scanned.message || "scan_failed",
    });
    return failure(scanned.message || "Recovery automation scan failed.");
  }

  let requestsOpened = 0;
  const decisions = [];
  for (const advisory of scanned.data.advisories || []) {
    const executionStatus = automationStore.getAutomationStatus({ executionId: advisory.executionId });
    const policy = evaluateAutomationPolicy({
      advisory,
      recommendation: advisory.recommendation,
      modes,
      automationState: executionStatus,
    });

    automationStore.recordAutomationPolicyEvaluated({
      executionId: advisory.executionId,
      advisoryId: advisory.advisoryId,
      signalType: advisory.signal?.signalType || advisory.candidate?.signalType || null,
      recommendation: advisory.recommendation?.recommendation || "none",
      policy,
      requestedBy,
    });

    const throttle = shouldThrottleAutomation({
      executionId: advisory.executionId,
      signalType: advisory.signal?.signalType || advisory.candidate?.signalType || null,
      recommendation: advisory.recommendation?.recommendation || "none",
      history: automationStore.listAutomationEvents(),
      now: Date.now(),
    });

    const explanation = explainAutomationDecision({
      advisory,
      policy,
      throttle,
    });

    if (throttle.throttled) {
      automationStore.recordAutomationSuppressed({
        executionId: advisory.executionId,
        advisoryId: advisory.advisoryId,
        signalType: advisory.signal?.signalType || advisory.candidate?.signalType || null,
        recommendation: advisory.recommendation?.recommendation || "none",
        policy,
        throttle,
        requestedBy,
      });
      decisions.push({ advisoryId: advisory.advisoryId, policy, throttle, explanation });
      continue;
    }

    if (!policy.allowed || policy.action !== "create_request" || dryRun) {
      automationStore.recordAutomationSuppressed({
        executionId: advisory.executionId,
        advisoryId: advisory.advisoryId,
        signalType: advisory.signal?.signalType || advisory.candidate?.signalType || null,
        recommendation: advisory.recommendation?.recommendation || "none",
        policy,
        throttle,
        requestedBy,
      });
      decisions.push({ advisoryId: advisory.advisoryId, policy, throttle, explanation });
      continue;
    }

    const created = await advisoryController.createRecoveryRequestFromAdvisory({
      advisoryId: advisory.advisoryId,
      requestedBy,
    });
    if (!created.ok) {
      automationStore.recordAutomationBlocked({
        executionId: advisory.executionId,
        advisoryId: advisory.advisoryId,
        signalType: advisory.signal?.signalType || advisory.candidate?.signalType || null,
        recommendation: advisory.recommendation?.recommendation || "none",
        policy,
        requestedBy,
        reason: created.message || created.error || "request_creation_failed",
      });
      decisions.push({ advisoryId: advisory.advisoryId, policy, throttle, explanation });
      continue;
    }

    automationStore.recordAutomationRequestOpened({
      executionId: advisory.executionId,
      advisoryId: advisory.advisoryId,
      signalType: advisory.signal?.signalType || advisory.candidate?.signalType || null,
      recommendation: advisory.recommendation?.recommendation || "none",
      recoveryRequest: created.data,
      requestedBy,
    });
    requestsOpened += 1;
    decisions.push({ advisoryId: advisory.advisoryId, policy, throttle, explanation, recoveryRequest: created.data });
  }

  automationStore.recordAutomationScanCompleted({
    requestedBy,
    advisoriesProcessed: (scanned.data.advisories || []).length,
    requestsOpened,
    dryRun,
  });

  return success({
    advisoriesProcessed: (scanned.data.advisories || []).length,
    requestsOpened,
    decisions,
  });
}

module.exports = {
  runRecoveryAutomationScan,
};
