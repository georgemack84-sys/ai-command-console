const { appendAuditEvent } = require("./auditTrail");
const { getReviewSurface } = require("./reviewSurface");
const { readDatabaseNow, runInTransaction, withDatabase } = require("./stateDatabase");
const { acquireOrReuseExecutionLock } = require("./executionIntegrityStore");
const {
  applyOperatorRecoveryAction: applyOperatorRecoveryActionTx,
  loadLatestExecutionStateForPlan,
} = require("./executionStateStore");
const { replayExecution, describeExecutionState, explainExecutionCorruption } = require("./executionReconciliation");
const { recoverExecution, resumeExecution } = require("./executionEngine");

const OPERATOR_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const LOCK_TIMEOUT_MS = 30000;
const RISK_LEVELS = new Set(["low", "medium", "high", "critical"]);
const ERROR_CODES = Object.freeze({
  IDEMPOTENCY_KEY_REQUIRED: "IDEMPOTENCY_KEY_REQUIRED",
  LOCK_CONFLICT: "LOCK_CONFLICT",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  EXECUTION_NOT_FOUND: "EXECUTION_NOT_FOUND",
  STEP_NOT_FOUND: "STEP_NOT_FOUND",
  OPERATOR_REASON_REQUIRED: "OPERATOR_REASON_REQUIRED",
  REVIEW_SURFACE_UNAVAILABLE: "REVIEW_SURFACE_UNAVAILABLE",
  LOCK_RELEASE_FAILED: "LOCK_RELEASE_FAILED",
});

function success(data) {
  return { ok: true, data };
}

function failure(code, message, extra = {}) {
  return {
    ok: false,
    error: { code, message },
    ...extra,
  };
}

function clampRiskLevel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return RISK_LEVELS.has(normalized) ? normalized : "medium";
}

function parseJson(value, fallback = null) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildIdempotencyFingerprint(planId, action, options = {}) {
  return JSON.stringify({
    planId: String(planId || ""),
    action: String(action || ""),
    operatorId: String(options.operatorId || ""),
    stepId: options.stepId == null ? null : String(options.stepId),
    reason: String(options.reason || ""),
    updatedInput: Object.prototype.hasOwnProperty.call(options, "updatedInput")
      ? options.updatedInput
      : null,
  });
}

function purgeExpiredOperatorActionIdempotency() {
  return runInTransaction((db) => {
    const nowMs = readDatabaseNow(db).nowMs;
    db.prepare(`
      DELETE FROM operator_action_idempotency
      WHERE expires_at_ms <= ?
    `).run(nowMs);
    return true;
  });
}

function loadOperatorActionIdempotency(idempotencyKey) {
  return withDatabase((db) =>
    db.prepare(`
      SELECT
        idempotency_key AS idempotencyKey,
        plan_id AS planId,
        execution_id AS executionId,
        action_type AS actionType,
        actor_id AS actorId,
        request_fingerprint AS requestFingerprint,
        response_payload AS responsePayload,
        created_at AS createdAt,
        expires_at_ms AS expiresAtMs
      FROM operator_action_idempotency
      WHERE idempotency_key = ?
    `).get(String(idempotencyKey))
  );
}

function storeOperatorActionIdempotency(idempotencyKey, planId, executionId, action, operatorId, fingerprint, response) {
  return runInTransaction((db) => {
    const nowMs = readDatabaseNow(db).nowMs;
    db.prepare(`
      INSERT INTO operator_action_idempotency (
        idempotency_key, plan_id, execution_id, action_type, actor_id,
        request_fingerprint, response_payload, created_at, expires_at_ms
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(idempotency_key) DO UPDATE SET
        response_payload = excluded.response_payload,
        expires_at_ms = excluded.expires_at_ms
    `).run(
      String(idempotencyKey),
      String(planId),
      executionId == null ? null : String(executionId),
      String(action),
      String(operatorId),
      String(fingerprint),
      JSON.stringify(response),
      nowMs,
      nowMs + OPERATOR_IDEMPOTENCY_TTL_MS,
    );
    return true;
  });
}

