"use strict";

const { listAuditEvents } = require("./auditTrail");
const recoveryAuditStore = require("./recoveryAuditStore");
const recoveryController = require("./recoveryController");
const { evaluateRecoveryExecutionPolicy } = require("./recoveryExecutionPolicy");
const { canExecuteApprovedRecovery } = require("./recoveryExecutionGate");
const executionStore = require("./recoveryExecutionStore");
const { explainRecoveryExecutionDecision } = require("./recoveryExecutionExplainer");

function success(data) {
  return { ok: true, data };
}

function failure(message, details = {}) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_EXECUTION",
    message: String(message || "Recovery execution blocked."),
    ...details,
  };
}

function listApprovedRecoveryRequests(limit = 25) {
  const events = listAuditEvents(5000).filter((event) => String(event?.type || "").startsWith("RECOVERY_"));
  const ids = [];
  for (const event of events) {
    const id = String(event?.payload?.recoveryRequestId || "").trim();
    if (!id || ids.includes(id)) {
      continue;
    }
    ids.push(id);
  }

  const approved = [];
  for (const id of ids) {
    if (approved.length >= limit) {
      break;
    }
    const request = recoveryAuditStore.getRecoveryRequest(id);
    if (request?.status === "APPROVED") {
      approved.push(request);
    }
  }
  return approved;
}

async function runApprovedRecoveryExecution({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  void db;
  const orchestrationState = executionStore.deriveRecoveryExecutionState({});
  if (orchestrationState.paused) {
    return failure("Recovery execution orchestration is paused.");
  }

  const requests = listApprovedRecoveryRequests(limit);
  let committed = 0;
  let blocked = 0;
  let failed = 0;
  const decisions = [];

  for (const recoveryRequest of requests) {
    const perExecutionState = executionStore.deriveRecoveryExecutionState({ executionId: recoveryRequest.executionId });
    const effectiveState = {
      paused: orchestrationState.paused || perExecutionState.paused,
      successfulCommits: perExecutionState.successfulCommits,
      inFlightExecutionIds: perExecutionState.inFlightExecutionIds,
    };

    const policy = evaluateRecoveryExecutionPolicy({
      recoveryRequest,
      modes,
      executionState: effectiveState,
    });
    executionStore.recordExecutionPolicyEvaluated({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      executionId: recoveryRequest.executionId,
      policy,
      requestedBy,
    });

    const gate = canExecuteApprovedRecovery({
      recoveryRequest,
      policy,
      modes,
      orchestrationState: effectiveState,
    });

    if (!gate.allowed || dryRun) {
      executionStore.recordExecutionGateBlocked({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        executionId: recoveryRequest.executionId,
        gate,
        requestedBy,
      });
      if (!gate.allowed) {
        blocked += 1;
      }
      decisions.push({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        policy,
        gate,
        explanation: explainRecoveryExecutionDecision({
          recoveryRequest,
          policy,
          gate,
          commitResult: null,
        }),
      });
      continue;
    }

    executionStore.recordExecutionGateAllowed({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      executionId: recoveryRequest.executionId,
      gate,
      requestedBy,
    });
    executionStore.recordExecutionCommitAttempted({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      executionId: recoveryRequest.executionId,
      requestedBy,
      dryRun,
    });

    const commitResult = await recoveryController.commitRecovery({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      requestedBy,
      dryRun: false,
    });

    if (commitResult.ok) {
      executionStore.recordExecutionCommitted({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        executionId: recoveryRequest.executionId,
        requestedBy,
        result: commitResult.data,
      });
      committed += 1;
    } else if (String(commitResult.code || "") === "STALE_RECOVERY_PLAN") {
      executionStore.recordExecutionBlocked({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        executionId: recoveryRequest.executionId,
        requestedBy,
        result: commitResult,
      });
      blocked += 1;
    } else {
      executionStore.recordExecutionFailed({
        recoveryRequestId: recoveryRequest.recoveryRequestId,
        executionId: recoveryRequest.executionId,
        requestedBy,
        result: commitResult,
      });
      failed += 1;
    }

    decisions.push({
      recoveryRequestId: recoveryRequest.recoveryRequestId,
      policy,
      gate,
      commitResult,
      explanation: explainRecoveryExecutionDecision({
        recoveryRequest,
        policy,
        gate,
        commitResult,
      }),
    });
  }

  return success({
    evaluated: requests.length,
    committed,
    blocked,
    failed,
    decisions,
  });
}

module.exports = {
  runApprovedRecoveryExecution,
};
