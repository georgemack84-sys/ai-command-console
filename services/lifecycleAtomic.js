const { readDatabaseNow } = require("./stateDatabase");
const { withTransaction } = require("./transaction");
const executionStateStore = require("./executionStateStore");
const executionIntegrityStore = require("./executionIntegrityStore");

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "execution_abandoned", "corrupted"]);
const FINAL_STATUSES = new Set(["completed", "failed"]);

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

function normalizeFailedTerminalStatus(status, fallback) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["completed", "failed", "cancelled", "deferred", "pending"].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function buildTerminalRun(snapshot, finalStatus, nowIso) {
  const execution = snapshot.execution || {};
  return {
    runId: execution.id,
    id: execution.id,
    planId: execution.planId || null,
    triggerSource: execution.triggerSource || "system",
    globalState: "idle",
    requiresReview: false,
    createdAt: execution.createdAt || nowIso,
    startedAt: execution.startedAt || nowIso,
    finishedAt: nowIso,
    cancelledAt: finalStatus === "cancelled" ? nowIso : execution.cancelledAt || null,
    leaseOwner: execution.leaseOwner ?? null,
    leaseExpiresAt: execution.leaseExpiresAt ?? null,
    totalAttempts: Math.max(0, Number(execution.totalAttempts || 0)),
    consecutiveFailures: Math.max(0, Number(execution.consecutiveFailures || 0)),
    noProgressAttempts: Math.max(0, Number(execution.noProgressAttempts || 0)),
    lastProgressAt: execution.lastProgressAt || null,
    updatedAt: nowIso,
    stages: Array.isArray(snapshot.stages)
      ? snapshot.stages.map((stage) => ({
          ...stage,
          status: finalStatus === "completed"
            ? "completed"
            : normalizeFailedTerminalStatus(stage.status, "failed"),
          finishedAt: finalStatus === "completed"
            ? stage.finishedAt || nowIso
            : ["completed", "failed", "cancelled"].includes(
                String(
                  finalStatus === "completed"
                    ? "completed"
                    : normalizeFailedTerminalStatus(stage.status, "failed")
                ).trim().toLowerCase()
              )
              ? stage.finishedAt || nowIso
              : null,
          updatedAt: nowIso,
        }))
      : [],
    steps: Array.isArray(snapshot.steps)
      ? snapshot.steps.map((step) => ({
          ...step,
          status: finalStatus === "completed"
            ? (["completed", "deferred"].includes(String(step.status || "").trim().toLowerCase())
                ? String(step.status || "").trim().toLowerCase()
                : "completed")
            : normalizeFailedTerminalStatus(step.status, "failed"),
          finishedAt: finalStatus === "completed"
            ? ["deferred"].includes(String(step.status || "").trim().toLowerCase())
              ? step.finishedAt || null
              : step.finishedAt || nowIso
            : ["completed", "failed", "cancelled"].includes(
                String(normalizeFailedTerminalStatus(step.status, "failed")).trim().toLowerCase()
              )
              ? step.finishedAt || nowIso
              : null,
          updatedAt: nowIso,
        }))
      : [],
  };
}

function mergeExecutionMetrics(runSnapshot, execution, nowIso) {
  return {
    ...runSnapshot,
    createdAt: runSnapshot.createdAt || execution.createdAt || nowIso,
    startedAt: runSnapshot.startedAt || execution.startedAt || nowIso,
    finishedAt: runSnapshot.finishedAt || execution.finishedAt || nowIso,
    cancelledAt: runSnapshot.cancelledAt ?? execution.cancelledAt ?? null,
    leaseOwner: execution.leaseOwner ?? runSnapshot.leaseOwner ?? null,
    leaseExpiresAt: execution.leaseExpiresAt ?? runSnapshot.leaseExpiresAt ?? null,
    totalAttempts: Math.max(0, Number(execution.totalAttempts ?? runSnapshot.totalAttempts ?? 0)),
    consecutiveFailures: Math.max(0, Number(execution.consecutiveFailures ?? runSnapshot.consecutiveFailures ?? 0)),
    noProgressAttempts: Math.max(0, Number(execution.noProgressAttempts ?? runSnapshot.noProgressAttempts ?? 0)),
    lastProgressAt: execution.lastProgressAt ?? runSnapshot.lastProgressAt ?? null,
    updatedAt: nowIso,
  };
}