function mapSnapshotStatus(snapshot = null, checkpoint = null) {
  const raw = String(
    snapshot?.execution?.status
    || checkpoint?.status
    || ""
  ).trim().toLowerCase();

  if (["completed"].includes(raw)) {
    return "completed";
  }
  if (["failed", "execution_abandoned", "corrupted"].includes(raw)) {
    return "failed";
  }
  if (["cancelled"].includes(raw)) {
    return "cancelled";
  }
  if (["running"].includes(raw)) {
    return "running";
  }
  return "paused";
}

function deriveRiskLevel(snapshot = null, state = null) {
  const activeStepId =
    state?.diagnostics?.summary?.active?.snapshot?.stepId
    || state?.diagnostics?.summary?.active?.ledger?.stepId
    || null;
  const activeStep = (snapshot?.steps || []).find((step) => String(step.id) === String(activeStepId))
    || (snapshot?.steps || []).find((step) =>
      ["running", "failed", "paused_for_review", "blocked", "deferred", "pending"].includes(String(step.status || ""))
    )
    || null;

  const declaredRisk = clampRiskLevel(activeStep?.riskLevel);
  if (declaredRisk !== "medium") {
    return declaredRisk;
  }

  const idempotencyClass = String(activeStep?.idempotencyClass || "").trim().toLowerCase();
  if (["unsafe_repeat", "confirmation_required"].includes(idempotencyClass)) {
    return "high";
  }

  const recoveryReason = String(state?.recoveryQueue?.find((entry) => entry.resolvedAt == null)?.reason || "").toLowerCase();
  if (/(destructive|human_review|corrupt|abandon)/.test(recoveryReason)) {
    return "critical";
  }
  if (/(external|network|unsafe|manual)/.test(recoveryReason)) {
    return "high";
  }
  return "medium";
}

function deriveWhyPaused(snapshot = null, state = null) {
  const unresolvedRecovery = (state?.recoveryQueue || []).find((entry) => entry.resolvedAt == null) || null;
  if (unresolvedRecovery) {
    return unresolvedRecovery.reason;
  }
  if (state?.issues?.length) {
    return state.issues[0].message || state.issues[0].code || "Execution integrity issue detected.";
  }
  const activeStepId = state?.diagnostics?.summary?.active?.snapshot?.stepId || null;
  const activeStep = (snapshot?.steps || []).find((step) => String(step.id) === String(activeStepId))
    || (snapshot?.steps || []).find((step) =>
      ["failed", "paused_for_review", "blocked", "deferred"].includes(String(step.status || ""))
    )
    || null;
  return activeStep?.pauseReason
    || activeStep?.errorMessage
    || activeStep?.blockReason
    || activeStep?.rewriteReason
    || "Execution paused pending operator input.";
}

function summarizeTimeline(timeline = []) {
  const summary = {
    totalEvents: timeline.length,
    attemptEvents: 0,
    stepEvents: 0,
    stageEvents: 0,
    executionEvents: 0,
    operatorEvents: 0,
    latestEventType: null,
    latestEventAt: null,
    failureCount: 0,
    pauseCount: 0,
  };

  for (const entry of timeline) {
    const eventType = String(entry?.eventType || "");
    if (!eventType) {
      continue;
    }
    if (eventType.startsWith("attempt.")) {
      summary.attemptEvents += 1;
    }
    if (eventType.startsWith("step.")) {
      summary.stepEvents += 1;
    }
    if (eventType.startsWith("stage.")) {
      summary.stageEvents += 1;
    }
    if (eventType.startsWith("execution.")) {
      summary.executionEvents += 1;
    }
    if (eventType.startsWith("operator.") || eventType.startsWith("review.")) {
      summary.operatorEvents += 1;
    }
    if (/failed|corrupted|abandoned/.test(eventType)) {
      summary.failureCount += 1;
    }
    if (/paused|review/.test(eventType)) {
      summary.pauseCount += 1;
    }
    summary.latestEventType = eventType;
    summary.latestEventAt = entry?.createdAt || summary.latestEventAt;
  }

  return summary;
}

