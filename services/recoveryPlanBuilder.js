"use strict";

const { loadExecutionState } = require("./executionStateStore");
const { listExecutionLocks, listLedgerEvents } = require("./executionIntegrityStore");
const { preflightRecovery } = require("./executionEngine");

const RECOVERY_MODES = Object.freeze({
  RESUME: "resume",
  RETRY_SAFE_STEPS: "retry_safe_steps",
  OPERATOR_RECOVERY: "operator_recovery",
  ABANDON: "abandon",
  MARK_CORRUPTED: "mark_corrupted",
});

function failure(code, message, details = {}) {
  return {
    ok: false,
    code: String(code || "INVALID_RECOVERY_PLAN"),
    message: String(message || "Recovery plan build failed."),
    ...details,
  };
}

function success(data) {
  return {
    ok: true,
    data,
  };
}

function normalizeStepMetadata(step = {}) {
  const sideEffects = Array.isArray(step.sideEffects)
    ? step.sideEffects.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean)
    : [];
  const idempotent = Boolean(
    step.isIdempotent
    || String(step.idempotencyClass || "").trim().toLowerCase() === "safe_repeat"
  );

  return {
    idempotent,
    idempotencyKey: step.idempotencyKey ? String(step.idempotencyKey) : null,
    retryStrategy: idempotent ? "safe" : "manual_only",
    sideEffectClass: String(step.idempotencyClass || "").trim().toLowerCase() === "safe_repeat"
      ? "pure_read"
      : String(step.sideEffectClass || "").trim().toLowerCase() || "unknown",
    sideEffects,
  };
}

function buildPlanFromSnapshot(snapshot) {
  if (!snapshot?.execution?.id || !snapshot?.execution?.planId) {
    return null;
  }

  const stages = Array.isArray(snapshot.stages) && snapshot.stages.length
    ? snapshot.stages.map((stage) => ({
        id: String(stage.id),
        name: stage.name || `Stage ${stage.sequence || 1}`,
        sequence: Number(stage.sequence || 0),
        status: String(stage.status || "pending"),
        steps: (snapshot.steps || [])
          .filter((step) => String(step.stageId || "") === String(stage.id))
          .map((step) => ({
            id: String(step.id),
            action: step.kind || step.action || "step",
            payload: step.originalInput ?? step.normalizedInput ?? step.originalText ?? null,
            originalInput: step.originalInput ?? null,
            normalizedInput: step.normalizedInput ?? null,
            sequence: Number(step.sequence || 0),
            stageId: String(step.stageId || stage.id),
            metadata: normalizeStepMetadata(step),
          })),
      }))
    : [
        {
          id: "stage_1",
          name: "Recovered Stage",
          sequence: 1,
          status: "pending",
          steps: (snapshot.steps || []).map((step, index) => ({
            id: String(step.id),
            action: step.kind || step.action || "step",
            payload: step.originalInput ?? step.normalizedInput ?? step.originalText ?? null,
            originalInput: step.originalInput ?? null,
            normalizedInput: step.normalizedInput ?? null,
            sequence: Number(step.sequence || index + 1),
            stageId: String(step.stageId || "stage_1"),
            metadata: normalizeStepMetadata(step),
          })),
        },
      ];

  return {
    id: String(snapshot.execution.planId),
    type: stages.length > 1 ? "multi" : "single",
    originalRequest: `Recovered execution ${snapshot.execution.planId}`,
    reviewStatus: snapshot.execution.requiresReview ? "pending" : "approved",
    currentStageExecutable: true,
    finalMode: "auto_execute",
    stages,
    steps: stages.flatMap((stage) => stage.steps || []),
  };
}

/**
 * @param {{ executionId: string, recoveryMode: string, db?: object, modes?: object }} input
 * @returns {Promise<{ ok: false, code: string, message: string } | { ok: true, data: object }>}
 */
async function buildRecoveryPlan(input) {
  if (!input || typeof input !== "object") {
    return failure("INVALID_RECOVERY_PLAN_INPUT", "Recovery plan builder input is required.");
  }

  const executionId = String(input.executionId || "").trim();
  const recoveryMode = String(input.recoveryMode || "").trim();

  if (!executionId) {
    return failure("INVALID_RECOVERY_PLAN_INPUT", "executionId is required to build a recovery plan.");
  }

  if (!Object.values(RECOVERY_MODES).includes(recoveryMode)) {
    return failure("INVALID_RECOVERY_MODE", `Unsupported recovery mode "${recoveryMode || "unknown"}".`, {
      recoveryMode,
      supportedModes: Object.values(RECOVERY_MODES),
    });
  }

  const snapshot = loadExecutionState(executionId);
  if (!snapshot?.execution?.id || !snapshot?.execution?.planId) {
    return failure("EXECUTION_NOT_FOUND", `Execution ${executionId} could not be loaded for recovery planning.`, {
      executionId,
      recoveryMode,
    });
  }

  const recoveredPlan = buildPlanFromSnapshot(snapshot);
  if (!recoveredPlan?.id) {
    return failure("INVALID_RECOVERY_PLAN", `Execution ${executionId} could not be reconstructed into a recovery plan.`, {
      executionId,
      recoveryMode,
    });
  }

  const preflight = await preflightRecovery(recoveredPlan, input.modes || {});
  if (!preflight.ok) {
    return failure(preflight.code || "RECOVERY_PREFLIGHT_FAILED", preflight.error || "Recovery preflight failed.", {
      executionId,
      recoveryMode,
      preflight,
    });
  }

  if (!preflight.data?.eligible) {
    return failure(
      preflight.data.code || preflight.data.reason || "RECOVERY_INELIGIBLE",
      preflight.data.message || "Execution is not eligible for deterministic recovery planning.",
      {
        executionId,
        recoveryMode,
        preflight: preflight.data,
      },
    );
  }

  const locks = listExecutionLocks(recoveredPlan.id);
  if (!locks.ok) {
    return failure(locks.code || "DB_READ_FAILED", locks.message || "Execution locks could not be loaded.", {
      executionId,
      recoveryMode,
    });
  }

  const ledger = listLedgerEvents(recoveredPlan.id, executionId);
  if (!ledger.ok) {
    return failure(ledger.code || "DB_READ_FAILED", ledger.message || "Execution ledger could not be loaded.", {
      executionId,
      recoveryMode,
    });
  }

  const latestLedgerEvent = Array.isArray(ledger.data) && ledger.data.length
    ? ledger.data[ledger.data.length - 1]
    : null;
  const activeLock = (locks.data || []).find((entry) => entry.lockReleasedAt == null) || null;

  return success({
    executionId,
    planId: String(recoveredPlan.id),
    recoveryMode,
    checkpoint: preflight.data.checkpoint || null,
    nextStep: preflight.data.nextStep || null,
    source: {
      snapshot,
      ledgerEvents: ledger.data || [],
      preflight: preflight.data,
      activeLock,
      lastLedgerEventId: latestLedgerEvent == null ? null : Number(latestLedgerEvent.id || 0),
    },
    recoveredPlan,
  });
}

module.exports = {
  RECOVERY_MODES,
  buildRecoveryPlan,
};