function finalizeExecution({ executionId, finalStatus, ownerId, error = null, runSnapshot = null }) {
  if (!String(executionId || "").trim()) {
    return failure("EXECUTION_NOT_FOUND", "executionId is required.");
  }

  const normalizedStatus = String(finalStatus || "").trim().toLowerCase();
  if (!FINAL_STATUSES.has(normalizedStatus)) {
    return failure("INVALID_STATE", `Unsupported final status "${finalStatus}".`);
  }

  try {
    const result = withTransaction((tx) => {
      const snapshot = executionStateStore.loadExecutionState(String(executionId), tx);
      if (!snapshot?.execution) {
        throw new Error("EXECUTION_NOT_FOUND");
      }

      const persistedStatus = String(snapshot.execution.status || "").trim().toLowerCase();
      if (TERMINAL_STATUSES.has(persistedStatus) && persistedStatus !== normalizedStatus) {
        throw new Error("ALREADY_TERMINAL");
      }

      const planId = snapshot.execution.planId;
      if (!String(planId || "").trim()) {
        throw new Error("PLAN_ID_REQUIRED");
      }

      const nowIso = readDatabaseNow(tx).nowIso;

      const checkpointResult = executionStateStore.setExecutionCheckpointStatus(
        planId,
        normalizedStatus,
        {},
        tx
      );
      if (!checkpointResult.ok) {
        throw new Error(checkpointResult.code || "CHECKPOINT_WRITE_FAILED");
      }

      const terminalRun = runSnapshot && (runSnapshot.runId || runSnapshot.id)
        ? mergeExecutionMetrics({
            ...runSnapshot,
            runId: runSnapshot.runId || runSnapshot.id || executionId,
            id: runSnapshot.id || runSnapshot.runId || executionId,
            planId: runSnapshot.planId || planId,
          }, snapshot.execution || {}, nowIso)
        : buildTerminalRun(snapshot, normalizedStatus, nowIso);

      executionStateStore.persistExecutionSnapshot(
        terminalRun,
        {
          auditEvents: [
            {
              executionId: String(executionId),
              stepId: null,
              eventType: normalizedStatus === "completed" ? "execution.completed" : "execution.failed",
              payload: {
                finalStatus: normalizedStatus,
                error: error ? String(error.message || error) : null,
              },
            },
          ],
        },
        tx
      );

      const ledgerResult = executionIntegrityStore.appendLedgerEvent(
        {
          planId,
          executionId: String(executionId),
          eventType: normalizedStatus === "completed" ? "execution.completed" : "execution.failed",
          payload: {
            finalStatus: normalizedStatus,
            ownerId: ownerId == null ? null : String(ownerId),
            error: error ? String(error.message || error) : null,
          },
        },
        tx
      );
      if (!ledgerResult.ok) {
        throw new Error(ledgerResult.code || "LEDGER_WRITE_FAILED");
      }

      const releaseResult = executionIntegrityStore.releaseExecutionLock(
        planId,
        String(executionId),
        tx
      );
      if (!releaseResult.ok) {
        throw new Error(releaseResult.code || "LOCK_RELEASE_FAILED");
      }

      return {
        executionId: String(executionId),
        planId: String(planId),
        finalStatus: normalizedStatus,
        checkpoint: checkpointResult.data,
        lockReleasedAt: releaseResult.data?.lockReleasedAt ?? null,
      };
    });

    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(message, message);
  }
}

function pauseExecutionForReview({
  planId,
  executionId,
  runSnapshot,
  reviewRecord = null,
  pauseStatus = "paused",
  reason = "manual_review_required",
  stepId = null,
}) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("INVALID_STATE", "executionId is required.");
  }
  if (!runSnapshot || !(runSnapshot.runId || runSnapshot.id)) {
    return failure("INVALID_STATE", "runSnapshot is required.");
  }

  try {
    const result = withTransaction((tx) => {
      const checkpointResult = executionStateStore.setExecutionCheckpointStatus(
        String(planId),
        "awaiting_review",
        {},
        tx,
      );
      if (!checkpointResult.ok) {
        throw new Error(checkpointResult.code || "CHECKPOINT_WRITE_FAILED");
      }

      executionStateStore.persistExecutionSnapshot(
        mergeExecutionMetrics({
          ...runSnapshot,
          runId: runSnapshot.runId || runSnapshot.id || executionId,
          id: runSnapshot.id || runSnapshot.runId || executionId,
          planId: runSnapshot.planId || planId,
        }, executionStateStore.loadExecutionState(String(executionId), tx)?.execution || {}, readDatabaseNow(tx).nowIso),
        {
          reviewRecord,
          auditEvents: [
            {
              executionId: String(executionId),
              stepId: stepId == null ? null : String(stepId),
              eventType: "execution.paused",
              payload: {
                status: String(pauseStatus),
                reason: String(reason),
              },
            },
            {
              executionId: String(executionId),
              stepId: stepId == null ? null : String(stepId),
              eventType: "review.requested",
              payload: {
                status: "pending",
                reason: String(reason),
              },
            },
          ],
        },
        tx,
      );

      const pausedLedger = executionIntegrityStore.appendLedgerEvent(
        {
          planId: String(planId),
          executionId: String(executionId),
          stepId: stepId == null ? null : String(stepId),
          eventType: "execution.paused",
          payload: {
            status: String(pauseStatus),
            reason: String(reason),
          },
        },
        tx,
      );
      if (!pausedLedger.ok) {
        throw new Error(pausedLedger.code || "LEDGER_WRITE_FAILED");
      }

      const reviewLedger = executionIntegrityStore.appendLedgerEvent(
        {
          planId: String(planId),
          executionId: String(executionId),
          stepId: stepId == null ? null : String(stepId),
          eventType: "review.requested",
          payload: {
            status: "pending",
            reason: String(reason),
          },
        },
        tx,
      );
      if (!reviewLedger.ok) {
        throw new Error(reviewLedger.code || "LEDGER_WRITE_FAILED");
      }

      const releaseResult = executionIntegrityStore.releaseExecutionLock(
        String(planId),
        String(executionId),
        tx
      );
      if (!releaseResult.ok && !["NOT_FOUND", "LOCK_CONFLICT"].includes(String(releaseResult.code || ""))) {
        throw new Error(releaseResult.code || "LOCK_RELEASE_FAILED");
      }

      return {
        executionId: String(executionId),
        planId: String(planId),
        pauseStatus: String(pauseStatus),
        reason: String(reason),
        checkpoint: checkpointResult.data,
        lockReleasedAt: releaseResult.ok ? (releaseResult.data?.lockReleasedAt ?? null) : null,
      };
    });

    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(message, message);
  }
}

module.exports = {
  finalizeExecution,
  pauseExecutionForReview,
};