function classifySideEffectSafety(step = null) {
  const action = String(step?.action || step?.kind || "").trim().toLowerCase();
  const idempotencyClass = String(step?.idempotencyClass || "").trim().toLowerCase();

  if (["read_file", "list_files", "inspect", "search", "diagnose"].includes(action)) {
    return {
      class: "pure_read",
      replaySafety: "safe",
      explanation: "This step reads existing state and can be replayed safely.",
    };
  }

  if (idempotencyClass === "safe_repeat") {
    return {
      class: "guarded_retry",
      replaySafety: "guarded",
      explanation: "This step is marked safe to repeat, but it should still run through the governed recovery path.",
    };
  }

  if (idempotencyClass === "unsafe_repeat" || idempotencyClass === "confirmation_required") {
    return {
      class: "operator_only",
      replaySafety: "manual_only",
      explanation: "This step is not safe to repeat automatically and needs an explicit operator decision.",
    };
  }

  return {
    class: "unknown",
    replaySafety: "manual_only",
    explanation: "Replay safety is not explicit, so operator review is the safe default.",
  };
}

function buildCurrentFocus(snapshot = null, state = null) {
  const active = state?.diagnostics?.summary?.active || {};
  const activeStageId = active?.snapshot?.stageId || active?.ledger?.stageId || null;
  const activeStepId = active?.snapshot?.stepId || active?.ledger?.stepId || null;

  const stage = (snapshot?.stages || []).find((entry) => String(entry.id) === String(activeStageId))
    || (snapshot?.stages || []).find((entry) => ["running", "paused_for_review", "failed", "pending"].includes(String(entry.status || "")))
    || null;
  const step = (snapshot?.steps || []).find((entry) => String(entry.id) === String(activeStepId))
    || (snapshot?.steps || []).find((entry) =>
      ["running", "failed", "paused_for_review", "blocked", "deferred", "pending"].includes(String(entry.status || ""))
    )
    || null;

  return {
    stage: stage ? {
      id: String(stage.id),
      name: stage.name || null,
      status: stage.status || null,
      sequence: stage.sequence ?? null,
    } : null,
    step: step ? {
      id: String(step.id),
      status: step.status || null,
      sequence: step.sequence ?? null,
      action: step.kind || step.action || null,
      riskLevel: clampRiskLevel(step.riskLevel),
      idempotencyClass: step.idempotencyClass || null,
      originalInput: step.originalInput ?? null,
      normalizedInput: step.normalizedInput ?? null,
      pauseReason: step.pauseReason || step.blockReason || step.errorMessage || null,
      sideEffectSafety: classifySideEffectSafety(step),
    } : null,
  };
}

function describeActionConstraints(action, surface = {}) {
  const currentFocus = surface.currentFocus || {};
  const step = currentFocus.step || null;
  const reason = surface.whyPaused || "Execution paused pending operator input.";
  const shared = {
    usesLocking: true,
    usesIdempotency: true,
    reviewSurfaceOnly: false,
  };

  if (action === "approve_resume") {
    return {
      ...shared,
      updatedInputRequired: false,
      notes: [
        "Resumes execution using the persisted paused review state.",
        "No step input is changed.",
      ],
      constraints: [
        "Only safe when the paused review state still matches persisted execution state.",
        `Current pause reason: ${reason}`,
      ],
    };
  }

  if (action === "modify_resume") {
    return {
      ...shared,
      updatedInputRequired: true,
      notes: [
        "Resumes execution after operator-supplied input replacement.",
        "The operator reason is recorded for audit and ledger review.",
      ],
      constraints: [
        "Requires operator reason.",
        "Requires updatedInput payload.",
        `Original step input will be replaced for step ${step?.id || "the active step"}.`,
      ],
    };
  }

  if (action === "reject_resume") {
    return {
      ...shared,
      updatedInputRequired: false,
      notes: [
        "Rejects the paused review path and preserves the stop for follow-up.",
      ],
      constraints: [
        "Requires operator reason.",
        "Does not silently resume execution.",
      ],
    };
  }

  if (action === "retry_step") {
    return {
      ...shared,
      updatedInputRequired: false,
      notes: [
        "Retries from the original stored input captured in persisted execution state.",
        "The retry is routed back through deterministic recovery.",
      ],
      constraints: [
        "Requires operator reason.",
        "Only safe for steps whose persisted input can be replayed intentionally.",
        `Current retry target: ${step?.id || "reconstructed failed step"}.`,
      ],
    };
  }

  if (action === "cancel_execution") {
    return {
      ...shared,
      updatedInputRequired: false,
      notes: [
        "Cancels non-terminal work and preserves completed or failed history.",
      ],
      constraints: [
        "Requires operator reason.",
        "Terminal transition must update checkpoint, snapshot, ledger, and lock state together.",
      ],
    };
  }

  return {
    ...shared,
    updatedInputRequired: false,
    notes: [],
    constraints: [],
  };
}

