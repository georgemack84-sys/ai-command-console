"use strict";

const { withTransaction } = require("./transaction");
const { preflightRecovery } = require("./executionEngine");
const { loadExecutionCheckpoint, loadExecutionState, persistExecutionSnapshot, setExecutionCheckpointStatus, applyOperatorRecoveryAction } = require("./executionStateStore");
const { acquireOrReuseExecutionLock, appendLedgerEvent, appendLedgerEventTx, listExecutionLocks, listLedgerEvents, releaseExecutionLockTx } = require("./executionIntegrityStore");
const { buildRecoveryPlan } = require("./recoveryPlanBuilder");
const { previewRecoveryPlan } = require("./recoveryPreview");
const { createRecoveryPlanHash } = require("./recoveryPlanHash");

function failure(code, message, details = {}) {
  return {
    ok: false,
    code: String(code || "INVALID_RECOVERY_COMMIT"),
    message: String(message || "Recovery commit failed."),
    ...details,
  };
}

function success(data) {
  return {
    ok: true,
    data,
  };
}

function createTransactionalFailure(code, message) {
  const error = new Error(String(message || "Transactional recovery commit failed."));
  error.recoveryCode = String(code || "RECOVERY_COMMIT_FAILED");
  return error;
}

function normalizeRunFromSnapshot(snapshot = {}, overrides = {}) {
  return {
    runId: snapshot?.execution?.id,
    planId: snapshot?.execution?.planId,
    globalState: overrides.globalState || snapshot?.execution?.status || "running",
    reviewStatus: overrides.reviewStatus || (snapshot?.execution?.requiresReview ? "pending" : "approved"),
    triggerSource: snapshot?.execution?.triggerSource || "api",
    createdAt: snapshot?.execution?.createdAt || null,
    startedAt: snapshot?.execution?.startedAt || null,
    finishedAt: overrides.finishedAt === undefined ? snapshot?.execution?.finishedAt || null : overrides.finishedAt,
    cancelledAt: overrides.cancelledAt === undefined ? snapshot?.execution?.cancelledAt || null : overrides.cancelledAt,
    leaseOwner: overrides.leaseOwner === undefined ? snapshot?.execution?.leaseOwner || null : overrides.leaseOwner,
    leaseExpiresAt: overrides.leaseExpiresAt === undefined ? snapshot?.execution?.leaseExpiresAt ?? null : overrides.leaseExpiresAt,
    totalAttempts: Number(snapshot?.execution?.totalAttempts || 0),
    consecutiveFailures: Number(snapshot?.execution?.consecutiveFailures || 0),
    noProgressAttempts: Number(snapshot?.execution?.noProgressAttempts || 0),
    lastProgressAt: snapshot?.execution?.lastProgressAt || null,
    stages: Array.isArray(snapshot?.stages) ? snapshot.stages : [],
    steps: Array.isArray(snapshot?.steps) ? snapshot.steps : [],
  };
}

function staleTokenEquals(left, right) {
  return JSON.stringify(left || null) === JSON.stringify(right || null);
}

function buildCurrentPlan(plan, checkpoint, snapshot, activeLock, ledgerEvents) {
  const latestLedgerEvent = Array.isArray(ledgerEvents) && ledgerEvents.length
    ? ledgerEvents[ledgerEvents.length - 1]
    : null;
  return {
    ...plan,
    checkpoint,
    source: {
      ...(plan.source || {}),
      snapshot,
      ledgerEvents,
      activeLock,
      lastLedgerEventId: latestLedgerEvent == null ? null : Number(latestLedgerEvent.id || 0),
    },
  };
}

/**
 * @param {{ plan: object, db?: object, requestedBy?: string, dryRun?: boolean }} input
 * @returns {Promise<{ ok: false, code: string, message: string } | { ok: true, data: object }>}
 */
