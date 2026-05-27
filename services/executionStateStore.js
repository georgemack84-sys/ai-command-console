const { getDatabaseNowIso, readDatabaseNow, runInTransaction, withDatabase } = require("./stateDatabase");
const { withTransaction } = require("./transaction");
const { appendLedgerEventTx, releaseExecutionLockTx } = require("./executionIntegrityStore");

const STRICT_AUDIT_EVENT_TYPES = new Set([
  "execution.created",
  "execution.started",
  "execution.completed",
  "execution.failed",
  "execution.cancelled",
  "execution.paused",
  "operator.retry_requested",
  "operator.cancel_requested",
  "stage.started",
  "stage.paused_for_review",
  "stage.resumed",
  "stage.completed",
  "stage.failed",
  "step.created",
  "step.started",
  "step.completed",
  "step.failed",
  "step.skipped",
  "step.deferred",
  "review.requested",
  "review.approved",
  "review.rejected",
  "review.modified",
]);

const TRIGGER_SOURCES = new Set(["cli", "api", "schedule", "webhook", "system"]);
const REVIEW_ACTIONS = new Set(["approve", "approve_with_edit", "defer", "block", "cancel_execution"]);
const IDEMPOTENCY_CLASSES = new Set(["safe_repeat", "unsafe_repeat", "confirmation_required", "unknown"]);
const CHECKPOINT_STATUSES = new Set([
  "pending",
  "running",
  "paused",
  "awaiting_review",
  "pause_for_operator_recovery",
  "completed",
  "cancelled",
  "failed",
  "execution_abandoned",
  "corrupted",
]);
const ALLOWED_STATUS_TRANSITIONS = {
  pending: new Set([
    "pending",
    "running",
    "completed",
    "cancelled",
    "failed",
    "cancelled",
    "paused",
    "paused_for_review",
    "awaiting_review",
    "pause_for_operator_recovery",
    "execution_abandoned",
    "corrupted",
  ]),
  running: new Set([
    "running",
    "completed",
    "cancelled",
    "failed",
    "cancelled",
    "paused",
    "paused_for_review",
    "awaiting_review",
    "pause_for_operator_recovery",
    "execution_abandoned",
    "corrupted",
  ]),
  paused: new Set([
    "paused",
    "pending",
    "running",
    "completed",
    "cancelled",
    "failed",
    "cancelled",
    "paused_for_review",
    "awaiting_review",
    "pause_for_operator_recovery",
    "execution_abandoned",
    "corrupted",
  ]),
  paused_for_review: new Set([
    "paused_for_review",
    "pending",
    "running",
    "completed",
    "cancelled",
    "failed",
    "cancelled",
    "paused",
    "awaiting_review",
    "pause_for_operator_recovery",
    "execution_abandoned",
    "corrupted",
  ]),
  awaiting_review: new Set([
    "awaiting_review",
    "paused",
    "running",
    "completed",
    "cancelled",
    "failed",
    "pause_for_operator_recovery",
    "execution_abandoned",
    "corrupted",
  ]),
  pause_for_operator_recovery: new Set([
    "pause_for_operator_recovery",
    "execution_abandoned",
    "failed",
    "corrupted",
  ]),
  completed: new Set(["completed"]),
  cancelled: new Set(["cancelled"]),
  failed: new Set(["failed"]),
  execution_abandoned: new Set(["execution_abandoned"]),
  corrupted: new Set(["corrupted"]),
};

function nowIso() {
  return getDatabaseNowIso();
}

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