function buildSafeActions(surface = {}) {
  const rawCheckpointStatus = String(surface.rawStatus?.checkpoint || "").trim().toLowerCase();
  const rawExecutionStatus = String(surface.rawStatus?.execution || "").trim().toLowerCase();
  const actions = [];

  if (["paused", "paused_for_review"].includes(rawExecutionStatus) || rawCheckpointStatus === "paused") {
    actions.push(
      { action: "approve_resume", label: "Approve Resume", requiresReason: false },
      { action: "modify_resume", label: "Modify And Resume", requiresReason: true },
      { action: "reject_resume", label: "Reject Execution", requiresReason: true },
    );
  }

  if (["failed", "awaiting_review", "pause_for_operator_recovery", "execution_abandoned"].includes(rawCheckpointStatus)
    || rawExecutionStatus === "failed") {
    actions.push({ action: "retry_step", label: "Retry Step", requiresReason: true });
  }

  if (!["completed", "cancelled"].includes(rawExecutionStatus) && !["completed", "cancelled"].includes(rawCheckpointStatus)) {
    actions.push({ action: "cancel_execution", label: "Cancel Execution", requiresReason: true });
  }

  return actions.map((entry) => ({
    ...entry,
    allowed: true,
    riskLevel: surface.riskLevel || "medium",
    ...describeActionConstraints(entry.action, surface),
  }));
}

function recommendAction(surface = {}) {
  const riskLevel = surface.riskLevel || "medium";
  const actions = surface.safeActions || [];
  if (!actions.length) {
    return null;
  }
  const currentFocus = surface.currentFocus || {};
  const basis = {
    checkpointStatus: surface.rawStatus?.checkpoint || null,
    executionStatus: surface.rawStatus?.execution || null,
    activeStageId: currentFocus.stage?.id || null,
    activeStepId: currentFocus.step?.id || null,
    whyPaused: surface.whyPaused || null,
    latestTimelineEvent: surface.timelineSummary?.latestEventType || null,
  };

  const buildRecommendation = (action, reason) => ({
    action: action.action,
    label: action.label,
    requiresReason: Boolean(action.requiresReason),
    riskLevel,
    reason,
    basis,
  });

  if (riskLevel === "critical") {
    const action = actions.find((entry) => entry.action === "cancel_execution") || actions[0];
    return buildRecommendation(action, "Critical risk or irreversible side effects make cancellation the safest operator action.");
  }
  if (actions.some((entry) => entry.action === "approve_resume")) {
    const action = actions.find((entry) => entry.action === "approve_resume");
    return buildRecommendation(action, "The execution is paused in a resumable review state and can continue without changing persisted step input.");
  }
  if (actions.some((entry) => entry.action === "retry_step")) {
    const action = actions.find((entry) => entry.action === "retry_step");
    return buildRecommendation(action, "The failed execution can be retried from persisted input using the deterministic recovery path.");
  }
  return buildRecommendation(actions[0], "This is the safest remaining operator action for the current persisted execution state.");
}