async function commitRecoveryPlan(input) {
  if (!input || typeof input !== "object") {
    return failure("INVALID_RECOVERY_COMMIT_INPUT", "Recovery commit input is required.");
  }

  if (!input.plan || typeof input.plan !== "object") {
    return failure("INVALID_RECOVERY_PLAN", "Recovery plan object is required for commit.");
  }

  const plan = input.plan;
  if (input.dryRun) {
    const preview = previewRecoveryPlan({ plan });
    if (!preview.ok) {
      return failure(preview.code, preview.message, {
        committed: false,
        dryRun: true,
      });
    }
    return success({
      committed: false,
      dryRun: true,
      preview: preview.data,
    });
  }

  if (!plan.staleToken || typeof plan.staleToken !== "object") {
    return failure("MISSING_STALE_TOKEN", "Recovery commit requires a stale token from preview.", {
      committed: false,
      dryRun: false,
    });
  }

  const executionId = String(plan.executionId || "").trim();
  const planId = String(plan.planId || "").trim();
  const recoveryMode = String(plan.recoveryMode || "").trim();
  if (!executionId || !planId || !recoveryMode) {
    return failure("INVALID_RECOVERY_PLAN", "Recovery commit requires executionId, planId, and recoveryMode.", {
      committed: false,
      dryRun: false,
    });
  }

  const snapshot = loadExecutionState(executionId);
  if (!snapshot?.execution?.id) {
    return failure("EXECUTION_NOT_FOUND", `Execution ${executionId} was not found for recovery commit.`, {
      committed: false,
      dryRun: false,
    });
  }
  const checkpointResult = loadExecutionCheckpoint(planId);
  if (!checkpointResult.ok || !checkpointResult.data) {
    return failure(checkpointResult.code || "EXECUTION_NOT_FOUND", checkpointResult.message || `Checkpoint ${planId} was not found.`, {
      committed: false,
      dryRun: false,
    });
  }
  const locks = listExecutionLocks(planId);
  if (!locks.ok) {
    return failure(locks.code || "DB_READ_FAILED", locks.message || "Execution locks could not be loaded.", {
      committed: false,
      dryRun: false,
    });
  }
  const ledger = listLedgerEvents(planId, executionId);
  if (!ledger.ok) {
    return failure(ledger.code || "DB_READ_FAILED", ledger.message || "Execution ledger could not be loaded.", {
      committed: false,
      dryRun: false,
    });
  }

  const activeLock = (locks.data || []).find((entry) => entry.lockReleasedAt == null) || null;
  const currentPlan = buildCurrentPlan(plan, checkpointResult.data, snapshot, activeLock, ledger.data || []);
  const currentHash = createRecoveryPlanHash(currentPlan);
  if (!currentHash.ok) {
    return failure(currentHash.code, currentHash.message, {
      committed: false,
      dryRun: false,
    });
  }

  if (!staleTokenEquals(plan.staleToken, currentHash.data)) {
    appendLedgerEvent({
      planId,
      executionId,
      eventType: "recovery.commit.stale",
      payload: {
        requestedBy: String(input.requestedBy || "operator"),
        recoveryMode,
      },
    });
    return failure("STALE_RECOVERY_PLAN", "Recovery plan is stale and cannot be committed.", {
      committed: false,
      dryRun: false,
      staleToken: currentHash.data,
    });
  }

  const preflight = await preflightRecovery(plan.recoveredPlan || { id: planId }, {});
  if (!preflight.ok || !preflight.data?.eligible) {
    appendLedgerEvent({
      planId,
      executionId,
      eventType: preflight?.data?.code === "MANUAL_REVIEW_REQUIRED"
        ? "recovery.operator.required"
        : "recovery.commit.blocked",
      payload: {
        requestedBy: String(input.requestedBy || "operator"),
        recoveryMode,
        code: preflight?.data?.code || preflight?.code || "RECOVERY_PREFLIGHT_FAILED",
      },
    });
    return failure(
      preflight?.data?.code || preflight?.code || "RECOVERY_PREFLIGHT_FAILED",
      preflight?.data?.message || preflight?.error || "Recovery preflight blocked commit.",
      {
        committed: false,
        dryRun: false,
      },
    );
  }

  const preview = previewRecoveryPlan({ plan: currentPlan });
  if (!preview.ok) {
    return failure(preview.code, preview.message, {
      committed: false,
      dryRun: false,
    });
  }

  if (preview.data.blocked && !["operator_recovery", "abandon", "mark_corrupted"].includes(recoveryMode)) {
    appendLedgerEvent({
      planId,
      executionId,
      eventType: "recovery.commit.blocked",
      payload: {
        requestedBy: String(input.requestedBy || "operator"),
        recoveryMode,
        blocked: true,
      },
    });
    return failure("RECOVERY_COMMIT_BLOCKED", "Recovery preview indicates replay is blocked.", {
      committed: false,
      dryRun: false,
      preview: preview.data,
    });
  }

  try {
    const committed = withTransaction((tx) => {
      appendLedgerEventTx(tx, {
        planId,
        executionId,
        eventType: "recovery.commit.started",
        payload: {
          requestedBy: String(input.requestedBy || "operator"),
          recoveryMode,
        },
      });

      if (recoveryMode === "resume") {
        const lockResult = acquireOrReuseExecutionLock(planId, executionId, tx);
        if (!lockResult.ok) {
          throw createTransactionalFailure(lockResult.code, lockResult.message);
        }

        const checkpointResultInner = setExecutionCheckpointStatus(planId, "running", {}, tx);
        if (!checkpointResultInner.ok) {
          throw createTransactionalFailure(checkpointResultInner.code, checkpointResultInner.message);
        }

        const run = normalizeRunFromSnapshot(snapshot, {
          globalState: "running",
          reviewStatus: "approved",
          leaseOwner: lockResult.data?.workerId || snapshot.execution.leaseOwner || null,
          leaseExpiresAt: lockResult.data?.leaseExpiresAt ?? snapshot.execution.leaseExpiresAt ?? null,
          finishedAt: null,
          cancelledAt: null,
        });
        persistExecutionSnapshot(run, {}, tx);

        appendLedgerEventTx(tx, {
          planId,
          executionId,
          eventType: "recovery.resume.applied",
          payload: {
            requestedBy: String(input.requestedBy || "operator"),
          },
        });

        return {
          committed: true,
          recoveryMode,
          executionId,
          planId,
        };
      }

      if (recoveryMode === "retry_safe_steps") {
        const nextStepId = plan?.nextStep?.id ? String(plan.nextStep.id) : null;
        const transition = applyOperatorRecoveryAction(planId, executionId, {
          action: "retry_step",
          operatorId: String(input.requestedBy || "operator"),
          reason: "Committed safe recovery replay.",
          stepId: nextStepId,
        });
        if (!transition.ok) {
          throw createTransactionalFailure(transition.code, transition.message);
        }

        appendLedgerEventTx(tx, {
          planId,
          executionId,
          stepId: nextStepId,
          eventType: "recovery.retry_safe_steps.applied",
          payload: {
            requestedBy: String(input.requestedBy || "operator"),
          },
        });

        return {
          committed: true,
          recoveryMode,
          executionId,
          planId,
          stepId: nextStepId,
        };
      }

      if (recoveryMode === "operator_recovery") {
        const checkpointResultInner = setExecutionCheckpointStatus(planId, "pause_for_operator_recovery", {}, tx);
        if (!checkpointResultInner.ok) {
          throw createTransactionalFailure(checkpointResultInner.code, checkpointResultInner.message);
        }
        const lockResult = releaseExecutionLockTx(tx, planId, executionId);
        if (!lockResult.ok && !["NOT_FOUND", "LOCK_CONFLICT"].includes(String(lockResult.code || ""))) {
          throw createTransactionalFailure(lockResult.code, lockResult.message);
        }
        appendLedgerEventTx(tx, {
          planId,
          executionId,
          eventType: "recovery.operator.required",
          payload: {
            requestedBy: String(input.requestedBy || "operator"),
          },
        });
        return { committed: true, recoveryMode, executionId, planId };
      }

      if (recoveryMode === "abandon") {
        const checkpointResultInner = setExecutionCheckpointStatus(planId, "execution_abandoned", {}, tx);
        if (!checkpointResultInner.ok) {
          throw createTransactionalFailure(checkpointResultInner.code, checkpointResultInner.message);
        }
        const lockResult = releaseExecutionLockTx(tx, planId, executionId);
        if (!lockResult.ok && !["NOT_FOUND", "LOCK_CONFLICT"].includes(String(lockResult.code || ""))) {
          throw createTransactionalFailure(lockResult.code, lockResult.message);
        }
        appendLedgerEventTx(tx, {
          planId,
          executionId,
          eventType: "recovery.execution_abandoned",
          payload: {
            requestedBy: String(input.requestedBy || "operator"),
          },
        });
        return { committed: true, recoveryMode, executionId, planId };
      }

      if (recoveryMode === "mark_corrupted") {
        const checkpointResultInner = setExecutionCheckpointStatus(planId, "corrupted", {}, tx);
        if (!checkpointResultInner.ok) {
          throw createTransactionalFailure(checkpointResultInner.code, checkpointResultInner.message);
        }
        const lockResult = releaseExecutionLockTx(tx, planId, executionId);
        if (!lockResult.ok && !["NOT_FOUND", "LOCK_CONFLICT"].includes(String(lockResult.code || ""))) {
          throw createTransactionalFailure(lockResult.code, lockResult.message);
        }
        appendLedgerEventTx(tx, {
          planId,
          executionId,
          eventType: "recovery.corrupted",
          payload: {
            requestedBy: String(input.requestedBy || "operator"),
          },
        });
        return { committed: true, recoveryMode, executionId, planId };
      }

      throw createTransactionalFailure("RECOVERY_MODE_NOT_IMPLEMENTED", `Recovery mode ${recoveryMode} is not implemented.`);
    });

    return success(committed);
  } catch (error) {
    appendLedgerEvent({
      planId,
      executionId,
      eventType: "recovery.commit.failed",
      payload: {
        requestedBy: String(input.requestedBy || "operator"),
        recoveryMode,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return failure(error?.recoveryCode || "RECOVERY_COMMIT_FAILED", error instanceof Error ? error.message : String(error), {
      committed: false,
      dryRun: false,
    });
  }
}

module.exports = {
  commitRecoveryPlan,
};