function createTransactionalFailure(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isTerminalCheckpointStatus(status) {
  return new Set(["completed", "cancelled", "failed", "execution_abandoned", "corrupted"]).has(
    String(status || "").trim().toLowerCase()
  );
}

function isTerminalExecutionStatus(status) {
  return new Set(["completed", "cancelled", "failed"]).has(
    String(status || "").trim().toLowerCase()
  );
}

function isReviewCheckpointStatus(status) {
  return new Set(["awaiting_review", "pause_for_operator_recovery"]).has(
    String(status || "").trim().toLowerCase()
  );
}

function isReviewExecutionState(executionRow = null) {
  return String(executionRow?.status || "").trim().toLowerCase() === "paused_for_review"
    || Boolean(executionRow?.requiresReview);
}

function executeWrite(tx, work) {
  if (tx) {
    return work(tx);
  }
  return withTransaction((db) => work(db));
}

function parseJson(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringifyJson(value) {
  return JSON.stringify(value == null ? null : value);
}

function normalizeTriggerSource(value) {
  const normalized = String(value || "system").trim().toLowerCase();
  return TRIGGER_SOURCES.has(normalized) ? normalized : "system";
}

function normalizeReviewAction(value) {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  return REVIEW_ACTIONS.has(normalized) ? normalized : null;
}

function normalizeIdempotencyClass(value) {
  const normalized = String(value || "unknown").trim().toLowerCase();
  return IDEMPOTENCY_CLASSES.has(normalized) ? normalized : "unknown";
}

function normalizeCheckpointStatus(value) {
  const normalized = String(value || "pending").trim().toLowerCase();
  return CHECKPOINT_STATUSES.has(normalized) ? normalized : "pending";
}

function isPlanContainer(plan = {}) {
  return Array.isArray(plan.steps) || Array.isArray(plan.stages) || ["multi", "goal"].includes(String(plan.type || ""));
}

function resolvePlanId(plan = {}) {
  if (plan.planId) {
    return String(plan.planId).trim();
  }
  if (plan.runId) {
    return String(plan.runId).trim();
  }
  if (plan.id && isPlanContainer(plan)) {
    return String(plan.id).trim();
  }
  return "";
}

function resolvePlanVersion(plan = {}) {
  if (plan.planVersion == null && plan.version == null) {
    return null;
  }
  return String(plan.planVersion ?? plan.version);
}

function normalizeCheckpointStep(step = {}, index = 0) {
  const metadata = step.metadata && typeof step.metadata === "object" ? step.metadata : {};
  const idempotentFromClass = String(step.idempotencyClass || "").trim().toLowerCase() === "safe_repeat";
  const retryStrategy =
    metadata.retryStrategy === "safe" || metadata.retryStrategy === "manual_only"
      ? metadata.retryStrategy
      : metadata.idempotent === true || idempotentFromClass
        ? "safe"
        : "manual_only";

  return {
    id: String(step.id || `step_${index}`),
    action: String(step.action || step.actionClass || step.tool || "step"),
    input: step.input ?? step.payload ?? step.normalizedInput ?? step.originalInput ?? step.command ?? null,
    metadata: {
      idempotent: metadata.idempotent === true || idempotentFromClass,
      retryStrategy,
    },
  };
}

function normalizeCheckpointPlan(plan = {}) {
  const planId = resolvePlanId(plan);
  const rawSteps = Array.isArray(plan.steps)
    ? plan.steps
    : Array.isArray(plan.stages)
      ? plan.stages.flatMap((stage) => (Array.isArray(stage.steps) ? stage.steps : []))
      : [];

  return {
    id: planId,
    version: resolvePlanVersion(plan),
    steps: rawSteps.map((step, index) => normalizeCheckpointStep(step, index)),
  };
}

function mapCheckpointRow(row) {
  if (!row) {
    return null;
  }
  return {
    planId: String(row.planId),
    planVersion: row.planVersion == null ? null : String(row.planVersion),
    currentStep: Number(row.currentStep),
    status: normalizeCheckpointStatus(row.status),
    lastCompletedStepIndex: Number(row.lastCompletedStepIndex),
    cancellationRequested: Boolean(row.cancellationRequested),
    updatedAt: Number(row.updatedAt),
  };
}

function readCheckpointRow(db, planId) {
  return mapCheckpointRow(
    db.prepare(`
        SELECT
          planId,
          planVersion,
          currentStep,
          status,
          lastCompletedStepIndex,
          cancellationRequested,
          updatedAt
        FROM execution_state
        WHERE planId = ?
    `).get(String(planId))
  );
}

function writeCheckpointRow(db, row) {
    db.prepare(`
      INSERT INTO execution_state (
        planId, planVersion, currentStep, status, lastCompletedStepIndex, cancellationRequested, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(planId) DO UPDATE SET
        planVersion = excluded.planVersion,
        currentStep = excluded.currentStep,
        status = excluded.status,
        lastCompletedStepIndex = excluded.lastCompletedStepIndex,
        cancellationRequested = excluded.cancellationRequested,
        updatedAt = excluded.updatedAt
    `).run(
      row.planId,
      row.planVersion,
      row.currentStep,
      row.status,
      row.lastCompletedStepIndex,
      row.cancellationRequested ? 1 : 0,
      row.updatedAt,
    );
  }

function startExecutionState(plan = {}, tx = null) {
  const normalizedPlan = normalizeCheckpointPlan(plan);
  if (!normalizedPlan.id) {
    return failure("INVALID_STATE", "Execution plan requires an id for checkpoint persistence.");
  }

  try {
    return executeWrite(tx, (db) => {
      const existing = readCheckpointRow(db, normalizedPlan.id);
      if (existing) {
        return failure(
          "EXECUTION_ALREADY_EXISTS",
          `Execution checkpoint already exists for plan ${normalizedPlan.id}.`
        );
      }

        const row = {
          planId: normalizedPlan.id,
          planVersion: normalizedPlan.version,
          currentStep: 0,
          status: "pending",
          lastCompletedStepIndex: -1,
          cancellationRequested: false,
          updatedAt: readDatabaseNow(db).nowMs,
        };
      writeCheckpointRow(db, row);
      return success(row);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function loadExecutionCheckpoint(planId) {
  try {
    return loadExecutionCheckpointTx(planId);
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function loadExecutionCheckpointTx(planId, tx = null) {
  const reader = tx
    ? (work) => work(tx)
    : (work) => withDatabase((db) => work(db));
  try {
    return reader((db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }
      return success(checkpoint);
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function checkpointBeforeStep(planId, stepIndex, tx = null) {
  try {
    return executeWrite(tx, (db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }
        const nextRow = {
          ...checkpoint,
          currentStep: Number(stepIndex),
          status: "running",
          cancellationRequested: checkpoint.cancellationRequested,
          updatedAt: readDatabaseNow(db).nowMs,
        };
      writeCheckpointRow(db, nextRow);
      return success(nextRow);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function checkpointAfterStep(planId, stepIndex, totalSteps, tx = null) {
  try {
    return executeWrite(tx, (db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }

      const total = Number(totalSteps);
      const nextIndex = Number(stepIndex) + 1;
      const completed = nextIndex >= total;
        const nextRow = {
          ...checkpoint,
          currentStep: completed ? nextIndex : nextIndex,
          lastCompletedStepIndex: Number(stepIndex),
          status: completed ? "completed" : "running",
          cancellationRequested: checkpoint.cancellationRequested,
          updatedAt: readDatabaseNow(db).nowMs,
        };
      writeCheckpointRow(db, nextRow);
      return success(nextRow);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function failExecutionCheckpoint(planId, stepIndex, tx = null) {
  try {
    return executeWrite(tx, (db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }
        const nextRow = {
          ...checkpoint,
          currentStep: Number(stepIndex),
          status: "failed",
          cancellationRequested: checkpoint.cancellationRequested,
          updatedAt: readDatabaseNow(db).nowMs,
        };
      writeCheckpointRow(db, nextRow);
      return success(nextRow);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function markAwaitingReview(planId, stepIndex, tx = null) {
  try {
    return executeWrite(tx, (db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }
        const nextRow = {
          ...checkpoint,
          currentStep: Number(stepIndex),
          status: "awaiting_review",
          cancellationRequested: checkpoint.cancellationRequested,
          updatedAt: readDatabaseNow(db).nowMs,
        };
      writeCheckpointRow(db, nextRow);
      return success(nextRow);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function setExecutionCheckpointStatus(planId, status, overrides = {}, tx = null) {
  const normalizedStatus = normalizeCheckpointStatus(status);
  try {
    return executeWrite(tx, (db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }

      const nextRow = {
        ...checkpoint,
        ...overrides,
        planId: checkpoint.planId,
        planVersion: Object.prototype.hasOwnProperty.call(overrides, "planVersion")
          ? overrides.planVersion
          : checkpoint.planVersion,
        currentStep: Object.prototype.hasOwnProperty.call(overrides, "currentStep")
          ? Number(overrides.currentStep)
          : checkpoint.currentStep,
        lastCompletedStepIndex: Object.prototype.hasOwnProperty.call(overrides, "lastCompletedStepIndex")
          ? Number(overrides.lastCompletedStepIndex)
          : checkpoint.lastCompletedStepIndex,
        status: normalizedStatus,
        updatedAt: readDatabaseNow(db).nowMs,
      };
      writeCheckpointRow(db, nextRow);
      return success(nextRow);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function finalizeExecutionTransition(planId, executionId, options = {}, tx = null) {
  const normalizedStatus = options.status == null ? null : normalizeCheckpointStatus(options.status);
  const shouldReleaseLock = options.releaseLock !== false;
  const requireCheckpoint = options.requireCheckpoint !== false;
  try {
    return executeWrite(tx, (db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint && requireCheckpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }

      const nextCheckpoint = normalizedStatus == null || !checkpoint
        ? checkpoint
        : {
            ...checkpoint,
            ...options.overrides,
            planId: checkpoint.planId,
            planVersion: Object.prototype.hasOwnProperty.call(options.overrides || {}, "planVersion")
              ? options.overrides.planVersion
              : checkpoint.planVersion,
            currentStep: Object.prototype.hasOwnProperty.call(options.overrides || {}, "currentStep")
              ? Number(options.overrides.currentStep)
              : checkpoint.currentStep,
            lastCompletedStepIndex: Object.prototype.hasOwnProperty.call(options.overrides || {}, "lastCompletedStepIndex")
              ? Number(options.overrides.lastCompletedStepIndex)
              : checkpoint.lastCompletedStepIndex,
            status: normalizedStatus,
            updatedAt: readDatabaseNow(db).nowMs,
          };

      if (normalizedStatus != null && checkpoint) {
        writeCheckpointRow(db, nextCheckpoint);
      }

      if (options.eventType) {
        appendLedgerEventTx(db, {
          planId,
          executionId,
          stepId: options.stepId == null ? null : options.stepId,
          attemptNumber: options.attemptNumber == null ? null : options.attemptNumber,
          eventType: options.eventType,
          payload: options.payload || {},
        });
      }

      const lockResult = shouldReleaseLock
        ? releaseExecutionLockTx(db, planId, executionId)
        : success(null);
      if (!lockResult.ok) {
        throw createTransactionalFailure(lockResult.code, lockResult.message);
      }

      return success({
        checkpoint: nextCheckpoint,
        lockReleasedAt: lockResult.data?.lockReleasedAt ?? null,
      });
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error && String(error.code).startsWith("SQLITE_")
        ? "DB_WRITE_FAILED"
        : error && typeof error === "object" && "code" in error
          ? error.code
          : "DB_WRITE_FAILED";
    return failure(
      code,
      error instanceof Error ? error.message : String(error)
    );
  }
}

function requestExecutionCancellation(planId) {
  try {
    return runInTransaction((db) => {
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }

      const nextRow = {
        ...checkpoint,
        cancellationRequested: true,
        updatedAt: readDatabaseNow(db).nowMs,
      };
      writeCheckpointRow(db, nextRow);
      return success(nextRow);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function recoverExecutionState(plan = {}) {
  const normalizedPlan = normalizeCheckpointPlan(plan);
  if (!normalizedPlan.id) {
    return failure("INVALID_STATE", "Execution plan requires an id for recovery.");
  }

  try {
    return runInTransaction((db) => {
      const checkpoint = readCheckpointRow(db, normalizedPlan.id);
      if (!checkpoint) {
        return failure("NOT_FOUND", `Execution checkpoint ${normalizedPlan.id} was not found.`);
      }

      const totalSteps = normalizedPlan.steps.length;
      if (checkpoint.lastCompletedStepIndex >= totalSteps) {
        return failure(
          "CHECKPOINT_INVALID",
          `Execution checkpoint ${normalizedPlan.id} references a completed step outside the plan.`
        );
      }

      if (totalSteps === 0 || checkpoint.lastCompletedStepIndex + 1 >= totalSteps) {
        const completedRow = {
          ...checkpoint,
          status: "completed",
          currentStep: totalSteps,
          updatedAt: readDatabaseNow(db).nowMs,
        };
        writeCheckpointRow(db, completedRow);
        return success({
          checkpoint: completedRow,
          nextStepIndex: totalSteps,
          shouldExecute: false,
          completed: true,
        });
      }

      if (checkpoint.status === "completed") {
        return success({
          checkpoint,
          nextStepIndex: totalSteps,
          shouldExecute: false,
          completed: true,
        });
      }

      if (checkpoint.status === "failed") {
        return failure(
          "INVALID_STATE",
          `Execution checkpoint ${normalizedPlan.id} is failed and cannot be resumed automatically.`
        );
      }

      if (checkpoint.status === "running") {
        const interruptedStepIndex = Number(checkpoint.currentStep);
        if (interruptedStepIndex < 0 || interruptedStepIndex >= totalSteps) {
          return failure(
            "CHECKPOINT_INVALID",
            `Execution checkpoint ${normalizedPlan.id} points at an invalid running step.`
          );
        }
        const interruptedStep = normalizedPlan.steps[interruptedStepIndex];
        if (interruptedStep?.metadata?.idempotent === true) {
          return success({
            checkpoint,
            nextStepIndex: interruptedStepIndex,
            shouldExecute: true,
            interrupted: true,
          });
        }
        const reviewRow = {
          ...checkpoint,
          status: "awaiting_review",
          updatedAt: readDatabaseNow(db).nowMs,
        };
        writeCheckpointRow(db, reviewRow);
        return failure(
          "MANUAL_REVIEW_REQUIRED",
          `Execution checkpoint ${normalizedPlan.id} stopped on a non-idempotent step and requires manual review.`
        );
      }

      const nextStepIndex = checkpoint.lastCompletedStepIndex + 1;
      if (nextStepIndex < 0 || nextStepIndex >= totalSteps) {
        return failure(
          "CHECKPOINT_INVALID",
          `Execution checkpoint ${normalizedPlan.id} points at an invalid next step.`
        );
      }

      return success({
        checkpoint,
        nextStepIndex,
        shouldExecute: true,
        interrupted: false,
      });
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function inferRiskLevel(step = {}) {
  if (step.riskLevel) {
    return String(step.riskLevel);
  }
  const score = Number(step.riskScore ?? 0);
  if (score >= 75) {
    return "high";
  }
  if (score >= 35) {
    return "medium";
  }
  return "low";
}

function normalizeExecutionStatus(run = {}) {
  if (run.cancelledAt) {
    return "cancelled";
  }
  if (String(run.globalState || "") === "running") {
    return "running";
  }
  const steps = Array.isArray(run.steps) ? run.steps : [];
  if (steps.some((step) => ["failed", "timeout", "blocked"].includes(String(step.status || "")))) {
    return "failed";
  }
  if (steps.length && steps.every((step) => ["completed", "deferred"].includes(String(step.status || "")))) {
    return "completed";
  }
  if (String(run.reviewStatus || "") === "pending") {
    return "paused_for_review";
  }
  if (String(run.globalState || "") === "paused" || String(run.globalState || "") === "safe_mode") {
    return "paused";
  }
  return "pending";
}

function normalizeStageStatus(stage = {}) {
  const status = String(stage.status || "").trim().toLowerCase();
  if (status === "running") {
    return "running";
  }
  if (status === "completed") {
    return "completed";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "paused_for_review") {
    return "paused_for_review";
  }
  return "pending";
}

function normalizeStepStatus(step = {}) {
  const status = String(step.status || "").trim().toLowerCase();
  if (status === "running") {
    return "running";
  }
  if (status === "completed") {
    return "completed";
  }
  if (["failed", "timeout", "blocked"].includes(status)) {
    return "failed";
  }
  if (status === "cancelled") {
    return "cancelled";
  }
  if (status === "paused_for_review") {
    return "paused_for_review";
  }
  if (status === "awaiting_review") {
    return "paused_for_review";
  }
  if (["paused", "deferred"].includes(status)) {
    return "paused";
  }
  return "pending";
}

function normalizeExecutionRow(run = {}, options = {}) {
  const fallbackNowIso = String(options.nowIso || nowIso());
  const createdAt = String(run.createdAt || options.createdAt || fallbackNowIso);
  const lastUpdatedAt = String(run.updatedAt || options.updatedAt || createdAt);
  const status = normalizeExecutionStatus(run);
  const steps = Array.isArray(run.steps) ? run.steps : [];
  const startedAt = run.startedAt
    || steps.map((step) => step.startedAt).find(Boolean)
    || (status === "running" ? lastUpdatedAt : null);
  const finishedAt = run.finishedAt
    || (status === "completed" ? lastUpdatedAt : null)
    || null;

  return {
    id: String(run.runId || run.id || ""),
    planId: run.planId ? String(run.planId) : null,
    tenantId: options.tenantContext?.tenantId ? String(options.tenantContext.tenantId) : (run.tenantId ? String(run.tenantId) : null),
    workspaceId: options.tenantContext?.workspaceId ? String(options.tenantContext.workspaceId) : (run.workspaceId ? String(run.workspaceId) : null),
    status,
    triggerSource: normalizeTriggerSource(run.triggerSource || options.triggerSource),
    requiresReview: status === "paused_for_review" || String(run.reviewStatus || "") === "pending",
    createdAt,
    startedAt: startedAt ? String(startedAt) : null,
    finishedAt: finishedAt ? String(finishedAt) : null,
    cancelledAt: run.cancelledAt ? String(run.cancelledAt) : null,
    leaseOwner: run.leaseOwner ? String(run.leaseOwner) : null,
    leaseExpiresAt: Number.isFinite(Number(run.leaseExpiresAt)) ? Number(run.leaseExpiresAt) : null,
    totalAttempts: Math.max(0, Number(run.totalAttempts || 0)),
    consecutiveFailures: Math.max(0, Number(run.consecutiveFailures || 0)),
    noProgressAttempts: Math.max(0, Number(run.noProgressAttempts || 0)),
    lastProgressAt: run.lastProgressAt ? String(run.lastProgressAt) : null,
    lastUpdatedAt,
  };
}

function normalizeStepRow(executionId, step = {}, index = 0, options = {}) {
  const fallbackNowIso = String(options.nowIso || nowIso());
  const createdAt = String(step.createdAt || fallbackNowIso);
  const updatedAt = String(step.updatedAt || step.finishedAt || step.startedAt || createdAt);
  return {
    id: String(step.id || `step_${index + 1}`),
    executionId,
    stageId: step.stageId ? String(step.stageId) : null,
    parentStepId: step.parentStepId ? String(step.parentStepId) : null,
    sequence: Number.isFinite(Number(step.sequence)) ? Number(step.sequence) : index + 1,
    status: normalizeStepStatus(step),
    kind: step.kind ? String(step.kind) : String(step.actionClass || step.action || step.tool || "step"),
    originalText: step.originalText
      ? String(step.originalText)
      : step.description
        ? String(step.description)
        : null,
    originalInput: stringifyJson(step.originalInput ?? step.payload ?? step.command ?? null),
    normalizedInput: stringifyJson(
      step.normalizedInput ?? step.originalInput ?? step.payload ?? step.command ?? null
    ),
    resolvedCommand: step.resolvedCommand
      ? String(step.resolvedCommand)
      : step.command
        ? String(step.command)
        : step.commandPreview
          ? String(step.commandPreview)
          : null,
    dependsOnStepIds: JSON.stringify(
      Array.isArray(step.dependsOn)
        ? step.dependsOn.map((value) => String(value))
        : Array.isArray(step.depends_on_step_ids)
          ? step.depends_on_step_ids.map((value) => String(value))
          : []
    ),
    blocking: Boolean(step.blocking),
    canRunIfPriorFailed: Boolean(step.canRunIfPriorFailed),
    canRunIfPriorDeferred: Boolean(step.canRunIfPriorDeferred),
    riskLevel: inferRiskLevel(step),
    policyResult: step.policyResult ? String(step.policyResult) : step.category ? String(step.category) : null,
    pauseReason: step.pauseReason ? String(step.pauseReason) : step.error ? String(step.error) : null,
    rewriteReason: step.rewriteReason ? String(step.rewriteReason) : null,
    deferred: Boolean(step.deferred || step.status === "deferred"),
    blockReason: step.blockReason ? String(step.blockReason) : null,
    normalizationNote: step.normalizationNote ? String(step.normalizationNote) : null,
    reviewAcknowledged: Boolean(step.reviewAcknowledged),
    idempotencyClass: normalizeIdempotencyClass(step.idempotencyClass),
    attemptNumber: Math.max(0, Number(
      step.attemptNumber
      ?? step.attempt_number
      ?? (Number.isFinite(Number(step.retries)) ? Number(step.retries) + 1 : 0)
    )),
    attempts: Math.max(0, Number(
      step.attempts
      ?? step.attemptCount
      ?? step.attemptNumber
      ?? step.attempt_number
      ?? (Number.isFinite(Number(step.retries)) ? Number(step.retries) + 1 : 0)
    )),
    idempotencyKey: step.idempotencyKey ? String(step.idempotencyKey) : null,
    isIdempotent: Boolean(
      step.isIdempotent
      || step.metadata?.idempotent === true
      || normalizeIdempotencyClass(step.idempotencyClass) === "safe_repeat"
    ),
    sideEffects: Array.isArray(step.sideEffects)
      ? step.sideEffects.map((entry) => String(entry))
      : [],
    createdAt,
    startedAt: step.startedAt ? String(step.startedAt) : null,
    finishedAt: step.finishedAt ? String(step.finishedAt) : null,
    failedAt: step.failedAt ? String(step.failedAt) : null,
    lastOutputHash: step.lastOutputHash ? String(step.lastOutputHash) : null,
    errorCode: step.errorType ? String(step.errorType) : null,
    errorMessage: step.error ? String(step.error) : null,
    errorType: step.errorType ? String(step.errorType) : null,
    reason: step.reason
      ? String(step.reason)
      : step.pauseReason
        ? String(step.pauseReason)
        : step.error
          ? String(step.error)
          : null,
    lastUpdatedAt: updatedAt,
  };
}

function normalizeStageRow(executionId, stage = {}, index = 0, options = {}) {
  const fallbackNowIso = String(options.nowIso || nowIso());
  const createdAt = String(stage.createdAt || fallbackNowIso);
  const updatedAt = String(stage.updatedAt || stage.finishedAt || stage.startedAt || createdAt);
  return {
    id: String(stage.id || `stage_${index + 1}`),
    executionId,
    sequence: Number.isFinite(Number(stage.sequence)) ? Number(stage.sequence) : index + 1,
    name: stage.name ? String(stage.name) : `Stage ${index + 1}`,
    status: normalizeStageStatus(stage),
    requiresReview: Boolean(stage.requiresReview),
    pauseReason: stage.pauseReason ? String(stage.pauseReason) : null,
    createdAt,
    startedAt: stage.startedAt ? String(stage.startedAt) : null,
    finishedAt: stage.finishedAt ? String(stage.finishedAt) : null,
    lastUpdatedAt: updatedAt,
  };
}

function assertAuditEventType(eventType) {
  if (!STRICT_AUDIT_EVENT_TYPES.has(String(eventType || ""))) {
    throw new Error(`GAP DETECTED: unsupported audit event type "${eventType}"`);
  }
}

function isValidStatusTransition(currentStatus, nextStatus) {
  const current = String(currentStatus || "").trim();
  const next = String(nextStatus || "").trim();
  if (!current) {
    return true;
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed) {
    return current === next;
  }
  return allowed.has(next);
}

function normalizeAuditEvent(event = {}, options = {}) {
  const fallbackNowIso = String(options.nowIso || nowIso());
  assertAuditEventType(event.eventType);
  return {
    id: String(event.id || `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    executionId: event.executionId ? String(event.executionId) : null,
    tenantId: options.tenantContext?.tenantId ? String(options.tenantContext.tenantId) : (event.tenantId ? String(event.tenantId) : null),
    workspaceId: options.tenantContext?.workspaceId ? String(options.tenantContext.workspaceId) : (event.workspaceId ? String(event.workspaceId) : null),
    stepId: event.stepId ? String(event.stepId) : null,
    eventType: String(event.eventType),
    eventPayload: JSON.stringify(event.payload || {}),
    createdAt: String(event.createdAt || fallbackNowIso),
  };
}

function upsertExecutionRow(db, executionRow) {
  db.prepare(`
    INSERT INTO executions (
      id, tenant_id, workspace_id, plan_id, status, trigger_source, requires_review,
      created_at, started_at, finished_at, cancelled_at, lease_owner, lease_expires_at,
      total_attempts, consecutive_failures, no_progress_attempts, last_progress_at, last_updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      tenant_id = COALESCE(excluded.tenant_id, executions.tenant_id),
      workspace_id = COALESCE(excluded.workspace_id, executions.workspace_id),
      plan_id = excluded.plan_id,
      status = excluded.status,
      trigger_source = excluded.trigger_source,
      requires_review = excluded.requires_review,
      started_at = COALESCE(excluded.started_at, executions.started_at),
      finished_at = excluded.finished_at,
      cancelled_at = excluded.cancelled_at,
      lease_owner = excluded.lease_owner,
      lease_expires_at = excluded.lease_expires_at,
      total_attempts = excluded.total_attempts,
      consecutive_failures = excluded.consecutive_failures,
      no_progress_attempts = excluded.no_progress_attempts,
      last_progress_at = COALESCE(excluded.last_progress_at, executions.last_progress_at),
      last_updated_at = excluded.last_updated_at
  `).run(
    executionRow.id,
    executionRow.tenantId,
    executionRow.workspaceId,
    executionRow.planId,
    executionRow.status,
    executionRow.triggerSource,
    executionRow.requiresReview ? 1 : 0,
    executionRow.createdAt,
    executionRow.startedAt,
    executionRow.finishedAt,
    executionRow.cancelledAt,
    executionRow.leaseOwner,
    executionRow.leaseExpiresAt,
    executionRow.totalAttempts,
    executionRow.consecutiveFailures,
    executionRow.noProgressAttempts,
    executionRow.lastProgressAt,
    executionRow.lastUpdatedAt,
  );
}

function upsertStepRow(db, stepRow) {
  db.prepare(`
    INSERT INTO execution_steps (
      id, execution_id, stage_id, parent_step_id, sequence, status, kind, original_text, original_input,
      normalized_input, resolved_command, depends_on_step_ids, blocking, can_run_if_prior_failed, can_run_if_prior_deferred,
      risk_level, policy_result, pause_reason, rewrite_reason, deferred, block_reason, normalization_note, review_acknowledged, idempotency_class,
      attempt_number, attempts, idempotency_key, is_idempotent, side_effects, created_at, started_at, finished_at, failed_at, last_output_hash, error_code, error_message, error_type, reason
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(execution_id, id) DO UPDATE SET
      stage_id = excluded.stage_id,
      parent_step_id = excluded.parent_step_id,
      sequence = excluded.sequence,
      status = excluded.status,
      kind = excluded.kind,
      original_text = COALESCE(execution_steps.original_text, excluded.original_text),
      original_input = COALESCE(execution_steps.original_input, excluded.original_input),
      normalized_input = excluded.normalized_input,
      resolved_command = excluded.resolved_command,
      depends_on_step_ids = excluded.depends_on_step_ids,
      blocking = excluded.blocking,
      can_run_if_prior_failed = excluded.can_run_if_prior_failed,
      can_run_if_prior_deferred = excluded.can_run_if_prior_deferred,
      risk_level = excluded.risk_level,
      policy_result = excluded.policy_result,
      pause_reason = excluded.pause_reason,
      rewrite_reason = excluded.rewrite_reason,
      deferred = excluded.deferred,
      block_reason = excluded.block_reason,
      normalization_note = excluded.normalization_note,
      review_acknowledged = excluded.review_acknowledged,
      idempotency_class = excluded.idempotency_class,
      attempt_number = excluded.attempt_number,
      attempts = excluded.attempts,
      idempotency_key = COALESCE(execution_steps.idempotency_key, excluded.idempotency_key),
      is_idempotent = excluded.is_idempotent,
      side_effects = excluded.side_effects,
      started_at = COALESCE(excluded.started_at, execution_steps.started_at),
      finished_at = excluded.finished_at,
      failed_at = excluded.failed_at,
      last_output_hash = excluded.last_output_hash,
      error_code = excluded.error_code,
      error_message = excluded.error_message,
      error_type = excluded.error_type,
      reason = excluded.reason
  `).run(
    stepRow.id,
    stepRow.executionId,
    stepRow.stageId,
    stepRow.parentStepId,
    stepRow.sequence,
    stepRow.status,
    stepRow.kind,
    stepRow.originalText,
    stepRow.originalInput,
    stepRow.normalizedInput,
    stepRow.resolvedCommand,
    stepRow.dependsOnStepIds,
    stepRow.blocking ? 1 : 0,
    stepRow.canRunIfPriorFailed ? 1 : 0,
    stepRow.canRunIfPriorDeferred ? 1 : 0,
    stepRow.riskLevel,
    stepRow.policyResult,
    stepRow.pauseReason,
    stepRow.rewriteReason,
    stepRow.deferred ? 1 : 0,
    stepRow.blockReason,
    stepRow.normalizationNote,
    stepRow.reviewAcknowledged ? 1 : 0,
    stepRow.idempotencyClass,
    stepRow.attemptNumber,
    stepRow.attempts,
    stepRow.idempotencyKey,
    stepRow.isIdempotent ? 1 : 0,
    stringifyJson(stepRow.sideEffects),
    stepRow.createdAt,
    stepRow.startedAt,
    stepRow.finishedAt,
    stepRow.failedAt,
    stepRow.lastOutputHash,
    stepRow.errorCode,
    stepRow.errorMessage,
    stepRow.errorType,
    stepRow.reason,
  );
}

function upsertStageRow(db, stageRow) {
  db.prepare(`
    INSERT INTO execution_stages (
      id, execution_id, sequence, name, status, requires_review, pause_reason,
      created_at, started_at, finished_at, last_updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(execution_id, id) DO UPDATE SET
      sequence = excluded.sequence,
      name = excluded.name,
      status = excluded.status,
      requires_review = excluded.requires_review,
      pause_reason = excluded.pause_reason,
      started_at = COALESCE(excluded.started_at, execution_stages.started_at),
      finished_at = excluded.finished_at,
      last_updated_at = excluded.last_updated_at
  `).run(
    stageRow.id,
    stageRow.executionId,
    stageRow.sequence,
    stageRow.name,
    stageRow.status,
    stageRow.requiresReview ? 1 : 0,
    stageRow.pauseReason,
    stageRow.createdAt,
    stageRow.startedAt,
    stageRow.finishedAt,
    stageRow.lastUpdatedAt,
  );
}

function upsertReviewRowsTx(db, review = {}) {
  const executionId = String(review.runId || review.executionId || "");
  if (!executionId) {
    throw new Error("Review record requires an execution id.");
  }

  const createdAt = String(review.createdAt || nowIso());
  const updatedAt = String(review.updatedAt || createdAt);
  const steps = Array.isArray(review.steps) && review.steps.length
    ? review.steps
    : [{ stepId: null, commandPreview: review.summary || null, intent: review.originalRequest || "execution" }];

  for (const step of steps) {
    const stepId = step.stepId ? String(step.stepId) : null;
    const recordId = `review:${executionId}:${stepId || "execution"}`;
    db.prepare(`
      INSERT INTO review_records (
        id, execution_id, step_id, review_action, reviewed_by, reviewed_at,
        proposal_type, operator_modified, final_text, created_at, updated_at
      )
      VALUES (?, ?, ?, NULL, NULL, NULL, ?, 0, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        proposal_type = excluded.proposal_type,
        final_text = COALESCE(review_records.final_text, excluded.final_text),
        updated_at = excluded.updated_at
    `).run(
      recordId,
      executionId,
      stepId,
      String(review.reviewMode || review.proposalType || "review_surface"),
      step.commandPreview ? String(step.commandPreview) : step.intent ? String(step.intent) : null,
      createdAt,
      updatedAt,
    );
  }
}

function resolveReviewRowsTx(db, executionId, resolution = {}) {
  const action = normalizeReviewAction(resolution.reviewAction);
  if (!action) {
    return false;
  }

  const timestamp = String(resolution.reviewedAt || nowIso());
  const reviewedBy = resolution.reviewedBy ? String(resolution.reviewedBy) : "system";
  db.prepare(`
    UPDATE review_records
    SET review_action = ?,
        reviewed_by = ?,
        reviewed_at = ?,
        operator_modified = ?,
        final_text = COALESCE(?, final_text),
        updated_at = ?
    WHERE execution_id = ?
      AND review_action IS NULL
  `).run(
    action,
    reviewedBy,
    timestamp,
    resolution.operatorModified ? 1 : 0,
    resolution.finalText ? String(resolution.finalText) : null,
    timestamp,
    String(executionId),
  );
  return true;
}

function applyReviewRecordTx(db, review = {}) {
  if (!review || !(review.runId || review.executionId)) {
    return false;
  }

  upsertReviewRowsTx(db, review);
  const normalizedStatus = String(review.status || "").toLowerCase();
  if (normalizedStatus === "pending") {
    return true;
  }
  if (["approved", "simulated", "resolved"].includes(normalizedStatus)) {
    return resolveReviewRowsTx(db, review.runId || review.executionId, {
      reviewAction: "approve",
      reviewedBy: "system",
      reviewedAt: review.updatedAt || review.createdAt || nowIso(),
      finalText: review.summary || null,
    });
  }
  if (["modified", "rewritten"].includes(normalizedStatus)) {
    return resolveReviewRowsTx(db, review.runId || review.executionId, {
      reviewAction: "approve_with_edit",
      reviewedBy: "system",
      reviewedAt: review.updatedAt || review.createdAt || nowIso(),
      operatorModified: true,
      finalText: review.summary || null,
    });
  }
  if (["blocked", "rejected"].includes(normalizedStatus)) {
    return resolveReviewRowsTx(db, review.runId || review.executionId, {
      reviewAction: "block",
      reviewedBy: "system",
      reviewedAt: review.updatedAt || review.createdAt || nowIso(),
      finalText: review.summary || null,
    });
  }
  return true;
}

function replaceExecutionSteps(db, executionId, stepRows = []) {
  stepRows.forEach((step) => upsertStepRow(db, step));

  const stepIds = stepRows.map((step) => step.id);
  if (stepIds.length) {
    const placeholders = stepIds.map(() => "?").join(", ");
    db.prepare(`
      DELETE FROM execution_steps
      WHERE execution_id = ?
        AND id NOT IN (${placeholders})
    `).run(executionId, ...stepIds);
  } else {
    db.prepare("DELETE FROM execution_steps WHERE execution_id = ?").run(executionId);
  }
}

function replaceExecutionStages(db, executionId, stageRows = []) {
  stageRows.forEach((stage) => upsertStageRow(db, stage));
  const stageIds = stageRows.map((stage) => stage.id);
  if (stageIds.length) {
    const placeholders = stageIds.map(() => "?").join(", ");
    db.prepare(`
      DELETE FROM execution_stages
      WHERE execution_id = ?
        AND id NOT IN (${placeholders})
    `).run(executionId, ...stageIds);
  } else {
    db.prepare("DELETE FROM execution_stages WHERE execution_id = ?").run(executionId);
  }
}

function persistExecutionSnapshot(run = {}, options = {}, tx = null) {
  if (!run || !(run.runId || run.id)) {
    throw new Error("Execution snapshot requires a runId.");
  }

  return executeWrite(tx, (db) => {
    const dbNowIso = readDatabaseNow(db).nowIso;
    const normalizationOptions = {
      ...options,
      nowIso: dbNowIso,
    };
    const executionRow = normalizeExecutionRow(run, normalizationOptions);
    const existingExecution = db.prepare("SELECT status FROM executions WHERE id = ?").get(executionRow.id);
    if (existingExecution && !isValidStatusTransition(existingExecution.status, executionRow.status)) {
      throw new Error(
        `Invalid execution status transition from ${existingExecution.status} to ${executionRow.status} for ${executionRow.id}.`
      );
    }

    const existingSteps = new Map(
      db.prepare("SELECT id, status FROM execution_steps WHERE execution_id = ?").all(executionRow.id).map((row) => [
        String(row.id),
        String(row.status),
      ])
    );
    const existingStages = new Map(
      db.prepare("SELECT id, status FROM execution_stages WHERE execution_id = ?").all(executionRow.id).map((row) => [
        String(row.id),
        String(row.status),
      ])
    );
    const normalizedStages = (Array.isArray(run.stages) ? run.stages : []).map((stage, index) =>
      normalizeStageRow(executionRow.id, stage, index, normalizationOptions)
    );
    const normalizedSteps = (Array.isArray(run.steps) ? run.steps : []).map((step, index) =>
      normalizeStepRow(executionRow.id, step, index, normalizationOptions)
    );
    for (const stage of normalizedStages) {
      const currentStatus = existingStages.get(stage.id);
      if (currentStatus && !isValidStatusTransition(currentStatus, stage.status)) {
        throw new Error(
          `Invalid stage status transition from ${currentStatus} to ${stage.status} for ${executionRow.id}:${stage.id}.`
        );
      }
    }
    for (const step of normalizedSteps) {
      const currentStatus = existingSteps.get(step.id);
      if (currentStatus && !isValidStatusTransition(currentStatus, step.status)) {
        throw new Error(
          `Invalid step status transition from ${currentStatus} to ${step.status} for ${executionRow.id}:${step.id}.`
        );
      }
    }

    upsertExecutionRow(db, executionRow);
    replaceExecutionStages(db, executionRow.id, normalizedStages);
    replaceExecutionSteps(db, executionRow.id, normalizedSteps);
    if (options.reviewRecord) {
      applyReviewRecordTx(db, options.reviewRecord);
    }

    for (const auditEvent of options.auditEvents || []) {
      const normalizedEvent = normalizeAuditEvent({
        ...auditEvent,
        executionId: auditEvent.executionId || executionRow.id,
      }, normalizationOptions);
      db.prepare(`
        INSERT INTO audit_events (id, tenant_id, workspace_id, execution_id, step_id, event_type, event_payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normalizedEvent.id,
        normalizedEvent.tenantId,
        normalizedEvent.workspaceId,
        normalizedEvent.executionId,
        normalizedEvent.stepId,
        normalizedEvent.eventType,
        normalizedEvent.eventPayload,
        normalizedEvent.createdAt,
      );
    }

    return executionRow;
  });
}

function upsertReviewRecords(review = {}, tx = null) {
  return executeWrite(tx, (db) => {
    upsertReviewRowsTx(db, review);
    return true;
  });
}

function resolveReviewRecords(executionId, resolution = {}, tx = null) {
  return executeWrite(tx, (db) => {
    return resolveReviewRowsTx(db, executionId, resolution);
  });
}

function appendAuditEvents(events = [], tx = null) {
  return executeWrite(tx, (db) => {
    const dbNowIso = readDatabaseNow(db).nowIso;
    for (const event of events) {
      const normalized = normalizeAuditEvent(event, { nowIso: dbNowIso });
      db.prepare(`
        INSERT INTO audit_events (id, tenant_id, workspace_id, execution_id, step_id, event_type, event_payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normalized.id,
        normalized.tenantId,
        normalized.workspaceId,
        normalized.executionId,
        normalized.stepId,
        normalized.eventType,
        normalized.eventPayload,
        normalized.createdAt,
      );
    }
    return events.length;
  });
}

function loadLatestExecutionStateForPlan(planId) {
  return withDatabase((db) => {
    const latest = db.prepare(`
      SELECT id
      FROM executions
      WHERE plan_id = ?
      ORDER BY last_updated_at DESC, created_at DESC, id DESC
      LIMIT 1
    `).get(String(planId));

    if (!latest?.id) {
      return null;
    }

    return loadExecutionState(String(latest.id));
  });
}

function applyOperatorRecoveryAction(planId, executionId, options = {}) {
  if (!String(planId || "").trim()) {
    return failure("EXECUTION_NOT_FOUND", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("EXECUTION_NOT_FOUND", "executionId is required.");
  }

  const action = String(options.action || "").trim().toLowerCase();
  const operatorId = String(options.operatorId || "").trim();
  const reason = String(options.reason || "").trim();
  const stepId = options.stepId == null ? null : String(options.stepId);

  if (!operatorId) {
    return failure("INVALID_TRANSITION", "operatorId is required.");
  }
  if (["retry_step", "cancel_execution", "reject_resume", "modify_resume"].includes(action) && !reason) {
    return failure("OPERATOR_REASON_REQUIRED", "Operator reason is required for this action.");
  }

  try {
    return runInTransaction((db) => {
      const now = readDatabaseNow(db);
      const checkpoint = readCheckpointRow(db, planId);
      if (!checkpoint) {
        return failure("EXECUTION_NOT_FOUND", `Execution checkpoint ${planId} was not found.`);
      }

      const executionRow = db.prepare(`
        SELECT id, status, requires_review AS requiresReview
        FROM executions
        WHERE id = ? AND plan_id = ?
      `).get(String(executionId), String(planId));
      if (!executionRow) {
        return failure("EXECUTION_NOT_FOUND", `Execution ${executionId} was not found for plan ${planId}.`);
      }

      const checkpointStatus = String(checkpoint.status || "").trim().toLowerCase();
      const executionStatus = String(executionRow.status || "").trim().toLowerCase();
      const inReviewState =
        isReviewCheckpointStatus(checkpointStatus) || isReviewExecutionState(executionRow);
      const allowFailedRetry =
        action === "retry_step"
        && (checkpointStatus === "failed" || executionStatus === "failed");

      if (
        (isTerminalCheckpointStatus(checkpointStatus) || isTerminalExecutionStatus(executionStatus))
        && !allowFailedRetry
      ) {
        return failure(
          "INVALID_TRANSITION",
          `Operator action "${action}" is not allowed after execution ${executionId} reached terminal state.`,
        );
      }

      if (!inReviewState && !allowFailedRetry) {
        return failure(
          "INVALID_TRANSITION",
          `Operator action "${action}" is only allowed while execution ${executionId} is paused for review.`,
        );
      }

      const steps = db.prepare(`
        SELECT
          id,
          stage_id AS stageId,
          sequence,
          status,
          original_input AS originalInput,
          normalized_input AS normalizedInput
        FROM execution_steps
        WHERE execution_id = ?
        ORDER BY sequence ASC
      `).all(String(executionId));
      const stages = db.prepare(`
        SELECT
          id,
          sequence,
          status
        FROM execution_stages
        WHERE execution_id = ?
        ORDER BY sequence ASC
      `).all(String(executionId));

      if (action === "cancel_execution") {
        const nextCheckpoint = {
          ...checkpoint,
          status: "cancelled",
          cancellationRequested: true,
          updatedAt: now.nowMs,
        };
        writeCheckpointRow(db, nextCheckpoint);

        db.prepare(`
          UPDATE executions
          SET status = 'cancelled',
              requires_review = 0,
              finished_at = COALESCE(finished_at, ?),
              cancelled_at = ?,
              last_updated_at = ?
          WHERE id = ?
        `).run(now.nowIso, now.nowIso, now.nowIso, String(executionId));

        db.prepare(`
          UPDATE execution_steps
          SET status = CASE
                WHEN status IN ('completed', 'failed', 'cancelled') THEN status
                ELSE 'cancelled'
              END,
              finished_at = CASE
                WHEN status IN ('completed', 'failed', 'cancelled') THEN finished_at
                ELSE COALESCE(finished_at, ?)
              END,
              error_code = CASE
                WHEN status IN ('completed', 'failed', 'cancelled') THEN error_code
                ELSE 'operator_cancelled'
              END,
              error_message = CASE
                WHEN status IN ('completed', 'failed', 'cancelled') THEN error_message
                ELSE ?
              END
          WHERE execution_id = ?
        `).run(now.nowIso, reason || "Execution cancelled by operator.", String(executionId));

        db.prepare(`
          UPDATE execution_stages
          SET status = CASE
                WHEN status IN ('completed', 'failed', 'cancelled') THEN status
                ELSE 'cancelled'
              END,
              finished_at = CASE
                WHEN status IN ('completed', 'failed', 'cancelled') THEN finished_at
                ELSE COALESCE(finished_at, ?)
              END,
              last_updated_at = ?
          WHERE execution_id = ?
        `).run(now.nowIso, now.nowIso, String(executionId));

        resolveReviewRowsTx(db, executionId, {
          reviewAction: "cancel_execution",
          reviewedBy: operatorId,
          reviewedAt: now.nowIso,
          operatorModified: false,
          finalText: reason || "Execution cancelled by operator.",
        });

        const auditEvent = normalizeAuditEvent({
          executionId,
          eventType: "operator.cancel_requested",
          createdAt: now.nowIso,
          payload: {
            actorId: operatorId,
            reason,
          },
        });
        db.prepare(`
          INSERT INTO audit_events (id, execution_id, step_id, event_type, event_payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          auditEvent.id,
          auditEvent.executionId,
          auditEvent.stepId,
          auditEvent.eventType,
          auditEvent.eventPayload,
          auditEvent.createdAt,
        );

        appendLedgerEventTx(db, {
          planId,
          executionId,
          eventType: "execution.cancelled",
          payload: {
            actorId: operatorId,
            reason,
            source: "operator_recovery",
          },
        });

        const lockResult = releaseExecutionLockTx(db, planId, executionId);
        if (!lockResult.ok) {
          throw createTransactionalFailure(lockResult.code, lockResult.message);
        }

        return success({
          checkpoint: nextCheckpoint,
          action: "cancel_execution",
          executionId: String(executionId),
        });
      }

      if (action === "retry_step") {
        const targetStep = stepId
          ? steps.find((entry) => String(entry.id) === stepId)
          : steps.find((entry) => String(entry.status || "") === "failed")
            || steps.find((entry) => String(entry.status || "") === "paused_for_review")
            || steps.find((entry) => Number(entry.sequence) === Number(checkpoint.currentStep) + 1)
            || null;

        if (!targetStep) {
          return failure("STEP_NOT_FOUND", `Retry target step was not found for plan ${planId}.`);
        }

        const targetStepIndex = Math.max(0, Number(targetStep.sequence) - 1);
        const targetStageId = targetStep.stageId == null ? null : String(targetStep.stageId);
        const targetStageSequence = targetStageId == null
          ? null
          : Number(stages.find((stage) => String(stage.id) === targetStageId)?.sequence || 0);

        const nextCheckpoint = {
          ...checkpoint,
          status: "paused",
          cancellationRequested: false,
          currentStep: targetStepIndex,
          lastCompletedStepIndex: Math.min(checkpoint.lastCompletedStepIndex, targetStepIndex - 1),
          updatedAt: now.nowMs,
        };
        writeCheckpointRow(db, nextCheckpoint);

        db.prepare(`
          UPDATE executions
          SET status = 'paused',
              requires_review = 0,
              finished_at = NULL,
              cancelled_at = NULL,
              last_updated_at = ?
          WHERE id = ?
        `).run(now.nowIso, String(executionId));

        db.prepare(`
          UPDATE execution_steps
          SET status = CASE
                WHEN sequence = ? THEN 'pending'
                WHEN sequence > ? AND status <> 'completed' THEN 'pending'
                ELSE status
              END,
              started_at = CASE
                WHEN sequence >= ? AND status <> 'completed' THEN NULL
                ELSE started_at
              END,
              finished_at = CASE
                WHEN sequence >= ? AND status <> 'completed' THEN NULL
                ELSE finished_at
              END,
              pause_reason = CASE
                WHEN sequence >= ? AND status <> 'completed' THEN NULL
                ELSE pause_reason
              END,
              block_reason = CASE
                WHEN sequence >= ? AND status <> 'completed' THEN NULL
                ELSE block_reason
              END,
              error_code = CASE
                WHEN sequence >= ? AND status <> 'completed' THEN NULL
                ELSE error_code
              END,
              error_message = CASE
                WHEN sequence >= ? AND status <> 'completed' THEN NULL
                ELSE error_message
              END,
              review_acknowledged = CASE
                WHEN id = ? THEN 1
                ELSE review_acknowledged
              END
          WHERE execution_id = ?
        `).run(
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          Number(targetStep.sequence),
          String(targetStep.id),
          String(executionId),
        );

        if (targetStageSequence != null) {
          db.prepare(`
            UPDATE execution_stages
            SET status = CASE
                  WHEN sequence < ? AND status = 'completed' THEN status
                  WHEN sequence = ? THEN 'pending'
                  WHEN sequence > ? THEN 'pending'
                  ELSE status
                END,
                pause_reason = CASE
                  WHEN sequence >= ? THEN NULL
                  ELSE pause_reason
                END,
                started_at = CASE
                  WHEN sequence >= ? THEN NULL
                  ELSE started_at
                END,
                finished_at = CASE
                  WHEN sequence >= ? AND status <> 'completed' THEN NULL
                  ELSE finished_at
                END,
                last_updated_at = ?
            WHERE execution_id = ?
          `).run(
            targetStageSequence,
            targetStageSequence,
            targetStageSequence,
            targetStageSequence,
            targetStageSequence,
            targetStageSequence,
            now.nowIso,
            String(executionId),
          );
        }

        resolveReviewRowsTx(db, executionId, {
          reviewAction: "approve",
          reviewedBy: operatorId,
          reviewedAt: now.nowIso,
          operatorModified: false,
          finalText: reason || "Retry requested by operator.",
        });

        const auditEvent = normalizeAuditEvent({
          executionId,
          stepId: String(targetStep.id),
          eventType: "operator.retry_requested",
          createdAt: now.nowIso,
          payload: {
            actorId: operatorId,
            reason,
            originalInput: parseJson(targetStep.originalInput, null),
            normalizedInput: parseJson(targetStep.normalizedInput, null),
          },
        });
        db.prepare(`
          INSERT INTO audit_events (id, execution_id, step_id, event_type, event_payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          auditEvent.id,
          auditEvent.executionId,
          auditEvent.stepId,
          auditEvent.eventType,
          auditEvent.eventPayload,
          auditEvent.createdAt,
        );

        appendLedgerEventTx(db, {
          planId,
          executionId,
          stepId: String(targetStep.id),
          eventType: "operator.retry_requested",
          payload: {
            actorId: operatorId,
            reason,
            originalInput: parseJson(targetStep.originalInput, null),
          },
        });

        return success({
          checkpoint: nextCheckpoint,
          action: "retry_step",
          executionId: String(executionId),
          stepId: String(targetStep.id),
          stepIndex: targetStepIndex,
        });
      }

      return failure("INVALID_TRANSITION", `Unsupported operator action "${action}".`);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function loadExecutionState(executionId, tx = null) {
  const reader = tx
    ? (work) => work(tx)
    : (work) => withDatabase((db) => work(db));
  return reader((db) => {
    const execution = db.prepare(`
      SELECT
        id,
        tenant_id AS tenantId,
        workspace_id AS workspaceId,
        plan_id AS planId,
        status,
        trigger_source AS triggerSource,
        requires_review AS requiresReview,
        created_at AS createdAt,
        started_at AS startedAt,
        finished_at AS finishedAt,
        cancelled_at AS cancelledAt,
        lease_owner AS leaseOwner,
        lease_expires_at AS leaseExpiresAt,
        total_attempts AS totalAttempts,
        consecutive_failures AS consecutiveFailures,
        no_progress_attempts AS noProgressAttempts,
        last_progress_at AS lastProgressAt,
        last_updated_at AS lastUpdatedAt
      FROM executions
      WHERE id = ?
    `).get(String(executionId));

    if (!execution) {
      return {
        execution: null,
        steps: [],
        pendingReviews: [],
        auditTimeline: [],
      };
    }

    const steps = db.prepare(`
      SELECT
        id,
        execution_id AS executionId,
        stage_id AS stageId,
        parent_step_id AS parentStepId,
        sequence,
        status,
        kind,
        original_text AS originalText,
        original_input AS originalInput,
        normalized_input AS normalizedInput,
        resolved_command AS resolvedCommand,
        depends_on_step_ids AS dependsOnStepIds,
        blocking,
        can_run_if_prior_failed AS canRunIfPriorFailed,
        can_run_if_prior_deferred AS canRunIfPriorDeferred,
        risk_level AS riskLevel,
        policy_result AS policyResult,
        pause_reason AS pauseReason,
        rewrite_reason AS rewriteReason,
        deferred,
        block_reason AS blockReason,
        normalization_note AS normalizationNote,
        review_acknowledged AS reviewAcknowledged,
        idempotency_class AS idempotencyClass,
        attempt_number AS attemptNumber,
        attempts,
        idempotency_key AS idempotencyKey,
        is_idempotent AS isIdempotent,
        side_effects AS sideEffects,
        created_at AS createdAt,
        started_at AS startedAt,
        finished_at AS finishedAt,
        failed_at AS failedAt,
        last_output_hash AS lastOutputHash,
        error_code AS errorCode,
        error_message AS errorMessage,
        error_type AS errorType,
        reason
      FROM execution_steps
      WHERE execution_id = ?
      ORDER BY sequence ASC
    `).all(String(executionId)).map((step) => ({
      ...step,
      dependsOnStepIds: parseJson(step.dependsOnStepIds, []),
      originalInput: parseJson(step.originalInput, null),
      normalizedInput: parseJson(step.normalizedInput, null),
      blocking: Boolean(step.blocking),
      canRunIfPriorFailed: Boolean(step.canRunIfPriorFailed),
      canRunIfPriorDeferred: Boolean(step.canRunIfPriorDeferred),
      deferred: Boolean(step.deferred),
      reviewAcknowledged: Boolean(step.reviewAcknowledged),
      isIdempotent: Boolean(step.isIdempotent),
      sideEffects: parseJson(step.sideEffects, []),
    }));

    const stages = db.prepare(`
      SELECT
        id,
        execution_id AS executionId,
        sequence,
        name,
        status,
        requires_review AS requiresReview,
        pause_reason AS pauseReason,
        created_at AS createdAt,
        started_at AS startedAt,
        finished_at AS finishedAt,
        last_updated_at AS lastUpdatedAt
      FROM execution_stages
      WHERE execution_id = ?
      ORDER BY sequence ASC
    `).all(String(executionId)).map((stage) => ({
      ...stage,
      requiresReview: Boolean(stage.requiresReview),
    }));

    const pendingReviews = db.prepare(`
      SELECT
        id,
        execution_id AS executionId,
        step_id AS stepId,
        review_action AS reviewAction,
        reviewed_by AS reviewedBy,
        reviewed_at AS reviewedAt,
        proposal_type AS proposalType,
        operator_modified AS operatorModified,
        final_text AS finalText,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM review_records
      WHERE execution_id = ?
        AND review_action IS NULL
      ORDER BY created_at ASC, id ASC
    `).all(String(executionId)).map((record) => ({
      ...record,
      operatorModified: Boolean(record.operatorModified),
    }));

    const auditTimeline = db.prepare(`
      SELECT
        id,
        tenant_id AS tenantId,
        workspace_id AS workspaceId,
        execution_id AS executionId,
        step_id AS stepId,
        event_type AS eventType,
        event_payload AS eventPayload,
        created_at AS createdAt
      FROM audit_events
      WHERE execution_id = ?
      ORDER BY created_at ASC, id ASC
    `).all(String(executionId)).map((event) => ({
      ...event,
      tenantId: event.tenantId == null ? null : String(event.tenantId),
      workspaceId: event.workspaceId == null ? null : String(event.workspaceId),
      eventPayload: parseJson(event.eventPayload, {}),
    }));

    return {
      execution: {
        ...execution,
        tenantId: execution.tenantId == null ? null : String(execution.tenantId),
        workspaceId: execution.workspaceId == null ? null : String(execution.workspaceId),
        requiresReview: Boolean(execution.requiresReview),
        leaseExpiresAt: execution.leaseExpiresAt == null ? null : Number(execution.leaseExpiresAt),
        totalAttempts: Number(execution.totalAttempts || 0),
        consecutiveFailures: Number(execution.consecutiveFailures || 0),
        noProgressAttempts: Number(execution.noProgressAttempts || 0),
      },
      stages,
      steps,
      pendingReviews,
      auditTimeline,
    };
  });
}

function getResumableExecutions() {
  return withDatabase((db) =>
    db.prepare(`
      SELECT
        id,
        tenant_id AS tenantId,
        workspace_id AS workspaceId,
        plan_id AS planId,
        status,
        trigger_source AS triggerSource,
        requires_review AS requiresReview,
        created_at AS createdAt,
        started_at AS startedAt,
        finished_at AS finishedAt,
        cancelled_at AS cancelledAt,
        lease_owner AS leaseOwner,
        lease_expires_at AS leaseExpiresAt,
        total_attempts AS totalAttempts,
        consecutive_failures AS consecutiveFailures,
        no_progress_attempts AS noProgressAttempts,
        last_progress_at AS lastProgressAt,
        last_updated_at AS lastUpdatedAt
      FROM executions
      WHERE status IN ('running', 'paused', 'paused_for_review')
      ORDER BY last_updated_at DESC, created_at DESC
    `).all().map((execution) => ({
      ...execution,
      tenantId: execution.tenantId == null ? null : String(execution.tenantId),
      workspaceId: execution.workspaceId == null ? null : String(execution.workspaceId),
      requiresReview: Boolean(execution.requiresReview),
      leaseExpiresAt: execution.leaseExpiresAt == null ? null : Number(execution.leaseExpiresAt),
      totalAttempts: Number(execution.totalAttempts || 0),
      consecutiveFailures: Number(execution.consecutiveFailures || 0),
      noProgressAttempts: Number(execution.noProgressAttempts || 0),
    }))
  );
}

function countActiveExecutions() {
  return withDatabase((db) => {
    const row = db.prepare(`
      SELECT COUNT(*) AS total
      FROM executions
      WHERE status IN ('pending', 'running')
    `).get();
    return Number(row?.total || 0);
  });
}

function clearExecutionStateForTests() {
  return runInTransaction((db) => {
    db.exec(`
      DELETE FROM execution_recovery_queue;
      DELETE FROM operator_action_idempotency;
      DELETE FROM execution_ledger;
      DELETE FROM execution_attempts;
      DELETE FROM execution_locks;
      DELETE FROM execution_state;
      DELETE FROM audit_events;
      DELETE FROM review_records;
      DELETE FROM execution_stages;
      DELETE FROM execution_steps;
      DELETE FROM executions;
    `);
    return true;
  });
}

module.exports = {
  STRICT_AUDIT_EVENT_TYPES,
  appendAuditEvents,
  checkpointAfterStep,
  checkpointBeforeStep,
  clearExecutionStateForTests,
  countActiveExecutions,
  failExecutionCheckpoint,
  finalizeExecutionTransition,
  getResumableExecutions,
  loadExecutionCheckpoint,
  loadExecutionState,
  loadLatestExecutionStateForPlan,
  markAwaitingReview,
  persistExecutionSnapshot,
  recoverExecutionState,
  requestExecutionCancellation,
  applyOperatorRecoveryAction,
  resolveReviewRecords,
  setExecutionCheckpointStatus,
  startExecutionState,
  upsertReviewRecords,
};