function summarizeRecommendedAlternatives(surface = {}, recommendation = null) {
  const actions = surface.safeActions || [];
  if (!recommendation) {
    return [];
  }

  return actions
    .filter((entry) => entry.action !== recommendation.action)
    .map((entry) => ({
      action: entry.action,
      label: entry.label,
      whyNotRecommended:
        entry.action === "cancel_execution"
          ? "Cancellation is available, but it is more disruptive than the current recommended path."
          : entry.action === "retry_step"
            ? "Retry is possible, but the current persisted state still supports a cleaner review decision."
            : entry.action === "modify_resume"
              ? "Modify-and-resume changes step input and is higher touch than the default recommendation."
              : entry.action === "reject_resume"
                ? "Rejecting keeps the stop in place and is better when you want escalation rather than continuation."
                : "This action is available, but it is not the safest default for the current state.",
      riskLevel: entry.riskLevel || surface.riskLevel || "medium",
    }));
}

function buildTimeline(replay = null, snapshot = null) {
  if (replay?.ok) {
    return replay.data.timeline;
  }
  return (snapshot?.auditTimeline || []).map((entry) => ({
    id: entry.id,
    eventType: entry.eventType,
    stepId: entry.stepId,
    attemptNumber: null,
    createdAt: entry.createdAt,
    payload: entry.eventPayload,
  }));
}

function buildPlanFromSnapshot(planId, snapshot = null) {
  if (!snapshot?.execution) {
    return null;
  }

  const stages = Array.isArray(snapshot.stages) && snapshot.stages.length
    ? snapshot.stages.map((stage) => ({
        id: String(stage.id),
        name: stage.name || `Stage ${stage.sequence || 1}`,
        sequence: Number(stage.sequence || 0),
        status: stage.status,
        steps: (snapshot.steps || [])
          .filter((step) => String(step.stageId || "") === String(stage.id))
          .map((step) => ({
            id: String(step.id),
            action: step.kind || "step",
            payload: step.originalInput ?? step.normalizedInput ?? step.originalText ?? null,
            originalInput: step.originalInput ?? null,
            normalizedInput: step.normalizedInput ?? null,
            sequence: Number(step.sequence || 0),
            stageId: String(step.stageId || stage.id),
            metadata: {
              idempotent: String(step.idempotencyClass || "") === "safe_repeat",
              retryStrategy: String(step.idempotencyClass || "") === "safe_repeat" ? "safe" : "manual_only",
            },
          })),
      }))
    : [
        {
          id: "stage_1",
          name: "Recovered Stage",
          sequence: 1,
          steps: (snapshot.steps || []).map((step, index) => ({
            id: String(step.id),
            action: step.kind || "step",
            payload: step.originalInput ?? step.normalizedInput ?? step.originalText ?? null,
            originalInput: step.originalInput ?? null,
            normalizedInput: step.normalizedInput ?? null,
            sequence: Number(step.sequence || index + 1),
            stageId: step.stageId || "stage_1",
            metadata: {
              idempotent: String(step.idempotencyClass || "") === "safe_repeat",
              retryStrategy: String(step.idempotencyClass || "") === "safe_repeat" ? "safe" : "manual_only",
            },
          })),
        },
      ];

  return {
    id: String(planId),
    type: stages.length > 1 ? "multi" : "single",
    originalRequest: `Recovered operator action for ${planId}`,
    reviewStatus: "approved",
    currentStageExecutable: true,
    finalMode: "auto_execute",
    stages,
  };
}

