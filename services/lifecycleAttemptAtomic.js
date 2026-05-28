const { readDatabaseNow } = require("./stateDatabase");
const { withTransaction } = require("./transaction");
const executionStateStore = require("./executionStateStore");
const executionIntegrityStore = require("./executionIntegrityStore");

const TERMINAL_STEP_STATUSES = new Set(["completed", "failed", "cancelled", "deferred"]);
const TERMINAL_EXECUTION_STATUSES = new Set(["completed", "failed", "cancelled", "execution_abandoned", "corrupted"]);

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

function throwTransactionalFailure(result, fallbackCode) {
  const error = new Error(result?.message || fallbackCode);
  error.code = result?.code || fallbackCode;
  throw error;
}

function buildSnapshotBase(snapshot, nowIso) {
  const execution = snapshot.execution || {};
  return {
    runId: execution.id,
    id: execution.id,
    planId: execution.planId || null,
    triggerSource: execution.triggerSource || "system",
    createdAt: execution.createdAt || nowIso,
    startedAt: execution.startedAt || nowIso,
    finishedAt: execution.finishedAt || null,
    cancelledAt: execution.cancelledAt || null,
    leaseOwner: execution.leaseOwner ?? null,
    leaseExpiresAt: execution.leaseExpiresAt ?? null,
    totalAttempts: Math.max(0, Number(execution.totalAttempts || 0)),
    consecutiveFailures: Math.max(0, Number(execution.consecutiveFailures || 0)),
    noProgressAttempts: Math.max(0, Number(execution.noProgressAttempts || 0)),
    lastProgressAt: execution.lastProgressAt || null,
    updatedAt: nowIso,
    reviewStatus: null,
  };
}

