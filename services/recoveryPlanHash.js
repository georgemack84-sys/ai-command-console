"use strict";

const { createHash } = require("crypto");

function failure(code, message, details = {}) {
  return {
    ok: false,
    code: String(code || "INVALID_RECOVERY_PLAN_HASH"),
    message: String(message || "Recovery plan hash creation failed."),
    ...details,
  };
}

function success(data) {
  return {
    ok: true,
    data,
  };
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function normalizeSteps(snapshot = null) {
  return Array.isArray(snapshot?.steps)
    ? snapshot.steps.map((step) => ({
        id: String(step.id || ""),
        status: String(step.status || ""),
        attemptNumber: Number(step.attemptNumber || 0),
        attempts: Number(step.attempts || 0),
        errorType: step.errorType == null ? null : String(step.errorType),
        reason: step.reason == null ? null : String(step.reason),
        lastOutputHash: step.lastOutputHash == null ? null : String(step.lastOutputHash),
      }))
    : [];
}

/**
 * @param {object} plan
 * @returns {{ ok: false, code: string, message: string } | { ok: true, data: object }}
 */
function createRecoveryPlanHash(plan) {
  if (!plan || typeof plan !== "object") {
    return failure("INVALID_RECOVERY_PLAN", "Recovery plan object is required to create a hash.");
  }

  const execution = plan?.source?.snapshot?.execution || null;
  const checkpoint = plan?.checkpoint || null;
  const activeLock = plan?.source?.activeLock || null;
  const steps = normalizeSteps(plan?.source?.snapshot || null);

  const checkpointHash = sha256(JSON.stringify({
    planId: checkpoint?.planId || null,
    status: checkpoint?.status || null,
    currentStep: checkpoint?.currentStep ?? null,
    lastCompletedStepIndex: checkpoint?.lastCompletedStepIndex ?? null,
    cancellationRequested: checkpoint?.cancellationRequested ?? null,
  }));

  const stepStateHash = sha256(JSON.stringify(steps));

  const containmentHash = sha256(JSON.stringify({
    totalAttempts: Number(execution?.totalAttempts || 0),
    consecutiveFailures: Number(execution?.consecutiveFailures || 0),
    noProgressAttempts: Number(execution?.noProgressAttempts || 0),
    lastProgressAt: execution?.lastProgressAt || null,
  }));

  return success({
    executionStatus: execution?.status == null ? null : String(execution.status),
    lockOwner: activeLock?.workerId == null ? null : String(activeLock.workerId),
    leaseExpiresAt: activeLock?.leaseExpiresAt == null ? null : Number(activeLock.leaseExpiresAt),
    lastLedgerEventId: plan?.source?.lastLedgerEventId == null ? null : Number(plan.source.lastLedgerEventId),
    checkpointHash,
    stepStateHash,
    containmentHash,
  });
}

module.exports = {
  createRecoveryPlanHash,
};