function buildTimelineNarrative(surface = {}) {
  const currentFocus = surface.currentFocus || {};
  const timelineSummary = surface.timelineSummary || {};
  const lines = [];

  lines.push(`Execution is currently ${surface.status}.`);

  if (surface.timeline?.length) {
    lines.push(`Latest recorded event: ${timelineSummary.latestEventType || "unknown"}${timelineSummary.latestEventAt ? ` at ${timelineSummary.latestEventAt}` : ""}.`);
  }
  if (currentFocus.stage?.name) {
    lines.push(`Active stage: ${currentFocus.stage.name} (${currentFocus.stage.status || "unknown"}).`);
  }
  if (currentFocus.step?.id) {
    lines.push(`Active step: ${currentFocus.step.id}${currentFocus.step.action ? ` using ${currentFocus.step.action}` : ""}.`);
  }
  if (surface.whyPaused) {
    lines.push(`Pause reason: ${surface.whyPaused}`);
  }
  if (timelineSummary.failureCount) {
    lines.push(`Timeline includes ${timelineSummary.failureCount} failure-related event${timelineSummary.failureCount === 1 ? "" : "s"}.`);
  }

  return lines;
}

function normalizeEngineResult(result) {
  if (result?.ok) {
    return success(result);
  }
  return failure(
    result?.code || ERROR_CODES.INVALID_TRANSITION,
    result?.error || result?.message || "Operator recovery action failed.",
    {
      result,
    },
  );
}

function bestEffortAuditMirror(action, operatorId, planId, executionId, payload = {}) {
  try {
    appendAuditEvent({
      type: "operator_recovery",
      actor: "operator",
      eventType: action,
      message: `Operator ${operatorId} applied ${action} to ${planId}.`,
      payload: {
        planId,
        executionId,
        ...payload,
      },
    });
  } catch {}
}

function getOperatorRecoverySurface(planId) {
  if (!String(planId || "").trim()) {
    return failure(ERROR_CODES.EXECUTION_NOT_FOUND, "planId is required.");
  }

  const state = describeExecutionState(String(planId));
  if (!state.ok) {
    return failure(ERROR_CODES.REVIEW_SURFACE_UNAVAILABLE, state.message || "Execution state could not be described.");
  }

  const snapshot = loadLatestExecutionStateForPlan(String(planId));
  const replay = replayExecution(String(planId));
  const corruption = state.data.corrupted ? explainExecutionCorruption(String(planId)) : null;
  const executionId = snapshot?.execution?.id || state.data.activeLock?.executionId || null;
  const reviewSurface = executionId ? getReviewSurface(String(executionId)) : { pending_reviews: [], current_stage: null };
  const timeline = buildTimeline(replay, snapshot);
  const timelineSummary = summarizeTimeline(timeline);
  const riskLevel = deriveRiskLevel(snapshot, state.data);
  const currentFocus = buildCurrentFocus(snapshot, state.data);
  const sideEffectSafety = currentFocus.step?.sideEffectSafety || {
    class: "unknown",
    replaySafety: "manual_only",
    explanation: "Replay safety is not explicit, so operator review is the safe default.",
  };
  const surface = {
    planId: String(planId),
    executionId,
    status: mapSnapshotStatus(snapshot, state.data.checkpoint),
    rawStatus: {
      checkpoint: state.data.checkpoint?.status || null,
      execution: snapshot?.execution?.status || null,
    },
    whyPaused: deriveWhyPaused(snapshot, state.data),
    whatHappened: state.data.corrupted
      ? "Execution halted because integrity validation found a mismatch."
      : `Execution is ${mapSnapshotStatus(snapshot, state.data.checkpoint)} and waiting for an operator decision.`,
    recommendationContext: {
      pauseReason: deriveWhyPaused(snapshot, state.data),
      unresolvedIssues: state.data.issues.length,
      hasRecoveryQueue: Boolean((state.data.recoveryQueue || []).some((entry) => entry.resolvedAt == null)),
      hasIntegrityMismatch: Boolean(state.data.corrupted),
      sideEffectSafety,
    },
    currentState: {
      checkpoint: state.data.checkpoint,
      snapshot,
      activeLock: state.data.activeLock,
      recoveryQueue: state.data.recoveryQueue,
      diagnostics: state.data.diagnostics,
      reviewSurface,
    },
    currentFocus,
    riskLevel,
    timeline,
    timelineSummary,
    issues: state.data.issues,
    corruption: corruption?.ok ? corruption.data : null,
  };
  surface.safeActions = buildSafeActions(surface);
  surface.recommendedAction = recommendAction(surface);
  surface.recommendedAlternatives = summarizeRecommendedAlternatives(surface, surface.recommendedAction);
  surface.timelineNarrative = buildTimelineNarrative(surface);
  return success(surface);
}