function mergeExecutionMetrics(runSnapshot, execution, nowIso) {
  return {
    ...runSnapshot,
    createdAt: runSnapshot.createdAt || execution.createdAt || nowIso,
    startedAt: runSnapshot.startedAt || execution.startedAt || nowIso,
    finishedAt: runSnapshot.finishedAt ?? execution.finishedAt ?? null,
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

function applyStageStatuses(steps, stages, nowIso, fallbackStatus) {
  const stepsByStage = new Map();
  steps.forEach((step) => {
    if (!step.stageId) {
      return;
    }
    const bucket = stepsByStage.get(step.stageId) || [];
    bucket.push(step);
    stepsByStage.set(step.stageId, bucket);
  });

  return (Array.isArray(stages) ? stages : []).map((stage) => {
    const stageSteps = stepsByStage.get(stage.id) || [];
    const currentStatus = String(stage.status || "").trim().toLowerCase();
    let status = currentStatus || fallbackStatus;
    if (stageSteps.length) {
      if (stageSteps.some((step) => step.status === "failed")) {
        status = "failed";
      } else if (stageSteps.every((step) => ["completed", "deferred"].includes(String(step.status || "").trim().toLowerCase()))) {
        status = "completed";
      } else if (stageSteps.some((step) => step.status === "running")) {
        status = "running";
      } else if (stageSteps.some((step) => step.status === "paused_for_review")) {
        status = "paused_for_review";
      } else {
        status = "pending";
      }
    }

    return {
      ...stage,
      status,
      startedAt: stage.startedAt || nowIso,
      finishedAt: status === "completed" || status === "failed" ? stage.finishedAt || nowIso : null,
      updatedAt: nowIso,
    };
  });
}

function buildRunningSnapshot(snapshot, stepId, nowIso) {
  const steps = (Array.isArray(snapshot.steps) ? snapshot.steps : []).map((step) =>
    String(step.id) === String(stepId)
      ? {
          ...step,
          status: "running",
          startedAt: step.startedAt || nowIso,
          finishedAt: null,
          updatedAt: nowIso,
        }
      : step
  );

  return {
    ...buildSnapshotBase(snapshot, nowIso),
    globalState: "running",
    stages: applyStageStatuses(steps, snapshot.stages, nowIso, "running"),
    steps,
  };
}

function buildPausedAttemptSnapshot(snapshot, stepId, reason, nowIso) {
  const steps = (Array.isArray(snapshot.steps) ? snapshot.steps : []).map((step) =>
    String(step.id) === String(stepId)
      ? {
          ...step,
          status: "paused_for_review",
          startedAt: step.startedAt || nowIso,
          finishedAt: null,
          updatedAt: nowIso,
          pauseReason: reason,
        }
      : step
  );

  return {
    ...buildSnapshotBase(snapshot, nowIso),
    globalState: "running",
    stages: applyStageStatuses(steps, snapshot.stages, nowIso, "running"),
    steps,
  };
}

function buildTerminalAttemptSnapshot(snapshot, stepId, stepStatus, nowIso) {
  const steps = (Array.isArray(snapshot.steps) ? snapshot.steps : []).map((step) =>
    String(step.id) === String(stepId)
      ? {
          ...step,
          status: stepStatus,
          startedAt: step.startedAt || nowIso,
          finishedAt: nowIso,
          updatedAt: nowIso,
          error: stepStatus === "failed" ? step.error || "attempt_failed" : null,
        }
      : step
  );

  return {
    ...buildSnapshotBase(snapshot, nowIso),
    globalState: "running",
    stages: (Array.isArray(snapshot.stages) ? snapshot.stages : []).map((stage) => ({
      ...stage,
      updatedAt: nowIso,
    })),
    steps,
  };
}

function getExecutionAndStep(snapshot, stepId) {
  if (!snapshot?.execution) {
    throw new Error("EXECUTION_NOT_FOUND");
  }

  if (TERMINAL_EXECUTION_STATUSES.has(String(snapshot.execution.status || "").trim().toLowerCase())) {
    throw new Error("EXECUTION_ALREADY_TERMINAL");
  }

  const step = (snapshot.steps || []).find((candidate) => String(candidate.id) === String(stepId));
  if (!step) {
    throw new Error("STEP_NOT_FOUND");
  }
  if (TERMINAL_STEP_STATUSES.has(String(step.status || "").trim().toLowerCase())) {
    throw new Error("STEP_ALREADY_TERMINAL");
  }

  return step;
}

function beginExecutionAttemptAtomic({ planId, executionId, stepId, stepIndex, sideEffectClass = "unknown" }) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("INVALID_STATE", "executionId is required.");
  }
  if (!String(stepId || "").trim()) {
    return failure("INVALID_STATE", "stepId is required.");
  }

  try {
    const result = withTransaction((tx) => {
      const snapshot = executionStateStore.loadExecutionState(String(executionId), tx);
      getExecutionAndStep(snapshot, stepId);

      const checkpoint = executionStateStore.checkpointBeforeStep(String(planId), Number(stepIndex), tx);
      if (!checkpoint.ok) {
        throwTransactionalFailure(checkpoint, "CHECKPOINT_WRITE_FAILED");
      }

      const attempt = executionIntegrityStore.createExecutionAttempt(
        {
          planId: String(planId),
          executionId: String(executionId),
          stepId: String(stepId),
          sideEffectClass: String(sideEffectClass),
        },
        tx
      );
      if (!attempt.ok) {
        throwTransactionalFailure(attempt, "ATTEMPT_CREATE_FAILED");
      }

      const updatedSnapshot = executionStateStore.loadExecutionState(String(executionId), tx);

      executionStateStore.persistExecutionSnapshot(
        buildRunningSnapshot(updatedSnapshot, stepId, readDatabaseNow(tx).nowIso),
        {},
        tx
      );

      return {
        checkpoint: checkpoint.data,
        attempt: attempt.data,
      };
    });

    return success(result);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code || "DB_WRITE_FAILED")
      : "DB_WRITE_FAILED";
    const message = error instanceof Error ? error.message : String(error);
    return failure(code, message);
  }
}

