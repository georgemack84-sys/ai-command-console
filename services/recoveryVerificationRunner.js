"use strict";

const { listAuditEvents } = require("./auditTrail");
const recoveryAuditStore = require("./recoveryAuditStore");
const executionStore = require("./recoveryExecutionStore");
const executionStateStore = require("./executionStateStore");
const integrityStore = require("./executionIntegrityStore");
const { evaluateRecoveryVerificationPolicy } = require("./recoveryVerificationPolicy");
const { verifyRecoveryOutcome } = require("./recoveryVerificationChecker");
const verificationStore = require("./recoveryVerificationStore");
const { explainRecoveryVerification } = require("./recoveryVerificationExplainer");

function success(data) {
  return { ok: true, data };
}

function failure(message, details = {}) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_VERIFICATION",
    message: String(message || "Recovery verification blocked."),
    ...details,
  };
}

function listCompletedExecutionResults(limit = 25) {
  const events = listAuditEvents(5000).filter((event) => String(event?.type || "").startsWith("RECOVERY_EXECUTION_"));
  const requestIds = [];
  for (const event of events) {
    const id = String(event?.payload?.recoveryRequestId || "").trim();
    if (!id || requestIds.includes(id)) {
      continue;
    }
    requestIds.push(id);
  }

  const results = [];
  for (const recoveryRequestId of requestIds) {
    if (results.length >= limit) {
      break;
    }
    const related = events.filter((event) => String(event?.payload?.recoveryRequestId || "") === recoveryRequestId);
    const latest = related[0];
    if (!latest) {
      continue;
    }
    const type = String(latest.type || "");
    if (![
      "RECOVERY_EXECUTION_COMMITTED",
      "RECOVERY_EXECUTION_BLOCKED",
      "RECOVERY_EXECUTION_FAILED",
    ].includes(type)) {
      continue;
    }
    results.push({
      recoveryRequestId,
      executionId: String(latest?.payload?.executionId || ""),
      outcomeType:
        type === "RECOVERY_EXECUTION_COMMITTED"
          ? "COMMITTED"
          : type === "RECOVERY_EXECUTION_BLOCKED"
            ? "BLOCKED"
            : "FAILED",
      result: latest?.payload?.result || null,
    });
  }
  return results;
}

function runRecoveryVerification({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  void db;
  const results = listCompletedExecutionResults(limit);
  let verified = 0;
  let noMutationConfirmed = 0;
  let manualReviewRequired = 0;
  const decisions = [];

  for (const executionResult of results) {
    const recoveryRequest = recoveryAuditStore.getRecoveryRequest(executionResult.recoveryRequestId);
    if (!recoveryRequest) {
      return failure("Recovery request history is missing for verification.");
    }

    const policy = evaluateRecoveryVerificationPolicy({
      executionResult,
      recoveryRequest,
      modes,
    });

    if (!dryRun) {
      verificationStore.recordVerificationStarted({
        recoveryRequestId: executionResult.recoveryRequestId,
        executionId: executionResult.executionId,
        requestedBy,
      });
      verificationStore.recordVerificationPolicyEvaluated({
        recoveryRequestId: executionResult.recoveryRequestId,
        executionId: executionResult.executionId,
        policy,
        requestedBy,
      });
    }

    const beforeState = executionStateStore.loadExecutionState(executionResult.executionId);
    const afterState = executionStateStore.loadExecutionState(executionResult.executionId);
    const ledgerResult = integrityStore.listLedgerEvents(
      String(recoveryRequest.plan?.planId || recoveryRequest.plan?.id || ""),
      executionResult.executionId,
    );
    if (!ledgerResult.ok) {
      return failure(ledgerResult.message || "Recovery verification ledger read failed.");
    }

    if (!policy.allowed) {
      if (policy.action === "manual_review_required") {
        manualReviewRequired += 1;
      }
      const verification = {
        verified: false,
        outcome: policy.action === "manual_review_required" ? "FAILED" : "UNKNOWN",
        confidence: 0,
        evidence: [policy.reason],
        reason: policy.reason,
      };
      if (!dryRun) {
        verificationStore.recordVerificationResult({
          recoveryRequestId: executionResult.recoveryRequestId,
          executionId: executionResult.executionId,
          verification,
          requestedBy,
        });
      }
      decisions.push({
        recoveryRequestId: executionResult.recoveryRequestId,
        policy,
        verification,
        explanation: explainRecoveryVerification({
          recoveryRequest,
          executionResult,
          verification,
        }),
      });
      continue;
    }

    const verification = verifyRecoveryOutcome({
      recoveryRequest,
      executionResult,
      beforeState,
      afterState,
      ledgerEvents: ledgerResult.data,
    });

    if (verification.outcome === "VERIFIED") {
      verified += 1;
    } else if (verification.outcome === "NO_MUTATION_CONFIRMED") {
      noMutationConfirmed += 1;
    } else if (["FAILED", "PARTIAL", "UNKNOWN"].includes(verification.outcome)) {
      manualReviewRequired += 1;
    }

    if (!dryRun) {
      verificationStore.recordVerificationResult({
        recoveryRequestId: executionResult.recoveryRequestId,
        executionId: executionResult.executionId,
        verification,
        requestedBy,
      });
    }

    decisions.push({
      recoveryRequestId: executionResult.recoveryRequestId,
      policy,
      verification,
      explanation: explainRecoveryVerification({
        recoveryRequest,
        executionResult,
        verification,
      }),
    });
  }

  return success({
    evaluated: results.length,
    verified,
    noMutationConfirmed,
    manualReviewRequired,
    decisions,
  });
}

module.exports = {
  runRecoveryVerification,
};