function previewOperatorRecoveryAction(planId, action, options = {}) {
  const surface = getOperatorRecoverySurface(planId);
  if (!surface.ok) {
    return surface;
  }

  const selectedAction = String(action || "").trim().toLowerCase();
  const available = (surface.data.safeActions || []).find((entry) => entry.action === selectedAction) || null;
  if (!available) {
    return failure(ERROR_CODES.INVALID_TRANSITION, `Action ${action} is not currently safe for ${planId}.`, {
      surface: surface.data,
    });
  }

  return success({
    planId: String(planId),
    action: selectedAction,
    allowed: true,
    preview: {
      reasonRequired: Boolean(available.requiresReason),
      updatedInputRequired: Boolean(available.updatedInputRequired),
      lockTimeoutMs: LOCK_TIMEOUT_MS,
      willWrite: false,
      stateChanges: {
        checkpoint: selectedAction === "cancel_execution" ? "cancelled" : selectedAction === "retry_step" ? "paused" : "delegated_to_resume_execution",
        snapshot: selectedAction === "cancel_execution" ? "cancelled non-terminal work" : selectedAction === "retry_step" ? "reset target step to pending using original input" : "resume paused review flow",
        ledger: selectedAction === "cancel_execution" ? "execution.cancelled" : selectedAction === "retry_step" ? "operator.retry_requested" : "review / execution lifecycle events from existing engine",
      },
      whyRecommended: surface.data.recommendedAction?.action === selectedAction
        ? surface.data.recommendedAction.reason
        : null,
      alternativeSummary: surface.data.recommendedAlternatives || [],
    },
    surface: surface.data,
  });
}