function completeExecutionAttemptAtomic({
  planId,
  executionId,
  stepId,
  stepIndex,
  totalSteps,
  attemptNumber,
  resultPayload = {},
}) {
  return finalizeExecutionAttemptAtomic({
    planId,
    executionId,
    stepId,
    stepIndex,
    totalSteps,
    attemptNumber,
    mode: "completed",
    payload: resultPayload,
  });
}

function failExecutionAttemptAtomic({
  planId,
  executionId,
  stepId,
  stepIndex,
  attemptNumber,
  errorPayload = {},
}) {
  return finalizeExecutionAttemptAtomic({
    planId,
    executionId,
    stepId,
    stepIndex,
    totalSteps: null,
    attemptNumber,
    mode: "failed",
    payload: errorPayload,
  });
}

function pauseExecutionAttemptForReviewAtomic({
  planId,
  executionId,
  stepId,
  stepIndex,
  attemptNumber,
  reason = "step_requested_review",
  stageId = null,
  runSnapshot = null,
  reviewRecord = null,
}) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("INVALID_STATE", "executionId is required.");
  }
  if (!String(stepId || "").trim()) {
    return failure("INVALID_STATE", "stepId is required.");
  }

  try {
    const result = withTransaction((tx) => {
      const snapshot = executionStateStore.loadExecutionState(String(executionId), tx);
      getExecutionAndStep(snapshot, stepId);
      const nowIso = readDatabaseNow(tx).nowIso;

      const attemptResult = executionIntegrityStore.cancelExecutionAttempt(
        String(planId),
        String(executionId),
        String(stepId),
        Number(attemptNumber),
        { reason: String(reason) },
        tx
      );
      if (!attemptResult.ok) {
        throwTransactionalFailure(attemptResult, "ATTEMPT_CANCEL_FAILED");
      }

      const checkpointResult = executionStateStore.markAwaitingReview(
        String(planId),
        Number(stepIndex),
        tx
      );
      if (!checkpointResult.ok) {
        throwTransactionalFailure(checkpointResult, "CHECKPOINT_WRITE_FAILED");
      }

      const pausedSnapshot = runSnapshot && (runSnapshot.runId || runSnapshot.id)
        ? mergeExecutionMetrics({
            ...runSnapshot,
            runId: runSnapshot.runId || runSnapshot.id || executionId,
            id: runSnapshot.id || runSnapshot.runId || executionId,
            planId: runSnapshot.planId || planId,
          }, snapshot.execution || {}, nowIso)
        : buildPausedAttemptSnapshot(snapshot, stepId, String(reason), nowIso);

      executionStateStore.persistExecutionSnapshot(
        pausedSnapshot,
        runSnapshot
          ? {
              reviewRecord,
              auditEvents: [
                {
                  executionId: String(executionId),
                  stepId: String(stepId),
                  eventType: "stage.paused_for_review",
                  payload: {
                    stageId: stageId == null ? null : String(stageId),
                    status: "paused_for_review",
                    reason: String(reason),
                  },
                },
                {
                  executionId: String(executionId),
                  stepId: String(stepId),
                  eventType: "review.requested",
                  payload: {
                    status: "pending",
                    reason: String(reason),
                    stageId: stageId == null ? null : String(stageId),
                  },
                },
                {
                  executionId: String(executionId),
                  stepId: String(stepId),
                  eventType: "execution.paused",
                  payload: {
                    status: "paused",
                    reason: String(reason),
                  },
                },
              ],
            }
          : {},
        tx
      );

      if (runSnapshot) {
        for (const event of [
          {
            planId: String(planId),
            executionId: String(executionId),
            stepId: String(stepId),
            eventType: "stage.paused_for_review",
            payload: {
              stageId: stageId == null ? null : String(stageId),
              status: "paused_for_review",
              reason: String(reason),
            },
          },
          {
            planId: String(planId),
            executionId: String(executionId),
            stepId: String(stepId),
            eventType: "review.requested",
            payload: {
              status: "pending",
              reason: String(reason),
              stageId: stageId == null ? null : String(stageId),
            },
          },
          {
            planId: String(planId),
            executionId: String(executionId),
            stepId: String(stepId),
            eventType: "execution.paused",
            payload: {
              status: "paused",
              reason: String(reason),
            },
          },
        ]) {
          const ledgerResult = executionIntegrityStore.appendLedgerEvent(event, tx);
          if (!ledgerResult.ok) {
            throwTransactionalFailure(ledgerResult, "LEDGER_WRITE_FAILED");
          }
        }
      }

      const releaseResult = executionIntegrityStore.releaseExecutionLock(
        String(planId),
        String(executionId),
        tx
      );
      if (!releaseResult.ok && !["NOT_FOUND", "LOCK_CONFLICT"].includes(String(releaseResult.code || ""))) {
        throwTransactionalFailure(releaseResult, "LOCK_RELEASE_FAILED");
      }

      return {
        attempt: attemptResult.data,
        checkpoint: checkpointResult.data,
        lockReleasedAt: releaseResult.ok ? (releaseResult.data?.lockReleasedAt ?? null) : null,
      };
    });

    return success(result);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code || "DB_WRITE_FAILED")
      : "DB_WRITE_FAILED";
    const message = error instanceof Error ? error.message : String(error);
    return failure(code, message);
  }
}

