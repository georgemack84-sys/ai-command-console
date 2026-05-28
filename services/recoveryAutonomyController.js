"use strict";

const { listAuditEvents } = require("./auditTrail");
const recoveryAuditStore = require("./recoveryAuditStore");
const recoveryController = require("./recoveryController");
const { evaluateAutonomyPolicy } = require("./recoveryAutonomyPolicy");
const { scoreRecoveryAutonomyRisk } = require("./recoveryAutonomyRiskModel");
const { canAutoApproveRecovery } = require("./recoveryAutonomyGate");
const autonomyStore = require("./recoveryAutonomyStore");
const { explainAutonomyDecision } = require("./recoveryAutonomyExplainer");

function success(data) {
  return { ok: true, data };
}

function failure(message, details = {}) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_AUTONOMY",
    message: String(message || "Recovery autonomy blocked."),
    ...details,
  };
}

function listPendingRecoveryRequests(limit = 25) {
  const events = listAuditEvents(5000).filter((event) => String(event?.type || "").startsWith("RECOVERY_"));
  const ids = [];
  for (const event of events) {
    const id = String(event?.payload?.recoveryRequestId || "").trim();
    if (!id || ids.includes(id)) {
      continue;
    }
    ids.push(id);
  }

  const pending = [];
  for (const id of ids) {
    if (pending.length >= limit) {
      break;
    }
    const request = recoveryAuditStore.getRecoveryRequest(id);
    if (request?.status === "AWAITING_APPROVAL") {
      pending.push(request);
    }
  }
  return pending;
}

async function evaluatePendingRecoveryAutonomy({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  void db;
  const autonomyState = autonomyStore.getRecoveryAutonomyStatus({});
  if (autonomyState.paused) {
    return failure("Recovery autonomy is paused.");
  }

  const requests = listPendingRecoveryRequests(limit);
  let autoApproved = 0;
  const decisions = [];

  for (const recoveryRequest of requests) {
    const executionAutonomyState = autonomyStore.getRecoveryAutonomyStatus({ executionId: recoveryRequest.executionId });
    const effectiveState = {
      level: autonomyState.level,
      paused: executionAutonomyState.paused || autonomyState.paused,
    };

    const policy = evaluateAutonomyPolicy({
      recoveryRequest,
      advisory: null,
      automationDecision: null,
      modes,
      autonomyState: effectiveState,
    });
    autonomyStore.recordAutonomyPolicyEvaluated({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      executionId: recoveryRequest.executionId,
      policy,
      requestedBy,
    });

    const riskScore = scoreRecoveryAutonomyRisk({
      recoveryRequest,
      advisory: null,
      preview: recoveryRequest.preview || null,
      policy,
    });
    autonomyStore.recordAutonomyRiskScored({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      executionId: recoveryRequest.executionId,
      riskScore,
      requestedBy,
    });

    const gate = canAutoApproveRecovery({
      recoveryRequest,
      autonomyPolicy: policy,
      riskScore,
      modes: {
        autonomyLevel: autonomyState.level,
        autonomyAllowlist: Array.isArray(modes.autonomyAllowlist) ? modes.autonomyAllowlist : ["resume", "retry_safe_steps"],
      },
    });

    const explanation = explainAutonomyDecision({
      recoveryRequest,
      policy,
      riskScore,
      gate,
    });

    if (!gate.allowed || dryRun) {
      autonomyStore.recordAutonomyAutoApprovalBlocked({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        executionId: recoveryRequest.executionId,
        gate,
        requestedBy,
      });
      decisions.push({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        policy,
        riskScore,
        gate,
        explanation,
      });
      continue;
    }

    const approved = await recoveryController.approveRecovery({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      approvedBy: String(requestedBy || "").trim() || "autonomy",
    });

    if (!approved.ok) {
      autonomyStore.recordAutonomyFailed({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        executionId: recoveryRequest.executionId,
        requestedBy,
        reason: approved.message || approved.error || "approval_failed",
      });
      decisions.push({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        policy,
        riskScore,
        gate,
        explanation,
      });
      continue;
    }

    autonomyStore.recordAutonomyAutoApprovalAllowed({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      executionId: recoveryRequest.executionId,
      gate,
      requestedBy,
    });
    autoApproved += 1;
    decisions.push({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      policy,
      riskScore,
      gate,
      explanation,
      approved: approved.data,
    });
  }

  return success({
    evaluated: requests.length,
    autoApproved,
    decisions,
  });
}

async function setRecoveryAutonomyLevel({ level, changedBy, reason }) {
  if (!["OFF", "ADVISORY_ONLY", "REQUEST_ONLY", "SUPERVISED_APPROVAL"].includes(String(level || ""))) {
    return failure("Invalid recovery autonomy level.");
  }
  autonomyStore.recordAutonomyLevelChanged({
    level: String(level),
    changedBy: String(changedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "changed",
  });
  return success({ level: String(level) });
}

async function pauseRecoveryAutonomy({ scope, executionId = null, pausedBy, reason }) {
  if (!String(scope || "").trim()) {
    return failure("Recovery autonomy pause scope is required.");
  }
  autonomyStore.recordAutonomyPaused({
    scope: String(scope),
    executionId,
    pausedBy: String(pausedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "paused",
  });
  return success({ paused: true });
}

async function resumeRecoveryAutonomy({ scope, executionId = null, resumedBy, reason }) {
  if (!String(scope || "").trim()) {
    return failure("Recovery autonomy resume scope is required.");
  }
  autonomyStore.recordAutonomyResumed({
    scope: String(scope),
    executionId,
    resumedBy: String(resumedBy || "").trim() || "operator",
    reason: String(reason || "").trim() || "resumed",
  });
  return success({ paused: false });
}

async function getRecoveryAutonomyStatus({ executionId = null } = {}) {
  return success(autonomyStore.getRecoveryAutonomyStatus({ executionId }));
}

module.exports = {
  evaluatePendingRecoveryAutonomy,
  getRecoveryAutonomyStatus,
  pauseRecoveryAutonomy,
  resumeRecoveryAutonomy,
  setRecoveryAutonomyLevel,
};