async function applyOperatorRecoveryAction(planId, action, options = {}) {
  if (!String(planId || "").trim()) {
    return failure(ERROR_CODES.EXECUTION_NOT_FOUND, "planId is required.");
  }
  if (!String(options.idempotencyKey || "").trim()) {
    return failure(ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED, "Operator actions require an idempotency key.");
  }

  purgeExpiredOperatorActionIdempotency();
  const idempotencyKey = String(options.idempotencyKey);
  const actionName = String(action || "").trim().toLowerCase();
  const fingerprint = buildIdempotencyFingerprint(planId, actionName, options);
  const existingIdempotency = loadOperatorActionIdempotency(idempotencyKey);
  if (existingIdempotency) {
    if (String(existingIdempotency.requestFingerprint) !== fingerprint) {
      return failure(ERROR_CODES.INVALID_TRANSITION, "Idempotency key is already bound to a different operator action.");
    }
    return parseJson(existingIdempotency.responsePayload, failure(ERROR_CODES.INVALID_TRANSITION, "Stored idempotent response is invalid."));
  }

  const surface = getOperatorRecoverySurface(planId);
  if (!surface.ok) {
    return surface;
  }
  const available = (surface.data.safeActions || []).find((entry) => entry.action === actionName) || null;
  if (!available) {
    return failure(ERROR_CODES.INVALID_TRANSITION, `Action ${action} is not currently safe for ${planId}.`, {
      surface: surface.data,
    });
  }

  if (available.requiresReason && !String(options.reason || "").trim()) {
    return failure(ERROR_CODES.OPERATOR_REASON_REQUIRED, "Operator reason is required for this action.", {
      surface: surface.data,
    });
  }

  const snapshot = loadLatestExecutionStateForPlan(String(planId));
  if (!snapshot?.execution?.id) {
    return failure(ERROR_CODES.EXECUTION_NOT_FOUND, `Execution ${planId} was not found.`, {
      surface: surface.data,
    });
  }

  const executionId = String(snapshot.execution.id);
  const resumeDrivenAction = ["approve_resume", "modify_resume", "reject_resume"].includes(actionName);
  if (!resumeDrivenAction) {
    const lockResult = acquireOrReuseExecutionLock(String(planId), executionId);
    if (!lockResult.ok) {
      const response = failure(lockResult.code || ERROR_CODES.LOCK_CONFLICT, lockResult.message, {
        surface: surface.data,
      });
      storeOperatorActionIdempotency(idempotencyKey, planId, executionId, actionName, String(options.operatorId || "operator"), fingerprint, response);
      return response;
    }
  }

  let response;
  if (actionName === "approve_resume") {
    response = normalizeEngineResult(await resumeExecution(executionId, String(options.operatorId || "operator"), "approve"));
  } else if (actionName === "modify_resume") {
    if (!Object.prototype.hasOwnProperty.call(options, "updatedInput")) {
      response = failure(ERROR_CODES.INVALID_TRANSITION, "updatedInput is required for modify_resume.", {
        surface: surface.data,
      });
    } else {
      response = normalizeEngineResult(
        await resumeExecution(executionId, String(options.operatorId || "operator"), {
          action: "modify",
          updatedInput: options.updatedInput,
          reason: options.reason,
        })
      );
    }
  } else if (actionName === "reject_resume") {
    response = normalizeEngineResult(await resumeExecution(executionId, String(options.operatorId || "operator"), "reject"));
  } else if (actionName === "cancel_execution") {
    const transition = applyOperatorRecoveryActionTx(String(planId), executionId, {
      action: "cancel_execution",
      operatorId: String(options.operatorId || "operator"),
      reason: String(options.reason || ""),
    });
    response = transition.ok
      ? success({
          action: "cancel_execution",
          transition: transition.data,
          surface: getOperatorRecoverySurface(planId).data,
        })
      : failure(transition.code || ERROR_CODES.INVALID_TRANSITION, transition.message);
  } else if (actionName === "retry_step") {
    const transition = applyOperatorRecoveryActionTx(String(planId), executionId, {
      action: "retry_step",
      operatorId: String(options.operatorId || "operator"),
      reason: String(options.reason || ""),
      stepId: options.stepId == null ? null : String(options.stepId),
    });
    if (!transition.ok) {
      response = failure(transition.code || ERROR_CODES.INVALID_TRANSITION, transition.message, {
        surface: surface.data,
      });
    } else {
      const refreshedSnapshot = loadLatestExecutionStateForPlan(String(planId));
      const recoveredPlan = buildPlanFromSnapshot(String(planId), refreshedSnapshot);
      if (!recoveredPlan) {
        response = failure(ERROR_CODES.EXECUTION_NOT_FOUND, `Recovered plan ${planId} could not be reconstructed.`);
      } else {
        response = normalizeEngineResult(
          await recoverExecution(recoveredPlan, {
            executionMode: "auto_execute",
            controlApproved: true,
            triggerSource: "api",
          })
        );
      }
    }
  } else {
    response = failure(ERROR_CODES.INVALID_TRANSITION, `Unsupported operator action ${action}.`, {
      surface: surface.data,
    });
  }

  storeOperatorActionIdempotency(
    idempotencyKey,
    planId,
    executionId,
    actionName,
    String(options.operatorId || "operator"),
    fingerprint,
    response,
  );

  if (response.ok) {
    bestEffortAuditMirror(actionName, String(options.operatorId || "operator"), String(planId), executionId, {
      stepId: options.stepId == null ? null : String(options.stepId),
      reason: String(options.reason || ""),
    });
  }

  return response;
}

module.exports = {
  ERROR_CODES,
  LOCK_TIMEOUT_MS,
  OPERATOR_IDEMPOTENCY_TTL_MS,
  getOperatorRecoverySurface,
  previewOperatorRecoveryAction,
  applyOperatorRecoveryAction,
};