function pauseBeforeExecutionForReviewAtomic({
  planId,
  executionId,
  stepId,
  stageId = null,
  stepIndex,
  reason = "review_required",
  runSnapshot,
  reviewRecord = null,
}) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("INVALID_STATE", "executionId is required.");
  }
  if (!String(stepId || "").trim()) {
    return failure("INVALID_STATE", "stepId is required.");
  }
  if (!runSnapshot || !(runSnapshot.runId || runSnapshot.id)) {
    return failure("INVALID_STATE", "runSnapshot is required.");
  }

  try {
    const result = withTransaction((tx) => {
      const snapshot = executionStateStore.loadExecutionState(String(executionId), tx);
      const checkpointResult = executionStateStore.markAwaitingReview(
        String(planId),
        Number(stepIndex),
        tx
      );
      if (!checkpointResult.ok) {
        throwTransactionalFailure(checkpointResult, "CHECKPOINT_WRITE_FAILED");
      }

      executionStateStore.persistExecutionSnapshot(
        mergeExecutionMetrics(runSnapshot, snapshot.execution || {}, readDatabaseNow(tx).nowIso),
        {
          reviewRecord,
          auditEvents: [
            {
              executionId: String(executionId),
              stepId: String(stepId),
              eventType: "stage.paused_for_review",
              payload: {
                stageId: stageId == null ? null : String(stageId),
                status: "paused_for_review",
                reason: String(reason),
              },
            },
            {
              executionId: String(executionId),
              stepId: String(stepId),
              eventType: "review.requested",
              payload: {
                status: "pending",
                reason: String(reason),
                stageId: stageId == null ? null : String(stageId),
              },
            },
            {
              executionId: String(executionId),
              stepId: String(stepId),
              eventType: "execution.paused",
              payload: {
                status: "paused",
                reason: String(reason),
              },
            },
          ],
        },
        tx
      );

      for (const event of [
        {
          planId: String(planId),
          executionId: String(executionId),
          stepId: String(stepId),
          eventType: "stage.paused_for_review",
          payload: {
            stageId: stageId == null ? null : String(stageId),
            status: "paused_for_review",
            reason: String(reason),
          },
        },
        {
          planId: String(planId),
          executionId: String(executionId),
          stepId: String(stepId),
          eventType: "review.requested",
          payload: {
            status: "pending",
            reason: String(reason),
            stageId: stageId == null ? null : String(stageId),
          },
        },
        {
          planId: String(planId),
          executionId: String(executionId),
          stepId: String(stepId),
          eventType: "execution.paused",
          payload: {
            status: "paused",
            reason: String(reason),
          },
        },
      ]) {
        const ledgerResult = executionIntegrityStore.appendLedgerEvent(event, tx);
        if (!ledgerResult.ok) {
          throwTransactionalFailure(ledgerResult, "LEDGER_WRITE_FAILED");
        }
      }

      const releaseResult = executionIntegrityStore.releaseExecutionLock(
        String(planId),
        String(executionId),
        tx
      );
      if (!releaseResult.ok && !["NOT_FOUND", "LOCK_CONFLICT"].includes(String(releaseResult.code || ""))) {
        throwTransactionalFailure(releaseResult, "LOCK_RELEASE_FAILED");
      }

      return {
        checkpoint: checkpointResult.data,
        lockReleasedAt: releaseResult.ok ? (releaseResult.data?.lockReleasedAt ?? null) : null,
      };
    });

    return success(result);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code || "DB_WRITE_FAILED")
      : "DB_WRITE_FAILED";
    const message = error instanceof Error ? error.message : String(error);
    return failure(code, message);
  }
}

