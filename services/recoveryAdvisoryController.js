"use strict";

const { loadExecutionState } = require("./executionStateStore");
const { getActiveExecutionLock, listLedgerEvents } = require("./executionIntegrityStore");
const { scanRecoveryCandidates } = require("./recoveryCandidateScanner");
const { classifyRecoverySignal } = require("./recoverySignalClassifier");
const { recommendRecoveryAction } = require("./recoveryRecommendationEngine");
const { explainRecoveryAdvisory } = require("./recoveryAdvisoryExplainer");
const advisoryStore = require("./recoveryAdvisoryStore");
const recoveryController = require("./recoveryController");

function success(data) {
  return { ok: true, data };
}

function failure(message, details = {}) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_ADVISORY",
    message: String(message || "Recovery advisory operation blocked."),
    ...details,
  };
}

function createAdvisoryId() {
  return `advisory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function scanAndRecommendRecoveries({ db = null, modes = {}, requestedBy = "system", limit = 25 } = {}) {
  const scanned = scanRecoveryCandidates({ db, modes, limit });
  if (!scanned.ok) {
    return failure(scanned.message || "Recovery candidate scan failed.");
  }

  const advisories = [];
  for (const candidate of scanned.data.candidates || []) {
    const executionState = loadExecutionState(candidate.executionId);
    const lockState = getActiveExecutionLock(candidate.planId);
    const ledgerResult = listLedgerEvents(candidate.planId, candidate.executionId);
    if (!ledgerResult.ok) {
      return failure(ledgerResult.message || "Recovery advisory ledger read failed.");
    }

    const signal = classifyRecoverySignal({
      candidate,
      executionState,
      lockState: lockState.ok ? lockState.data : null,
      ledgerEvents: ledgerResult.data,
    });
    if (!signal.ok) {
      return failure(signal.message || "Recovery signal classification failed.");
    }

    const recommendation = recommendRecoveryAction({
      candidate,
      signal: signal.data,
      modes,
    });
    if (!recommendation.ok) {
      return failure(recommendation.message || "Recovery recommendation failed.");
    }

    const explanation = explainRecoveryAdvisory({
      candidate,
      signal: signal.data,
      recommendation: recommendation.data,
    });
    if (!explanation.ok) {
      return failure(explanation.message || "Recovery advisory explanation failed.");
    }

    const advisoryId = createAdvisoryId();
    advisoryStore.recordAdvisoryCreated({
      advisoryId,
      executionId: candidate.executionId,
      candidate,
      requestedBy,
    });
    advisoryStore.recordAdvisoryRecommendation({
      advisoryId,
      executionId: candidate.executionId,
      signal: signal.data,
      recommendation: recommendation.data,
      explanation: explanation.data,
      requestedBy,
    });

    advisories.push(advisoryStore.getAdvisoryById(advisoryId));
  }

  return success({ advisories });
}

async function createRecoveryRequestFromAdvisory({ advisoryId, requestedBy }) {
  const advisory = advisoryStore.getAdvisoryById(advisoryId);
  if (!advisory) {
    return failure("Recovery advisory was not found.");
  }
  if (!["OPEN", "ESCALATED"].includes(String(advisory.state || ""))) {
    return failure("Recovery advisory is not eligible to create a recovery request.");
  }
  const recommendation = String(advisory.recommendation?.recommendation || "none");
  if (recommendation === "none") {
    return failure("Recovery advisory does not recommend a recovery action.");
  }

  const result = await recoveryController.requestRecovery({
    executionId: advisory.executionId,
    recoveryMode: recommendation,
    requestedBy: String(requestedBy || "").trim() || "operator",
  });
  if (!result.ok) {
    return failure(result.message || "Recovery request creation failed.", { code: result.code || result.error });
  }

  advisoryStore.recordAdvisoryRequestCreated({
    advisoryId: advisory.advisoryId,
    executionId: advisory.executionId,
    requestedBy: String(requestedBy || "").trim() || "operator",
    recoveryRequest: result.data,
  });

  return success(result.data);
}

async function dismissRecoveryAdvisory({ advisoryId, dismissedBy, reason }) {
  const advisory = advisoryStore.getAdvisoryById(advisoryId);
  if (!advisory) {
    return failure("Recovery advisory was not found.");
  }
  if (advisory.state !== "OPEN" && advisory.state !== "ESCALATED") {
    return failure("Recovery advisory is not dismissible.");
  }
  advisoryStore.recordAdvisoryDismissed({
    advisoryId: advisory.advisoryId,
    executionId: advisory.executionId,
    dismissedBy: String(dismissedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "dismissed",
  });
  return success({
    advisoryId: advisory.advisoryId,
    executionId: advisory.executionId,
    state: "DISMISSED",
  });
}

async function escalateRecoveryAdvisory({ advisoryId, escalatedBy, reason }) {
  const advisory = advisoryStore.getAdvisoryById(advisoryId);
  if (!advisory) {
    return failure("Recovery advisory was not found.");
  }
  if (advisory.state !== "OPEN") {
    return failure("Recovery advisory is not open for escalation.");
  }
  advisoryStore.recordAdvisoryEscalated({
    advisoryId: advisory.advisoryId,
    executionId: advisory.executionId,
    escalatedBy: String(escalatedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "escalated",
  });
  return success({
    advisoryId: advisory.advisoryId,
    executionId: advisory.executionId,
    state: "ESCALATED",
  });
}

module.exports = {
  createRecoveryRequestFromAdvisory,
  dismissRecoveryAdvisory,
  escalateRecoveryAdvisory,
  scanAndRecommendRecoveries,
};