function finalizeExecutionAttemptAtomic({
  planId,
  executionId,
  stepId,
  stepIndex,
  totalSteps,
  attemptNumber,
  mode,
  payload,
}) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("INVALID_STATE", "executionId is required.");
  }
  if (!String(stepId || "").trim()) {
    return failure("INVALID_STATE", "stepId is required.");
  }

  try {
    const result = withTransaction((tx) => {
      const snapshot = executionStateStore.loadExecutionState(String(executionId), tx);
      getExecutionAndStep(snapshot, stepId);
      const nowIso = readDatabaseNow(tx).nowIso;

      let attemptResult;
      let checkpointResult;
      let nextSnapshot;

      if (mode === "completed") {
        attemptResult = executionIntegrityStore.completeExecutionAttempt(
          String(planId),
          String(executionId),
          String(stepId),
          Number(attemptNumber),
          payload || {},
          tx
        );
        if (!attemptResult.ok) {
          throwTransactionalFailure(attemptResult, "ATTEMPT_COMPLETE_FAILED");
        }

        checkpointResult = executionStateStore.checkpointAfterStep(
          String(planId),
          Number(stepIndex),
          Number(totalSteps),
          tx
        );
        if (!checkpointResult.ok) {
          throwTransactionalFailure(checkpointResult, "CHECKPOINT_WRITE_FAILED");
        }

        nextSnapshot = buildTerminalAttemptSnapshot(
          executionStateStore.loadExecutionState(String(executionId), tx),
          stepId,
          "completed",
          nowIso,
        );
      } else {
        attemptResult = executionIntegrityStore.failExecutionAttempt(
          String(planId),
          String(executionId),
          String(stepId),
          Number(attemptNumber),
          payload || {},
          tx
        );
        if (!attemptResult.ok) {
          throwTransactionalFailure(attemptResult, "ATTEMPT_FAIL_FAILED");
        }

        checkpointResult = executionStateStore.failExecutionCheckpoint(
          String(planId),
          Number(stepIndex),
          tx
        );
        if (!checkpointResult.ok) {
          throwTransactionalFailure(checkpointResult, "CHECKPOINT_WRITE_FAILED");
        }

        nextSnapshot = buildTerminalAttemptSnapshot(
          executionStateStore.loadExecutionState(String(executionId), tx),
          stepId,
          "failed",
          nowIso,
        );
      }

      executionStateStore.persistExecutionSnapshot(nextSnapshot, {}, tx);

      return {
        attempt: attemptResult.data,
        checkpoint: checkpointResult.data,
      };
    });

    return success(result);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code || "DB_WRITE_FAILED")
      : "DB_WRITE_FAILED";
    const message = error instanceof Error ? error.message : String(error);
    return failure(code, message);
  }
}

module.exports = {
  beginExecutionAttemptAtomic,
  completeExecutionAttemptAtomic,
  failExecutionAttemptAtomic,
  pauseBeforeExecutionForReviewAtomic,
  pauseExecutionAttemptForReviewAtomic,
};
