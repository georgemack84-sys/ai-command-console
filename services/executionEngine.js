const toolRouter = require("./toolRouter");
const { appendAuditEvent } = require("./auditTrail");
const { getDatabaseNowIso, getDatabaseNowMs } = require("./stateDatabase");
const {
  countActiveExecutions,
  getResumableExecutions,
  loadExecutionCheckpoint,
  loadExecutionState,
  recoverExecutionState,
  setExecutionCheckpointStatus,
  startExecutionState,
} = require("./executionStateStore");
const {
  acquireExecutionLock,
  acquireOrReuseExecutionLock,
  appendLedgerEvent,
  cancelExecutionAttempt,
  completeExecutionAttempt,
  createExecutionAttempt,
  failExecutionAttempt,
  heartbeatExecutionAttempt,
  getActiveExecutionLock,
  listExecutionLocks,
  listLedgerEvents,
  listExecutionAttempts,
  releaseExecutionLock,
  workerId: executionWorkerId,
} = require("./executionIntegrityStore");
const {
  beginExecutionAttemptAtomic,
  completeExecutionAttemptAtomic,
  failExecutionAttemptAtomic,
  pauseBeforeExecutionForReviewAtomic,
  pauseExecutionAttemptForReviewAtomic,
} = require("./lifecycleAttemptAtomic");
const {
  finalizeExecution: finalizeExecutionAtomic,
  pauseExecutionForReview: pauseExecutionForReviewAtomic,
} = require("./lifecycleAtomic");
const {
  describeExecutionState,
  explainExecutionCorruption,
  reconcileExecutionState,
  validateExecutionIntegrity,
} = require("./executionReconciliation");
const {
  isExecutionAuthorized,
  normalizeMode,
  resolveSystemTimeoutSeconds,
  validateReviewedPlanForRouting,
} = require("./runtimeControl");
const { detectDependencyCycle, resolveDependencies } = require("./dependencyResolver");
const {
  createReviewRecord,
  defaultReviewSurfaceState,
  getReviewSurface,
  loadReviewSurfaceState,
  resolveReview,
  saveReviewSurfaceState,
} = require("./reviewSurface");
const {
  appendExecutionLog,
  commitRuntimeSnapshot,
  createStagedRun,
  detectAnomalies,
  enterSafeMode,
  enforceCapabilities,
  enforceIdempotency,
  evaluateApprovalThrottle,
  initializeExecutionOrchestration,
  loadExecutionRules,
  loadOrchestrationState,
  lockResources,
  normalizeExecutionMode,
  prepareStepForReview,
  recordRun,
  saveRuntimeCaches,
  setStageStatus,
  setStepStatus,
  startHeartbeat,
  stopHeartbeat,
  updateStep,
  validateExecutionRules,
} = require("./stepController");

function withTimeout(promise, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms.`)), timeoutMs);
    }),
  ]);
}

function nowIso() {
  return getDatabaseNowIso();
}

function nowMs() {
  return getDatabaseNowMs();
}

function generateExecutionId(seed = "run") {
  return `${seed}_${nowMs()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSideEffectClass(step = {}) {
  const explicit = String(
    step.sideEffectClass
    || step.metadata?.sideEffectClass
    || step.effectClass
    || ""
  ).trim().toLowerCase();
  if (explicit) {
    return explicit;
  }

  const actionClass = String(step.actionClass || step.action || step.kind || "").trim().toLowerCase();
  if (["read", "read_file", "list", "inspect", "query", "fetch"].includes(actionClass)) {
    return "pure_read";
  }
  if (["write", "write_file", "create", "update", "mutate", "edit"].includes(actionClass)) {
    return "local_write";
  }
  if (["delete", "remove", "destroy"].includes(actionClass)) {
    return "destructive";
  }
  if (["network", "http", "api_call", "plugin"].includes(actionClass)) {
    return "network_call";
  }
  if (["execute", "shell", "run_command"].includes(actionClass)) {
    return "external_write";
  }
  return "unknown";
}

function startAttemptHeartbeat(planId, executionId, stepId, attemptNumber, intervalMs) {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    return null;
  }
  const state = {
    lostLease: false,
    code: null,
    message: null,
  };
  const timer = setInterval(() => {
    const heartbeat = heartbeatExecutionAttempt(planId, executionId, stepId, attemptNumber);
    if (!heartbeat.ok) {
      state.lostLease = true;
      state.code = heartbeat.code || "LEASE_LOST";
      state.message = heartbeat.message || "Execution lease ownership changed while work was in flight.";
    }
  }, intervalMs);
  return { timer, state };
}

function stopTimer(timer) {
  if (timer?.timer) {
    clearInterval(timer.timer);
    return;
  }
  if (timer) {
    clearInterval(timer);
  }
}

function getLeaseLossSignal(planId, executionId, heartbeatMonitor = null) {
  if (!String(planId || "").trim() || !String(executionId || "").trim()) {
    return null;
  }

  if (heartbeatMonitor?.state?.lostLease) {
    return {
      reason: "lease_lost",
      error: String(
        heartbeatMonitor.state.message
        || "Execution lease ownership changed while work was in flight."
      ),
      code: String(heartbeatMonitor.state.code || "LEASE_LOST"),
    };
  }

  const activeLock = getActiveExecutionLock(planId);
  if (!activeLock.ok) {
    return {
      reason: "lease_lost",
      error: String(activeLock.message || "Execution lease could not be verified."),
      code: String(activeLock.code || "LEASE_CHECK_FAILED"),
    };
  }

  if (!activeLock.data) {
    return {
      reason: "lease_lost",
      error: "Execution lease was released while work was in flight.",
      code: "LEASE_LOST",
    };
  }

  if (
    String(activeLock.data.executionId || "") !== String(executionId)
    || String(activeLock.data.workerId || "") !== String(executionWorkerId || "")
  ) {
    return {
      reason: "lease_lost",
      error: "Execution lease ownership changed while work was in flight.",
      code: "LEASE_LOST",
    };
  }

  const state = loadExecutionState(executionId);
  const execution = state?.execution || null;
  if (
    execution
    && String(execution.leaseOwner || "").trim()
    && (
      String(execution.leaseOwner) !== String(executionWorkerId || "")
      || Number(execution.leaseExpiresAt || 0) <= nowMs()
    )
  ) {
    return {
      reason: "lease_lost",
      error: "Execution lease was no longer valid while work was in flight.",
      code: "LEASE_LOST",
    };
  }

  return null;
}

function shouldReleaseExecutionLock(result = {}) {
  if (result?.lockReleased) {
    return false;
  }
  const run = result?.run || null;
  if (result?.paused || result?.requiresReview) {
    return false;
  }
  if (run && ["paused", "safe_mode"].includes(String(run.globalState || ""))) {
    return false;
  }
  if (run && String(run.reviewStatus || "") === "pending") {
    return false;
  }
  return true;
}

function deriveIntegrityFailureCode(result = {}) {
  const issues = Array.isArray(result.issues) ? result.issues : [];
  if (issues.some((issue) => issue && issue.code === "CHECKPOINT_INVALID")) {
    return "CHECKPOINT_INVALID";
  }
  return result.code || "CORRUPTED";
}

function emitLedgerEvent(planId, executionId, eventType, payload = {}, extras = {}) {
  if (!String(planId || "").trim() || !String(executionId || "").trim() || !String(eventType || "").trim()) {
    return;
  }
  appendLedgerEvent({
    planId: String(planId),
    executionId: String(executionId),
    eventType: String(eventType),
    stepId: extras.stepId == null ? null : String(extras.stepId),
    attemptNumber: extras.attemptNumber == null ? null : Number(extras.attemptNumber),
    payload,
  });
}

function buildFallbackCorruptionDiagnostics(planId, issues = []) {
  return {
    planId: String(planId),
    checkpoint: null,
    activeLock: null,
    summary: {
      executionIds: [],
      terminalEventType: null,
      stageCount: 0,
      stepCount: 0,
      active: {
        checkpoint: null,
        snapshot: null,
        ledger: {
          stageId: null,
          stageEventType: null,
          stepId: null,
          stepEventType: null,
        },
      },
      stages: [],
      steps: [],
      snapshot: null,
    },
    snapshot: null,
    issues,
  };
}

function buildControlResponse(modes = {}) {
  return {
    executionMode: normalizeExecutionMode(modes.executionMode || "blocked"),
    decision: modes.controlDecision || null,
  };
}

function buildStatePayload(planId, plan = null) {
  if (!String(planId || "").trim()) {
    return {};
  }
  const state = describeExecutionState(String(planId), plan);
  return state.ok ? { state: state.data } : {};
}

function buildPersistenceFailureResult(run, result, planId = null) {
  const error = result?.error || "Execution persistence failed.";
  return {
    ok: false,
    error,
    code: result?.code || "DB_WRITE_FAILED",
    run: run
      ? {
          ...run,
          globalState: "error",
        }
      : run,
    ...(planId ? buildStatePayload(planId) : {}),
  };
}

function resolveAttemptPlanId(checkpointPlanId, run) {
  const candidate = checkpointPlanId || run?.planId || run?.runId;
  return String(candidate || "").trim();
}

function validateRuntimeRules() {
  const validation = validateExecutionRules(loadExecutionRules());
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.message,
      code: validation.code || "CONFIG_ERROR",
      issues: validation.issues || [],
    };
  }
  return validation;
}

function getPersistedExecutionMetrics(executionId) {
  if (!String(executionId || "").trim()) {
    return null;
  }
  const snapshot = loadExecutionState(String(executionId));
  return snapshot?.execution || null;
}

function hasLiveExecutionLease(execution = null) {
  return Boolean(
    execution
    && String(execution.leaseOwner || "").trim()
    && Number(execution.leaseExpiresAt || 0) > nowMs()
  );
}

function getExecutionContainmentBreach(executionId, rules) {
  const execution = getPersistedExecutionMetrics(executionId);
  if (!execution) {
    return null;
  }

  if (Number(execution.consecutiveFailures || 0) >= Number(rules.maxConsecutiveFailures || 0)) {
    return {
      type: "consecutive_failures_exceeded",
      message: "Execution failed after consecutive failure limit was exceeded.",
    };
  }
  if (Number(execution.noProgressAttempts || 0) >= Number(rules.noProgressAttemptLimit || 0)) {
    return {
      type: "no_forward_progress",
      message: "Execution paused because no forward progress was detected.",
    };
  }
  if (Number(execution.totalAttempts || 0) >= Number(rules.maxExecutionAttempts || 0)) {
    return {
      type: "max_attempts_exceeded",
      message: "Execution paused because the maximum attempt limit was exceeded.",
    };
  }
  return null;
}

function getExecutionTimingBreach(executionId, rules) {
  const execution = getPersistedExecutionMetrics(executionId);
  if (!execution) {
    return null;
  }

  const now = nowMs();
  const startedAtMs = execution.startedAt ? Date.parse(String(execution.startedAt)) : NaN;
  const lastProgressAtMs = execution.lastProgressAt ? Date.parse(String(execution.lastProgressAt)) : NaN;

  if (
    Number.isFinite(startedAtMs)
    && Number(rules.maxExecutionDurationMs || 0) > 0
    && now - startedAtMs >= Number(rules.maxExecutionDurationMs || 0)
  ) {
    return {
      type: "execution_timeout",
      message: "Execution paused because the execution timeout was exceeded.",
    };
  }

  if (
    Number.isFinite(lastProgressAtMs)
    && Number(rules.maxStepDurationMs || 0) > 0
    && now - lastProgressAtMs >= Number(rules.maxStepDurationMs || 0)
  ) {
    return {
      type: "no_forward_progress",
      message: "Execution paused because no forward progress was detected.",
    };
  }

  return null;
}

function pauseCheckpointedExecutionForReview(run, stage, step, stepIndex, reason, message, modes = {}, options = {}) {
  const pausedRun = {
    ...run,
    globalState: "paused",
    reviewStatus: "pending",
    requiresReview: true,
    stages: (run.stages || []).map((entry) =>
      String(entry.id) === String(stage?.id || "")
        ? {
            ...entry,
            status: "paused_for_review",
            pauseReason: String(reason),
            updatedAt: nowIso(),
          }
        : entry
    ),
    steps: (run.steps || []).map((entry) =>
      String(entry.id) === String(step?.id || "")
        ? {
            ...entry,
            pauseReason: String(reason),
            updatedAt: nowIso(),
          }
        : entry
    ),
  };

  const reviewRecord = buildReviewRecordForStep(
    pausedRun,
    (pausedRun.stages || []).find((entry) => String(entry.id) === String(stage?.id || "")) || stage,
    (pausedRun.steps || []).find((entry) => String(entry.id) === String(step?.id || "")) || step,
    pausedRun.executionMode,
    String(reason)
  );

  const pausedState = pauseBeforeExecutionForReviewAtomic({
    planId: options.checkpointPlanId || pausedRun.planId,
    executionId: options.executionId || pausedRun.runId,
    stepId: step.id,
    stageId: stage?.id || null,
    stepIndex,
    reason: String(reason),
    runSnapshot: pausedRun,
    reviewRecord,
  });
  if (!pausedState.ok) {
    return buildPersistenceFailureResult(pausedRun, {
      ok: false,
      error: pausedState.message,
      code: pausedState.code,
    }, options.checkpointPlanId || pausedRun.planId);
  }
  saveRuntimeCaches(pausedRun, reviewRecord, { globalState: "paused" });
  return buildPausedResponse(pausedRun, modes, reviewRecord, {
    error: message,
  });
}

function finalizeAtomicTerminalResult(run, finalStatus, options = {}, error = null, modes = {}) {
  const checkpointPlanId = String(options.checkpointPlanId || run?.planId || "");
  const executionId = String(options.executionId || run?.runId || "");
  if (!checkpointPlanId || !executionId) {
    return null;
  }

  const finalized = finalizeExecutionAtomic({
    executionId,
    finalStatus,
    ownerId: executionId,
    error,
    runSnapshot: run,
  });
  if (!finalized.ok) {
    return {
      ok: false,
      result: buildPersistenceFailureResult(run, {
        ok: false,
        error: finalized.message,
        code: finalized.code,
      }, checkpointPlanId),
    };
  }

  return {
    ok: true,
    result: {
      lockReleased: true,
      control: buildControlResponse(modes),
    },
  };
}

function finalizeResultWithReleasedLock(result, planId, executionId, modes = {}, plan = null) {
  const releaseResult = releaseExecutionLock(planId, executionId);
  if (releaseResult.ok) {
    return result;
  }
  return {
    ok: false,
    error: releaseResult.message,
    code: releaseResult.code,
    ...buildStatePayload(planId, plan),
    control: result?.control || buildControlResponse(modes),
  };
}

function finalizeFailureWithReleasedLock(result, planId, executionId, modes = {}, plan = null) {
  const releaseResult = releaseExecutionLock(planId, executionId);
  if (releaseResult.ok) {
    return result;
  }
  return {
    ok: false,
    error: releaseResult.message,
    code: releaseResult.code,
    ...buildStatePayload(planId, plan),
    control: result?.control || buildControlResponse(modes),
  };
}

function toRuntimeExecutionMode(mode = "blocked") {
  return normalizeExecutionMode(mode) === "safe_execute" ? "auto_execute" : normalizeMode(mode);
}

function buildVerifiedPlan(plan = {}, steps = [], executionMode = "blocked") {
  const planType = String(plan.type || plan.planType || (steps.length > 1 ? "multi" : "single"));
  if (planType === "single") {
    return {
      ...steps[0],
      type: "single",
      reviewStatus: plan.reviewStatus || "approved",
      finalMode: executionMode,
      currentStageExecutable: true,
      originalRequest: plan.originalRequest,
      actorRole: plan.actorRole,
    };
  }
  return {
    ...plan,
    type: planType,
    steps,
    reviewStatus: plan.reviewStatus || "approved",
    finalMode: executionMode,
    currentStageExecutable: true,
  };
}

function buildSafeAlternative(run) {
  const previewSteps = (run.steps || []).filter((step) => step.actionClass === "read");
  if (!previewSteps.length) {
    return null;
  }
  return buildVerifiedPlan(run, previewSteps, "simulate");
}

function buildQueuedReviewRecord(run, executionMode, reasonFlagged, suggestedAlternative = "") {
  const currentStage = (run.stages || []).find((stage) =>
    ["running", "paused_for_review", "pending"].includes(String(stage.status || ""))
  ) || null;
  return createReviewRecord(run.runId, run.steps, executionMode, {
    status: "pending",
    reasonFlagged,
    suggestedAlternative,
    currentStage: currentStage
      ? { id: currentStage.id, name: currentStage.name, status: currentStage.status }
      : null,
  });
}

function isPlanContainer(plan = {}) {
  return Array.isArray(plan.steps) || Array.isArray(plan.stages) || ["multi", "goal"].includes(String(plan.type || ""));
}

function resolveCheckpointPlanId(plan = {}) {
  if (plan.planId) {
    return String(plan.planId);
  }
  if (plan.runId) {
    return String(plan.runId);
  }
  if (plan.id && isPlanContainer(plan)) {
    return String(plan.id);
  }
  return `run_${nowMs()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCheckpointStep(step = {}, index = 0) {
  const metadata = step.metadata && typeof step.metadata === "object" ? step.metadata : {};
  const idempotent =
    metadata.idempotent === true
    || String(step.idempotencyClass || "").trim().toLowerCase() === "safe_repeat";

  return {
    id: String(step.id || `step_${index + 1}`),
    action: String(step.action || step.actionClass || step.tool || "step"),
    input: step.input ?? step.payload ?? step.normalizedInput ?? step.originalInput ?? step.command ?? null,
    metadata: {
      idempotent,
      retryStrategy:
        metadata.retryStrategy === "safe" || metadata.retryStrategy === "manual_only"
          ? metadata.retryStrategy
          : idempotent
            ? "safe"
            : "manual_only",
    },
  };
}

function normalizeCheckpointPlan(plan = {}) {
  const steps = Array.isArray(plan.stages)
    ? plan.stages.flatMap((stage) => (Array.isArray(stage.steps) ? stage.steps : []))
    : Array.isArray(plan.steps)
      ? plan.steps
      : plan.type === "single"
        ? [plan]
        : [];

  return {
    id: resolveCheckpointPlanId(plan),
    version: plan.version ?? plan.planVersion ?? plan.plannerVersion ?? null,
    steps: steps.map((step, index) => normalizeCheckpointStep(step, index)),
  };
}

function getCheckpointStepIndex(run, stepId) {
  return (run.steps || [])
    .sort((left, right) => Number(left.sequence || 0) - Number(right.sequence || 0))
    .findIndex((step) => step.id === stepId);
}

function applyCheckpointToRun(run, checkpoint, totalSteps) {
  const lastCompleted = Number(checkpoint.lastCompletedStepIndex);
  const currentStep = Number(checkpoint.currentStep);
  const sortedSteps = [...(run.steps || [])].sort((left, right) => Number(left.sequence || 0) - Number(right.sequence || 0));
  const activeCheckpointStep = currentStep >= 0 && currentStep < sortedSteps.length ? sortedSteps[currentStep] : null;
  const activeStageId = activeCheckpointStep?.stageId ? String(activeCheckpointStep.stageId) : null;

  let nextRun = {
    ...run,
    planId: checkpoint.planId,
    steps: (run.steps || []).map((step) => ({ ...step })),
    stages: (run.stages || []).map((stage) => ({ ...stage })),
  };

  for (let index = 0; index < sortedSteps.length; index += 1) {
    const stepId = sortedSteps[index].id;
    if (index <= lastCompleted) {
      nextRun = setStepStatus(nextRun, stepId, "completed", {
        reviewAcknowledged: true,
      });
      continue;
    }

    if (index === currentStep && checkpoint.status === "running") {
      nextRun = updateStep(nextRun, stepId, { status: "pending" });
      continue;
    }

    nextRun = updateStep(nextRun, stepId, { status: "pending" });
  }

  for (const stage of nextRun.stages || []) {
    const stageSteps = getStageSteps(nextRun, stage.id);
    if (stageSteps.length === 0) {
        nextRun = setStageStatus(nextRun, stage.id, "completed", {
        finishedAt: nowIso(),
      });
      continue;
    }
    if (stageSteps.every((step) => step.status === "completed")) {
      nextRun = setStageStatus(nextRun, stage.id, "completed", {
        finishedAt: nowIso(),
      });
      continue;
    }
    if (activeStageId && String(stage.id) === activeStageId && String(checkpoint.status || "") === "running") {
      nextRun = setStageStatus(nextRun, stage.id, "running", {
        finishedAt: null,
        pauseReason: null,
      });
      continue;
    }
    nextRun = setStageStatus(nextRun, stage.id, "pending", {
      finishedAt: null,
      pauseReason: null,
    });
  }

  if (checkpoint.status === "completed" || lastCompleted + 1 >= totalSteps) {
    return {
      ...nextRun,
      globalState: "idle",
      reviewStatus: "approved",
    };
  }

  if (checkpoint.status === "awaiting_review") {
    return {
      ...nextRun,
      globalState: "paused",
      reviewStatus: "pending",
    };
  }

  return {
    ...nextRun,
    globalState: "paused",
    reviewStatus: "approved",
  };
}

async function executeSingleRoutedStep(step, run, modes = {}, options = {}) {
  const rules = loadExecutionRules();
  const checkpointPlanId = String(options.checkpointPlanId || run.planId || run.runId || "");
  const executionId = String(options.executionId || run.runId || "");
  const sideEffectClass = normalizeSideEffectClass(step);
  const capabilityCheck = enforceCapabilities(step, rules);
  if (!capabilityCheck.ok) {
    const blockedRun = setStepStatus(run, step.id, "blocked", {
      error: capabilityCheck.error,
      errorType: "policy_block",
    });
    return {
      run: blockedRun,
      result: {
        ok: false,
        error: capabilityCheck.error,
        type: "policy_block",
        recoverable: false,
      },
    };
  }

  const idempotencyCheck = enforceIdempotency(step);
  if (!idempotencyCheck.ok) {
    if (idempotencyCheck.reviewRequired) {
      const pausedRun = setStepStatus(run, step.id, "paused_for_review", {
        pauseReason: idempotencyCheck.reason || "operator_review_required",
        error: idempotencyCheck.error,
        errorType: idempotencyCheck.code || "REVIEW_REQUIRED",
        updatedAt: nowIso(),
      });
      return {
        run: pausedRun,
        result: {
          ok: false,
          status: "paused_for_review",
          beforeStart: true,
          error: idempotencyCheck.error,
          reason: idempotencyCheck.reason || "operator_review_required",
          type: idempotencyCheck.code || "REVIEW_REQUIRED",
          recoverable: false,
        },
      };
    }
    const blockedRun = setStepStatus(run, step.id, "blocked", {
      error: idempotencyCheck.error,
      errorType: "rewrite_failure",
    });
    return {
      run: blockedRun,
      result: {
        ok: false,
        error: idempotencyCheck.error,
        type: "rewrite_failure",
        recoverable: false,
      },
    };
  }

  const attempt = checkpointPlanId
    ? beginExecutionAttemptAtomic({
        planId: checkpointPlanId,
        executionId,
        stepId: step.id,
        stepIndex: Number(options.stepIndex ?? -1),
        sideEffectClass,
      })
    : createExecutionAttempt({
        planId: resolveAttemptPlanId(checkpointPlanId, run),
        executionId,
        stepId: step.id,
        sideEffectClass,
      });
  if (!attempt.ok) {
    const failedRun = setStepStatus(run, step.id, "failed", {
      error: attempt.message,
      errorType: "integrity_failure",
    });
    return {
      run: failedRun,
      result: {
        ok: false,
        error: attempt.message,
        type: "integrity_failure",
        recoverable: false,
      },
    };
  }
  const attemptRecord = checkpointPlanId ? attempt.data.attempt : attempt.data;
  const attemptPlanId = resolveAttemptPlanId(checkpointPlanId, run);

  let nextRun = checkpointPlanId ? run : setStepStatus(run, step.id, "approved");
  const stepStartMs = nowMs();
  nextRun = setStepStatus(nextRun, step.id, "running", {
    startTime: stepStartMs,
    startedAt: stepStartMs,
    retries: Number(step.retries || 0),
  });

  const heartbeat = startHeartbeat(nextRun.runId, step.id, rules.heartbeatIntervalMs);
  const attemptHeartbeat = startAttemptHeartbeat(
    checkpointPlanId,
    executionId,
    step.id,
    attemptRecord.attemptNumber,
    Number(rules.leaseRenewalIntervalMs || rules.heartbeatIntervalMs),
  );
  try {
    const stepResult = await lockResources(step.resourceTargets || [], async () =>
      withTimeout(
        toolRouter.route(
          {
            ...step,
            reviewStatus: nextRun.reviewStatus || "approved",
            finalMode: "safe_execute",
            currentStageExecutable: true,
            originalRequest: nextRun.originalRequest,
            actorRole: nextRun.actorRole,
          },
          {
            ...modes,
            executionMode: toRuntimeExecutionMode("safe_execute"),
            controlApproved: true,
          }
        ),
        Math.min(
          Number(nextRun.timeoutMs || rules.defaultTimeoutMs),
          Number(rules.maxStepDurationMs || nextRun.timeoutMs || rules.defaultTimeoutMs)
        )
      )
    );
    stopHeartbeat(heartbeat);
    stopTimer(attemptHeartbeat);
    const leaseLoss = checkpointPlanId
      ? getLeaseLossSignal(checkpointPlanId, executionId, attemptHeartbeat)
      : null;
    if (leaseLoss) {
      nextRun = setStepStatus(nextRun, step.id, "paused_for_review", {
        pauseReason: leaseLoss.reason,
        error: leaseLoss.error,
        errorType: leaseLoss.code,
        updatedAt: nowIso(),
      });
      return {
        run: nextRun,
        result: {
          ok: false,
          status: "paused_for_review",
          error: leaseLoss.error,
          reason: leaseLoss.reason,
          type: leaseLoss.code,
          recoverable: false,
          attemptNumber: attemptRecord.attemptNumber,
        },
      };
    }
    if (stepResult && typeof stepResult === "object" && stepResult.status === "paused_for_review") {
      const cancelledAttempt = checkpointPlanId
        ? { ok: true }
        : cancelExecutionAttempt(
            attemptPlanId,
            executionId,
            step.id,
            attemptRecord.attemptNumber,
            { reason: String(stepResult.reason || "step_requested_review") },
          );
      if (!cancelledAttempt.ok) {
        return {
          run: nextRun,
          result: {
            ok: false,
            error: cancelledAttempt.message,
            code: cancelledAttempt.code,
            type: "persistence_failure",
            recoverable: false,
          },
        };
      }
      nextRun = setStepStatus(nextRun, step.id, "paused_for_review", {
        pauseReason: String(stepResult.reason || "step_requested_review"),
      });
      return {
        run: nextRun,
        result: {
          ...stepResult,
          attemptNumber: attemptRecord.attemptNumber,
        },
      };
    }
    if (stepResult && typeof stepResult === "object" && (stepResult.ok === false || stepResult.error)) {
      const message = String(stepResult.error || "Step executor returned an error result.");
      const stepEndMs = nowMs();
      const failedAttempt = checkpointPlanId
        ? failExecutionAttemptAtomic({
            planId: checkpointPlanId,
            executionId,
            stepId: step.id,
            stepIndex: Number(options.stepIndex ?? -1),
            attemptNumber: attemptRecord.attemptNumber,
            errorPayload: {
              error: message,
              type: String(stepResult.type || "execution_failure"),
            },
          })
        : failExecutionAttempt(
            attemptPlanId,
            executionId,
            step.id,
            attemptRecord.attemptNumber,
            {
              error: message,
              type: String(stepResult.type || "execution_failure"),
            },
          );
      if (!failedAttempt.ok) {
        return {
          run: nextRun,
          result: {
            ok: false,
            error: failedAttempt.message,
            code: failedAttempt.code,
            type: "persistence_failure",
            recoverable: false,
          },
        };
      }
      nextRun = setStepStatus(nextRun, step.id, "failed", {
        endTime: stepEndMs,
        duration: Math.max(0, stepEndMs - Number(step.startedAt || stepStartMs)),
        error: message,
        errorType: String(stepResult.type || "execution_failure"),
        lastHeartbeatAt: stepEndMs,
      });
      if (checkpointPlanId) {
        const containmentBreach = getExecutionContainmentBreach(executionId, rules);
        if (containmentBreach) {
          return {
            run: nextRun,
            result: {
              ok: false,
              error: containmentBreach.message,
              type: containmentBreach.type,
              recoverable: false,
            },
          };
        }
      }
      return {
        run: nextRun,
        result: {
          ok: false,
          error: message,
          type: String(stepResult.type || "execution_failure"),
          recoverable: false,
        },
      };
    }
    const stepEndMs = nowMs();
    const completedAttempt = checkpointPlanId
      ? completeExecutionAttemptAtomic({
          planId: checkpointPlanId,
          executionId,
          stepId: step.id,
          stepIndex: Number(options.stepIndex ?? -1),
          totalSteps: Number(options.totalSteps || (nextRun.steps || []).length || 0),
          attemptNumber: attemptRecord.attemptNumber,
          resultPayload: stepResult,
        })
      : completeExecutionAttempt(
          attemptPlanId,
          executionId,
          step.id,
          attemptRecord.attemptNumber,
          stepResult,
        );
    if (!completedAttempt.ok) {
      return {
        run: nextRun,
        result: {
          ok: false,
          error: completedAttempt.message,
          code: completedAttempt.code,
          type: "persistence_failure",
          recoverable: false,
        },
      };
    }
    nextRun = setStepStatus(nextRun, step.id, "completed", {
      endTime: stepEndMs,
      duration: Math.max(0, stepEndMs - Number(step.startedAt || stepStartMs)),
      result: typeof stepResult === "string" ? stepResult : JSON.stringify(stepResult),
      lastHeartbeatAt: stepEndMs,
    });
    return { run: nextRun, result: stepResult };
  } catch (error) {
    stopHeartbeat(heartbeat);
    stopTimer(attemptHeartbeat);
    const message = error instanceof Error ? error.message : String(error);
    const timeout = /timed out/i.test(message);
    const stepEndMs = nowMs();
    const failedAttempt = checkpointPlanId
      ? failExecutionAttemptAtomic({
          planId: checkpointPlanId,
          executionId,
          stepId: step.id,
          stepIndex: Number(options.stepIndex ?? -1),
          attemptNumber: attemptRecord.attemptNumber,
          errorPayload: {
            error: message,
            type: timeout ? "timeout" : "execution_failure",
          },
        })
      : failExecutionAttempt(
          attemptPlanId,
          executionId,
          step.id,
          attemptRecord.attemptNumber,
          {
            error: message,
            type: timeout ? "timeout" : "execution_failure",
          },
        );
    if (!failedAttempt.ok) {
      return {
        run: nextRun,
        result: {
          ok: false,
          error: failedAttempt.message,
          code: failedAttempt.code,
          type: "persistence_failure",
          recoverable: false,
        },
      };
    }
    nextRun = setStepStatus(nextRun, step.id, timeout ? "timeout" : "failed", {
      endTime: stepEndMs,
      duration: Math.max(0, stepEndMs - Number(step.startedAt || stepStartMs)),
      error: message,
      errorType: timeout ? "timeout" : "execution_failure",
      lastHeartbeatAt: stepEndMs,
    });
    if (checkpointPlanId) {
      const containmentBreach = getExecutionContainmentBreach(executionId, rules);
      if (containmentBreach) {
        return {
          run: nextRun,
          result: {
            ok: false,
            error: containmentBreach.message,
            type: containmentBreach.type,
            recoverable: false,
          },
        };
      }
    }
    return {
      run: nextRun,
      result: {
        ok: false,
        error: message,
        type: timeout ? "timeout" : "execution_failure",
        recoverable: !timeout && Number(step.retries || 0) < Number(rules.maxRetries || 0),
      },
    };
  }
}

function getStageSteps(run, stageId) {
  return (run.steps || []).filter((step) => step.stageId === stageId);
}

function getCurrentStage(run) {
  return (run.stages || []).find((stage) =>
    ["running", "paused_for_review", "pending"].includes(String(stage.status || ""))
  ) || null;
}

function getPersistedResumeState(executionId) {
  const persisted = loadExecutionState(executionId);
  if (!persisted?.execution) {
    return {
      persisted,
      currentStage: null,
      pausedStep: null,
    };
  }

  const currentStage = (persisted.stages || []).find((stage) =>
    ["running", "paused_for_review", "pending"].includes(String(stage.status || ""))
  ) || null;
  const pausedStep = (persisted.steps || []).find((step) =>
    String(step.status || "") === "paused_for_review"
    || (currentStage && String(step.stageId || "") === String(currentStage.id || "") && Boolean(step.pauseReason))
  ) || null;

  return {
    persisted,
    currentStage,
    pausedStep,
  };
}

function mapPersistedExecutionStatusToRunState(status, fallbackGlobalState = "idle") {
  switch (String(status || "")) {
    case "running":
      return "running";
    case "paused":
    case "paused_for_review":
      return "paused";
    case "completed":
      return "idle";
    case "failed":
    case "cancelled":
      return "error";
    default:
      return fallbackGlobalState;
  }
}

function hydrateRunFromPersistedState(storedRun, persistedState) {
  const persistedExecution = persistedState?.persisted?.execution || null;
  const persistedStages = new Map(
    (persistedState?.persisted?.stages || []).map((stage) => [String(stage.id), stage]),
  );
  const persistedSteps = new Map(
    (persistedState?.persisted?.steps || []).map((step) => [String(step.id), step]),
  );

  const nextRun = {
    ...storedRun,
    globalState: mapPersistedExecutionStatusToRunState(persistedExecution?.status, storedRun.globalState),
    reviewStatus: persistedExecution?.requiresReview ? "pending" : storedRun.reviewStatus,
    createdAt: persistedExecution?.createdAt || storedRun.createdAt,
    startedAt: persistedExecution?.startedAt || storedRun.startedAt,
    finishedAt: persistedExecution?.finishedAt ?? storedRun.finishedAt ?? null,
    cancelledAt: persistedExecution?.cancelledAt ?? storedRun.cancelledAt ?? null,
    leaseOwner: persistedExecution?.leaseOwner ?? storedRun.leaseOwner ?? null,
    leaseExpiresAt: persistedExecution?.leaseExpiresAt ?? storedRun.leaseExpiresAt ?? null,
    totalAttempts: Number(persistedExecution?.totalAttempts ?? storedRun.totalAttempts ?? 0),
    consecutiveFailures: Number(persistedExecution?.consecutiveFailures ?? storedRun.consecutiveFailures ?? 0),
    noProgressAttempts: Number(persistedExecution?.noProgressAttempts ?? storedRun.noProgressAttempts ?? 0),
    lastProgressAt: persistedExecution?.lastProgressAt ?? storedRun.lastProgressAt ?? null,
    updatedAt: persistedExecution?.lastUpdatedAt || storedRun.updatedAt,
    stages: (storedRun.stages || []).map((stage) => {
      const persistedStage = persistedStages.get(String(stage.id));
      if (!persistedStage) {
        return stage;
      }
      return {
        ...stage,
        status: persistedStage.status || stage.status,
        pauseReason: persistedStage.pauseReason ?? stage.pauseReason ?? null,
        startedAt: persistedStage.startedAt ?? stage.startedAt ?? null,
        finishedAt: persistedStage.finishedAt ?? stage.finishedAt ?? null,
        lastUpdatedAt: persistedStage.lastUpdatedAt ?? stage.lastUpdatedAt ?? null,
        requiresReview: persistedStage.requiresReview ?? stage.requiresReview ?? false,
      };
    }),
    steps: (storedRun.steps || []).map((step) => {
      const persistedStep = persistedSteps.get(String(step.id));
      if (!persistedStep) {
        return step;
      }
      return {
        ...step,
        status: persistedStep.status || step.status,
        pauseReason: persistedStep.pauseReason ?? step.pauseReason ?? null,
        rewriteReason: persistedStep.rewriteReason ?? step.rewriteReason ?? null,
        blockReason: persistedStep.blockReason ?? step.blockReason ?? null,
        normalizationNote: persistedStep.normalizationNote ?? step.normalizationNote ?? null,
        reviewAcknowledged: persistedStep.reviewAcknowledged ?? step.reviewAcknowledged ?? false,
        requiresReview:
          String(persistedStep.status || "") === "paused_for_review"
          || Boolean(persistedStep.pauseReason)
          || Boolean(step.requiresReview),
        startedAt: persistedStep.startedAt ?? step.startedAt ?? null,
        finishedAt: persistedStep.finishedAt ?? step.finishedAt ?? null,
        errorCode: persistedStep.errorCode ?? step.errorCode ?? null,
        errorMessage: persistedStep.errorMessage ?? step.errorMessage ?? null,
      };
    }),
  };

  return nextRun;
}

function mergeStepWithPersistedState(step = {}, persistedStep = {}) {
  return {
    ...step,
    ...persistedStep,
    id: String(persistedStep.id || step.id || ""),
    action: step.action || step.actionClass || persistedStep.action || persistedStep.kind || "step",
    payload: Object.prototype.hasOwnProperty.call(step, "payload") ? step.payload : persistedStep.originalInput ?? persistedStep.normalizedInput ?? null,
    stageId: persistedStep.stageId || step.stageId || null,
    status: persistedStep.status || step.status || "pending",
    sequence: Number.isFinite(Number(persistedStep.sequence)) ? Number(persistedStep.sequence) : Number(step.sequence || 0),
    requiresReview: Boolean(
      step.requiresReview
      || persistedStep.requiresReview
      || String(persistedStep.status || "") === "paused_for_review"
      || persistedStep.pauseReason,
    ),
    reviewAcknowledged: persistedStep.reviewAcknowledged ?? step.reviewAcknowledged ?? false,
    pauseReason: persistedStep.pauseReason ?? step.pauseReason ?? null,
  };
}

function buildRecoveryPlanFromPersistedState(plan = {}, persistedExecutionState = null) {
  if (!persistedExecutionState?.execution) {
    return plan;
  }

  const incomingStages = Array.isArray(plan.stages) ? plan.stages : [];
  const incomingSteps = Array.isArray(plan.steps) ? plan.steps : [];
  const persistedStages = Array.isArray(persistedExecutionState.stages) ? persistedExecutionState.stages : [];
  const persistedSteps = Array.isArray(persistedExecutionState.steps) ? persistedExecutionState.steps : [];
  const incomingStepsById = new Map(incomingSteps.map((step) => [String(step.id || ""), step]));

  if (!persistedStages.length) {
    return {
      ...plan,
      reviewStatus: persistedExecutionState.execution.requiresReview ? "pending" : plan.reviewStatus,
      steps: incomingSteps.map((step) => mergeStepWithPersistedState(step, persistedSteps.find((entry) => String(entry.id || "") === String(step.id || "")) || {})),
    };
  }

  const incomingStagesById = new Map(incomingStages.map((stage) => [String(stage.id || ""), stage]));
  const mergedStages = persistedStages.map((persistedStage) => {
    const stageId = String(persistedStage.id || "");
    const incomingStage = incomingStagesById.get(stageId) || null;
    const stageSteps = persistedSteps
      .filter((step) => String(step.stageId || "") === stageId)
      .sort((left, right) => Number(left.sequence || 0) - Number(right.sequence || 0))
      .map((persistedStep) => mergeStepWithPersistedState(
        incomingStage?.steps?.find((step) => String(step.id || "") === String(persistedStep.id || ""))
        || incomingStepsById.get(String(persistedStep.id || ""))
        || {},
        persistedStep,
      ));

    return {
      ...(incomingStage || {}),
      id: stageId,
      name: persistedStage.name || incomingStage?.name || "Stage",
      sequence: Number.isFinite(Number(persistedStage.sequence)) ? Number(persistedStage.sequence) : Number(incomingStage?.sequence || 0),
      status: persistedStage.status || incomingStage?.status || "pending",
      requiresReview: persistedStage.requiresReview ?? incomingStage?.requiresReview ?? false,
      pauseReason: persistedStage.pauseReason ?? incomingStage?.pauseReason ?? null,
      steps: stageSteps,
    };
  });

  return {
    ...plan,
    reviewStatus: persistedExecutionState.execution.requiresReview ? "pending" : plan.reviewStatus,
    stages: mergedStages,
  };
}

function getLatestPersistedExecutionState(planId) {
  const resumableExecutions = getResumableExecutions();
  const latestExecution = resumableExecutions.find((entry) => String(entry.planId || "") === String(planId || ""));
  if (!latestExecution?.id) {
    return null;
  }
  const persisted = loadExecutionState(String(latestExecution.id));
  return persisted?.execution ? persisted : null;
}

function mapRecoveryPreflightFailure(code, message, checkpointPlan, checkpoint, executionId, extras = {}, modes = {}) {
  return {
    ok: true,
    data: {
      eligible: false,
      reason: String(code || "RECOVERY_INELIGIBLE"),
      code: String(code || "RECOVERY_INELIGIBLE"),
      message: String(message || "Execution is not eligible for deterministic recovery."),
      checkpoint: checkpoint || null,
      nextStep: null,
      executionId: executionId == null ? null : String(executionId),
      ...extras,
      ...(checkpointPlan?.id ? buildStatePayload(checkpointPlan.id, checkpointPlan) : {}),
      control: buildControlResponse(modes),
    },
  };
}

function runRecoveryPreflight(plan, modes = {}) {
  const rulesValidation = validateRuntimeRules();
  if (!rulesValidation.ok) {
    return {
      ok: false,
      error: rulesValidation.error,
      code: rulesValidation.code,
      issues: rulesValidation.issues,
      control: buildControlResponse(modes),
    };
  }

  const checkpointPlan = normalizeCheckpointPlan(plan);
  if (!checkpointPlan.id) {
    return {
      ok: false,
      error: "Execution plan requires an id for recovery.",
      code: "INVALID_STATE",
      control: buildControlResponse(modes),
    };
  }

  const persistedExecutionState = getLatestPersistedExecutionState(checkpointPlan.id);
  const checkpointResult = loadExecutionCheckpoint(checkpointPlan.id);
  if (!checkpointResult.ok) {
    return {
      ok: false,
      error: checkpointResult.message,
      code: checkpointResult.code,
      control: buildControlResponse(modes),
    };
  }
  const checkpoint = checkpointResult.data || null;

  const existingLocks = listExecutionLocks(checkpointPlan.id);
  if (!existingLocks.ok) {
    return {
      ok: false,
      error: existingLocks.message,
      code: existingLocks.code,
      control: buildControlResponse(modes),
    };
  }

  const activeLock = existingLocks.data.find((entry) => entry.lockReleasedAt == null) || null;
  const executionId = String(
    activeLock?.executionId
    || persistedExecutionState?.execution?.id
    || plan.runId
    || generateExecutionId("recover"),
  );

  if (!checkpoint && !persistedExecutionState?.execution) {
    return mapRecoveryPreflightFailure(
      "EXECUTION_NOT_FOUND",
      "Execution does not have persisted checkpoint or execution state for recovery.",
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  if (
    String(persistedExecutionState?.execution?.status || "") === "running"
    && hasLiveExecutionLease(persistedExecutionState?.execution)
  ) {
    return mapRecoveryPreflightFailure(
      "EXECUTION_ACTIVE",
      "Execution is still active and its execution lease has not expired.",
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  if (activeLock) {
    const attempts = listExecutionAttempts(checkpointPlan.id, executionId);
    if (!attempts.ok) {
      return {
        ok: false,
        error: attempts.message,
        code: attempts.code,
        control: buildControlResponse(modes),
      };
    }
    const hasActiveLease = attempts.data.some(
      (attempt) => attempt.status === "running" && Number(attempt.leaseExpiresAt || 0) > nowMs(),
    );
    if (hasActiveLease) {
      return mapRecoveryPreflightFailure(
        "EXECUTION_ACTIVE",
        "Execution is still active and its running attempt lease has not expired.",
        checkpointPlan,
        checkpoint,
        executionId,
        {},
        modes,
      );
    }
  }

  const integrityValidation = validateExecutionIntegrity(checkpointPlan.id, checkpointPlan);
  if (!integrityValidation.ok) {
    const explanation = explainExecutionCorruption(checkpointPlan.id, checkpointPlan);
    const diagnostics =
      integrityValidation.diagnostics
      || (explanation.ok ? explanation.data.diagnostics : null)
      || buildFallbackCorruptionDiagnostics(checkpointPlan.id, integrityValidation.issues || []);
    const corruption = explanation.ok
      ? explanation.data
      : {
          planId: checkpointPlan.id,
          corrupted: true,
          issues: integrityValidation.issues || [],
          diagnostics,
        };

    return mapRecoveryPreflightFailure(
      deriveIntegrityFailureCode(integrityValidation),
      integrityValidation.message,
      checkpointPlan,
      checkpoint,
      executionId,
      {
        issues: integrityValidation.issues || [],
        diagnostics,
        corruption,
      },
      modes,
    );
  }

  const checkpointStatus = String(checkpoint?.status || "").trim().toLowerCase();
  if (["completed", "failed", "cancelled", "execution_abandoned", "corrupted"].includes(checkpointStatus)) {
    return mapRecoveryPreflightFailure(
      "EXECUTION_TERMINAL",
      `Execution checkpoint is already ${checkpointStatus}.`,
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  if (["awaiting_review", "pause_for_operator_recovery"].includes(checkpointStatus)) {
    return mapRecoveryPreflightFailure(
      "MANUAL_REVIEW_REQUIRED",
      "Execution requires review or operator action before deterministic recovery can continue.",
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  if (
    checkpointStatus === "paused"
    && (
      persistedExecutionState?.execution?.requiresReview === true
      || String(persistedExecutionState?.execution?.status || "").trim().toLowerCase() === "paused_for_review"
    )
  ) {
    return mapRecoveryPreflightFailure(
      "MANUAL_REVIEW_REQUIRED",
      "Execution is paused for review and requires operator action before deterministic recovery can continue.",
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  const timingBreach = getExecutionTimingBreach(executionId, loadExecutionRules());
  if (timingBreach) {
    return mapRecoveryPreflightFailure(
      timingBreach.type,
      timingBreach.message,
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  const containmentBreach = getExecutionContainmentBreach(executionId, loadExecutionRules());
  if (containmentBreach) {
    return mapRecoveryPreflightFailure(
      containmentBreach.type,
      containmentBreach.message,
      checkpointPlan,
      checkpoint,
      executionId,
      {},
      modes,
    );
  }

  const nextStepIndex = Number.isFinite(Number(checkpoint?.currentStep)) ? Number(checkpoint.currentStep) : 0;
  const nextStep = checkpointPlan.steps[nextStepIndex] || null;

  return {
    ok: true,
    data: {
      eligible: true,
      checkpointPlan,
      persistedExecutionState,
      checkpoint,
      existingLocks: existingLocks.data,
      activeLock,
      executionId,
      nextStep,
      state: checkpointPlan.id ? buildStatePayload(checkpointPlan.id, checkpointPlan).state || null : null,
      control: buildControlResponse(modes),
    },
  };
}

async function preflightRecovery(plan, modes = {}) {
  const result = runRecoveryPreflight(plan, modes);
  if (!result.ok) {
    return result;
  }

  const data = result.data || {};
  return {
    ok: true,
    data: {
      eligible: Boolean(data.eligible),
      reason: data.eligible ? null : data.reason || data.code || "RECOVERY_INELIGIBLE",
      code: data.eligible ? null : data.code || data.reason || "RECOVERY_INELIGIBLE",
      message: data.eligible ? null : data.message || "Execution is not eligible for deterministic recovery.",
      checkpoint: data.checkpoint || null,
      nextStep: data.nextStep || null,
      executionId: data.executionId == null ? null : String(data.executionId),
      ...(data.state ? { state: data.state } : {}),
      control: data.control || buildControlResponse(modes),
    },
  };
}

function validateResumeStateConsistency(storedRun, persistedState) {
  if (!persistedState?.persisted?.execution) {
    return {
      ok: false,
      code: "CORRUPTED",
      error: "Persisted execution snapshot is missing for this paused run.",
    };
  }

  const persistedStatus = String(persistedState.persisted.execution.status || "");
  if (!["paused", "paused_for_review"].includes(persistedStatus)) {
    return {
      ok: false,
      code: "CORRUPTED",
      error: `Persisted execution snapshot is ${persistedStatus || "unknown"} instead of paused for review.`,
    };
  }

  if (!persistedState.currentStage || !persistedState.pausedStep) {
    return {
      ok: false,
      code: "CORRUPTED",
      error: "Persisted execution snapshot does not contain a resumable paused review step.",
    };
  }

  const hydratedRun = hydrateRunFromPersistedState(storedRun, persistedState);
  const hydratedStage = (hydratedRun.stages || []).find((stage) => String(stage.id) === String(persistedState.currentStage.id)) || null;
  const hydratedPausedStep = (hydratedRun.steps || []).find((step) => String(step.id) === String(persistedState.pausedStep.id)) || null;

  if (!hydratedStage || !hydratedPausedStep) {
    return {
      ok: false,
      code: "CORRUPTED",
      error: "Persisted paused execution state cannot be mapped back onto orchestration state.",
    };
  }

  if (String(hydratedPausedStep.stageId || "") !== String(hydratedStage.id || "")) {
    return {
      ok: false,
      code: "CORRUPTED",
      error: "Persisted paused step does not belong to the persisted current stage.",
    };
  }

  return {
    ok: true,
    run: hydratedRun,
    currentStage: hydratedStage,
    pausedStep: hydratedPausedStep,
  };
}

function buildReviewRecordForStep(run, stage, step, executionMode, reasonFlagged, suggestedAlternative = "") {
  return createReviewRecord(run.runId, [step], executionMode, {
    status: "pending",
    reasonFlagged,
    suggestedAlternative,
    currentStage: stage
      ? { id: stage.id, name: stage.name, status: stage.status }
      : null,
    pendingReviews: [
      {
        step_id: step.id,
        issue_type: step.blockReason
          ? "blocked"
          : step.deferred
            ? "deferred"
            : step.rewriteReason
              ? "rewrite"
              : "risk",
        explanation: step.blockReason || step.pauseReason || step.rewriteReason || step.normalizationNote || reasonFlagged,
        suggested_action: step.blockReason ? "reject" : step.rewriteReason ? "modify" : "approve",
      },
    ],
  });
}

function stagePendingReviewSurface(reviewRecord) {
  const state = loadReviewSurfaceState() || defaultReviewSurfaceState();
  saveReviewSurfaceState({
    ...state,
    updatedAt: nowIso(),
    reviews: [
      reviewRecord,
      ...(Array.isArray(state.reviews) ? state.reviews : []),
    ],
  });
}

function buildPausedResponse(run, modes = {}, reviewRecord = null, extras = {}) {
  return {
    ok: false,
    requiresReview: true,
    paused: true,
    run,
    reviewSurface: getReviewSurface(run.runId),
    control: buildControlResponse(modes),
    ...extras,
    ...(reviewRecord ? { review: reviewRecord } : {}),
  };
}

function finalizeCheckpointedTerminalFailure(run, error, options = {}, modes = {}, extras = {}) {
  const atomicFailure = finalizeAtomicTerminalResult(
    run,
    "failed",
    options,
    error,
    modes,
  );
  if (!atomicFailure.ok) {
    return {
      ok: false,
      error,
      run,
      ...extras,
      ...atomicFailure.result,
    };
  }
  return {
    ok: false,
    error,
    run,
    ...extras,
    ...atomicFailure.result,
  };
}

async function continueExecution(run, modes = {}, options = {}) {
  if (!Array.isArray(run.stages) || run.stages.length === 0) {
    return {
      ok: false,
      error: "Execution plan has zero stages.",
      run,
      control: buildControlResponse(modes),
    };
  }

  const rules = loadExecutionRules();
  let nextRun = run;
  let finalResult = options.finalResult;
  if (!options.resumed) {
    nextRun = appendExecutionLog(nextRun, {
      eventType: "review_stage",
      status: "awaiting_review",
      timestamp: nowMs(),
    });
    nextRun = appendExecutionLog(
      {
        ...nextRun,
        globalState: "running",
        reviewStatus: "approved",
      },
      {
        eventType: "execution_start",
        status: "running",
        timestamp: nowMs(),
      }
    );
    emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "execution.started", {
      status: "running",
    });
  }

  const orderedStageIds = [...(nextRun.stages || [])]
    .sort((left, right) => Number(left.sequence || 0) - Number(right.sequence || 0))
    .map((stage) => stage.id);

  for (const stageId of orderedStageIds) {
    const refreshedStage = (nextRun.stages || []).find((entry) => entry.id === stageId);
    if (!refreshedStage) {
      continue;
    }
    if (["completed", "failed"].includes(String(refreshedStage.status || ""))) {
      if (refreshedStage.status === "failed") {
        return {
          ok: false,
          error: "Stage failed before downstream stages could run.",
          run: nextRun,
          control: buildControlResponse(modes),
        };
      }
      continue;
    }

    const stageSteps = getStageSteps(nextRun, refreshedStage.id)
      .sort((left, right) => Number(left.stageSequence || left.sequence || 0) - Number(right.stageSequence || right.sequence || 0));

    if (stageSteps.length === 0) {
      nextRun = setStageStatus(nextRun, refreshedStage.id, "completed", {
        startedAt: refreshedStage.startedAt || nowIso(),
        finishedAt: nowIso(),
      });
      emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "stage.completed", {
        stageId: refreshedStage.id,
        status: "completed",
        name: refreshedStage.name || null,
      });
      continue;
    }

    nextRun = setStageStatus(nextRun, refreshedStage.id, "running", {
      startedAt: refreshedStage.startedAt || nowIso(),
      resumed: Boolean(options.resumed && options.resumeStageId === refreshedStage.id),
    });
    emitLedgerEvent(
      options.checkpointPlanId || nextRun.planId,
      options.executionId || nextRun.runId,
      options.resumed && options.resumeStageId === refreshedStage.id ? "stage.resumed" : "stage.started",
      {
        stageId: refreshedStage.id,
        status: "running",
        name: refreshedStage.name || null,
      },
    );

    const stageStepIds = new Set(stageSteps.map((step) => step.id));
    const missingDependency = stageSteps.find((step) =>
      (step.dependsOn || []).some((dependencyId) => stageStepIds.has(dependencyId) === false && !(nextRun.steps || []).some((candidate) => candidate.id === dependencyId && candidate.status === "completed"))
    );
    if (missingDependency) {
      nextRun = setStepStatus(nextRun, missingDependency.id, "failed", {
        errorType: "dependency_failure",
        error: `Missing dependency ${missingDependency.dependsOn.find((dependencyId) => !stageStepIds.has(dependencyId))}.`,
        blockReason: "dependency_failure",
      });
      nextRun = setStageStatus(nextRun, refreshedStage.id, "failed", {
        pauseReason: "dependency_failure",
        finishedAt: nowIso(),
      });
      emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "stage.failed", {
        stageId: refreshedStage.id,
        status: "failed",
        reason: "dependency_failure",
      });
      nextRun = appendExecutionLog(
        {
          ...nextRun,
          globalState: "error",
        },
        {
          eventType: "verification",
          status: "failed",
          timestamp: nowMs(),
        }
      );
      if (options.checkpointPlanId) {
        return finalizeCheckpointedTerminalFailure(
          nextRun,
          "Stage dependency validation failed.",
          options,
          modes,
        );
      }
      emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "execution.failed", {
        status: "failed",
        reason: "dependency_failure",
      });
      return {
        ok: false,
        error: "Stage dependency validation failed.",
        run: nextRun,
        control: buildControlResponse(modes),
      };
    }

    for (const rawStep of stageSteps) {
      let currentStep = (nextRun.steps || []).find((entry) => entry.id === rawStep.id) || rawStep;
      if (["completed", "failed", "blocked"].includes(String(currentStep.status || ""))) {
        continue;
      }
      const stepIndex = getCheckpointStepIndex(nextRun, currentStep.id);

      if (options.checkpointPlanId) {
        const timingBreach = getExecutionTimingBreach(options.executionId || nextRun.runId, rules);
        if (timingBreach) {
          return pauseCheckpointedExecutionForReview(
            nextRun,
            refreshedStage,
            currentStep,
            stepIndex,
            timingBreach.type,
            timingBreach.message,
            modes,
            options,
          );
        }

        const containmentBreach = getExecutionContainmentBreach(options.executionId || nextRun.runId, rules);
        if (containmentBreach) {
          if (containmentBreach.type === "consecutive_failures_exceeded") {
            const failedRun = setStageStatus(
                setStepStatus(nextRun, currentStep.id, "failed", {
                  errorType: "consecutive_failures_exceeded",
                  error: containmentBreach.message,
                  blockReason: "consecutive_failures_exceeded",
                }),
                refreshedStage.id,
                "failed",
                {
                  pauseReason: "consecutive_failures_exceeded",
                  finishedAt: nowIso(),
                },
              );
              return finalizeCheckpointedTerminalFailure(
                {
                  ...failedRun,
                  globalState: "error",
                  updatedAt: nowIso(),
                },
                containmentBreach.message,
                options,
              modes,
              {
                finalResult,
              },
            );
          }

          return pauseCheckpointedExecutionForReview(
            nextRun,
            refreshedStage,
            currentStep,
            stepIndex,
            containmentBreach.type,
            containmentBreach.message,
            modes,
            options,
          );
        }
      }

      const prepared = prepareStepForReview(nextRun, currentStep.id);
      nextRun = prepared.run;
      currentStep = (nextRun.steps || []).find((entry) => entry.id === currentStep.id) || currentStep;

      if (prepared.pauseSignal) {
        nextRun = updateStep(nextRun, currentStep.id, {
          status: "paused_for_review",
          pauseReason: prepared.pauseSignal.reason,
          updatedAt: nowIso(),
        });
        nextRun = {
          ...nextRun,
          stages: (nextRun.stages || []).map((stage) =>
            stage.id === refreshedStage.id
              ? {
                  ...stage,
                  status: "paused_for_review",
                  pauseReason: prepared.pauseSignal.reason,
                  updatedAt: nowIso(),
                }
              : stage
          ),
          globalState: "paused",
          reviewStatus: "pending",
          updatedAt: nowIso(),
        };
        const reviewRecord = buildReviewRecordForStep(
          nextRun,
          (nextRun.stages || []).find((entry) => entry.id === refreshedStage.id),
          (nextRun.steps || []).find((entry) => entry.id === currentStep.id) || currentStep,
          nextRun.executionMode,
          prepared.pauseSignal.reason
        );
        if (stepIndex >= 0 && options.checkpointPlanId) {
          const pausedState = pauseBeforeExecutionForReviewAtomic({
            planId: options.checkpointPlanId,
            executionId: options.executionId || nextRun.runId,
            stepId: currentStep.id,
            stageId: refreshedStage.id,
            stepIndex,
            reason: prepared.pauseSignal.reason,
            runSnapshot: nextRun,
            reviewRecord,
          });
          if (!pausedState.ok) {
            return buildPersistenceFailureResult(nextRun, {
              ok: false,
              error: pausedState.message,
              code: pausedState.code,
            }, options.checkpointPlanId || nextRun.planId);
          }
        }
        recordRun(nextRun);
        stagePendingReviewSurface(reviewRecord);
        return buildPausedResponse(nextRun, modes, reviewRecord, {
          error: prepared.pauseSignal.reason,
        });
      }

      const executed = await executeSingleRoutedStep(currentStep, nextRun, modes, {
        ...options,
        stepIndex,
        totalSteps: (nextRun.steps || []).length,
      });
      nextRun = executed.run;
      currentStep = (nextRun.steps || []).find((entry) => entry.id === currentStep.id) || currentStep;
      if (!(executed.result && typeof executed.result === "object" && executed.result.status === "paused_for_review")) {
        finalResult = executed.result;
      }

      if (executed.result && typeof executed.result === "object" && executed.result.status === "paused_for_review") {
        nextRun = setStageStatus(nextRun, refreshedStage.id, "paused_for_review", {
          pauseReason: String(executed.result.reason || "step_requested_review"),
        });
        nextRun = {
          ...nextRun,
          globalState: "paused",
          reviewStatus: "pending",
          requiresReview: true,
        };
        const reviewRecord = buildReviewRecordForStep(
          nextRun,
          (nextRun.stages || []).find((entry) => entry.id === refreshedStage.id),
          currentStep,
          nextRun.executionMode,
          String(executed.result.reason || "step_requested_review")
        );
        if (executed.result.beforeStart) {
          if (stepIndex >= 0 && options.checkpointPlanId) {
            const pausedState = pauseBeforeExecutionForReviewAtomic({
              planId: options.checkpointPlanId,
              executionId: options.executionId || nextRun.runId,
              stepId: currentStep.id,
              stageId: refreshedStage.id,
              stepIndex,
              reason: String(executed.result.reason || "step_requested_review"),
              runSnapshot: nextRun,
              reviewRecord,
            });
            if (!pausedState.ok) {
              return buildPersistenceFailureResult(nextRun, {
                ok: false,
                error: pausedState.message,
                code: pausedState.code,
              }, options.checkpointPlanId || nextRun.planId);
            }
          }
          recordRun(nextRun);
          stagePendingReviewSurface(reviewRecord);
          return buildPausedResponse(nextRun, modes, reviewRecord, {
            error: String(executed.result.reason || "step_requested_review"),
          });
        }
        const pauseResult = pauseExecutionAttemptForReviewAtomic({
          planId: options.checkpointPlanId || nextRun.planId,
          executionId: options.executionId || nextRun.runId,
          stepId: currentStep.id,
          stepIndex,
          attemptNumber: executed.result.attemptNumber || 1,
          reason: String(executed.result.reason || "step_requested_review"),
          stageId: refreshedStage.id,
          runSnapshot: nextRun,
          reviewRecord,
        });
        if (!pauseResult.ok) {
          return buildPersistenceFailureResult(nextRun, pauseResult, options.checkpointPlanId || nextRun.planId);
        }
        saveRuntimeCaches(nextRun, reviewRecord, { globalState: "paused" });
        return buildPausedResponse(nextRun, modes, reviewRecord, {
          error: String(executed.result.reason || "step_requested_review"),
        });
      }

      if (executed.result && typeof executed.result === "object" && executed.result.type === "persistence_failure") {
        return buildPersistenceFailureResult(nextRun, executed.result, options.checkpointPlanId || nextRun.planId);
      }

      if (["failed", "timeout", "blocked"].includes(String(currentStep.status || ""))) {
        if (options.checkpointPlanId && executed.result?.type === "no_forward_progress") {
          return pauseCheckpointedExecutionForReview(
            nextRun,
            refreshedStage,
            currentStep,
            stepIndex,
            "no_forward_progress",
            "Execution paused because no forward progress was detected.",
            modes,
            options,
          );
        }
        if (options.checkpointPlanId && executed.result?.type === "max_attempts_exceeded") {
          return pauseCheckpointedExecutionForReview(
            nextRun,
            refreshedStage,
            currentStep,
            stepIndex,
            "max_attempts_exceeded",
            "Execution paused because the maximum attempt limit was exceeded.",
            modes,
            options,
          );
        }
        if (options.checkpointPlanId && executed.result?.type === "consecutive_failures_exceeded") {
          return finalizeCheckpointedTerminalFailure(
            {
              ...nextRun,
              globalState: "error",
              updatedAt: nowIso(),
            },
            "Execution failed after consecutive failure limit was exceeded.",
            options,
            modes,
            {
              finalResult,
            },
          );
        }
        nextRun = setStageStatus(nextRun, refreshedStage.id, "failed", {
          pauseReason: currentStep.error || currentStep.blockReason || currentStep.pauseReason || "stage_failed",
          finishedAt: nowIso(),
        });
      emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "stage.failed", {
        stageId: refreshedStage.id,
        status: "failed",
        reason: currentStep.error || currentStep.blockReason || currentStep.pauseReason || "stage_failed",
        stepId: currentStep.id,
      });
      nextRun = {
        ...nextRun,
        globalState: "error",
        updatedAt: nowIso(),
        logs: [
          ...(nextRun.logs || []),
          {
            eventType: "verification",
            status: "failed",
            timestamp: nowMs(),
          },
        ].slice(-500),
      };
      if (options.checkpointPlanId) {
        return finalizeCheckpointedTerminalFailure(
          nextRun,
          currentStep.error || "One or more steps failed during stage execution.",
          options,
          modes,
          {
            finalResult,
          },
        );
      }
      emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "execution.failed", {
        status: "failed",
        reason: currentStep.error || currentStep.blockReason || currentStep.pauseReason || "stage_failed",
        stepId: currentStep.id,
      });
      nextRun = appendExecutionLog(nextRun, {
        eventType: "verification",
        status: "failed",
        timestamp: nowMs(),
      });
      return {
        ok: false,
        error: currentStep.error || "One or more steps failed during stage execution.",
        finalResult,
        run: nextRun,
          control: buildControlResponse(modes),
        };
      }
    }

    nextRun = setStageStatus(nextRun, refreshedStage.id, "completed", {
      finishedAt: nowIso(),
    });
    emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "stage.completed", {
      stageId: refreshedStage.id,
      status: "completed",
      name: refreshedStage.name || null,
    });
  }

  nextRun = {
    ...nextRun,
    globalState: "idle",
    reviewStatus: "approved",
    updatedAt: nowIso(),
    logs: [
      ...(nextRun.logs || []),
      {
        eventType: "verification",
        status: "completed",
        timestamp: nowMs(),
      },
    ].slice(-500),
  };
  if (options.checkpointPlanId) {
    recordRun(nextRun);
    const atomicCompletion = finalizeAtomicTerminalResult(nextRun, "completed", options, null, modes);
    if (!atomicCompletion.ok) {
      return {
        ...atomicCompletion.result,
      };
    }
    return {
      ok: true,
      finalResult,
      run: nextRun,
      reviewSurface: getReviewSurface(nextRun.runId),
      ...atomicCompletion.result,
    };
  }
  nextRun = appendExecutionLog(nextRun, {
    eventType: "verification",
    status: "completed",
    timestamp: nowMs(),
  });
  emitLedgerEvent(options.checkpointPlanId || nextRun.planId, options.executionId || nextRun.runId, "execution.completed", {
    status: "completed",
  });
  return {
    ok: true,
    finalResult,
    run: nextRun,
    reviewSurface: getReviewSurface(nextRun.runId),
    control: buildControlResponse(modes),
  };
}

async function executeReadySteps(run, readySteps, modes = {}, options = {}) {
  if (!readySteps.length) {
    return { run, stepResults: [] };
  }

  if (canRunInParallel(readySteps, loadExecutionRules())) {
    const results = await Promise.all(readySteps.map((step) => executeSingleRoutedStep(step, run, modes, options)));
    let latestRun = run;
    for (let index = 0; index < readySteps.length; index += 1) {
      const stepId = readySteps[index].id;
      const stepSnapshot = results[index].run.steps.find((step) => step.id === stepId);
      if (stepSnapshot) {
        latestRun = {
          ...latestRun,
          steps: latestRun.steps.map((step) => (step.id === stepId ? stepSnapshot : step)),
          logs: [...(latestRun.logs || []), ...(results[index].run.logs || [])].slice(-500),
          updatedAt: nowIso(),
        };
      }
    }
    return {
      run: latestRun,
      stepResults: results.map((entry, index) => ({ stepId: readySteps[index].id, result: entry.result })),
    };
  }

  let nextRun = run;
  const stepResults = [];
  for (const step of readySteps) {
      const executed = await executeSingleRoutedStep(step, nextRun, modes, options);
    nextRun = executed.run;
    stepResults.push({ stepId: step.id, result: executed.result });
  }
  return { run: nextRun, stepResults };
}

/**
 * Execute a reviewed plan through the staged runtime loop.
 * @param {object} plan
 * @param {object} modes
 * @returns {Promise<object>}
 */
async function execute(plan, modes = {}) {
  initializeExecutionOrchestration({
    bootstrap: modes.bootstrap || "execution_engine",
  });

  if (!plan) {
    throw new Error("Invalid plan");
  }

  const rulesValidation = validateRuntimeRules();
  if (!rulesValidation.ok) {
    return {
      ok: false,
      error: rulesValidation.error,
      code: rulesValidation.code,
      issues: rulesValidation.issues,
      control: buildControlResponse(modes),
    };
  }
  const rules = rulesValidation.data;

  const reviewedPlanStatus = validateReviewedPlanForRouting(plan);
  if (!reviewedPlanStatus.ok) {
    return {
      ok: false,
      error: reviewedPlanStatus.error,
      control: buildControlResponse(modes),
    };
  }

  const assignedMode = normalizeExecutionMode(
    modes.executionMode || plan.finalMode || plan.proposedMode || "blocked"
  );
  const checkpointPlan = normalizeCheckpointPlan(plan);
  const executionId = String(plan.runId || generateExecutionId("run"));
  if (countActiveExecutions() >= Number(rules.maxConcurrentExecutions || 10)) {
    return {
      ok: false,
      error: "Execution rejected because the maximum concurrent execution limit is active.",
      code: "LIMIT_EXCEEDED",
      errorType: "LIMIT_EXCEEDED",
      reason: "max_concurrent_executions",
      control: buildControlResponse(modes),
    };
  }
  const lockResult = acquireExecutionLock(checkpointPlan.id, executionId);
  if (!lockResult.ok) {
    return {
      ok: false,
      error: lockResult.message,
      code: lockResult.code,
      ...buildStatePayload(checkpointPlan.id, checkpointPlan),
      control: buildControlResponse(modes),
    };
  }

  const integrityValidation = validateExecutionIntegrity(checkpointPlan.id, checkpointPlan);
  if (!integrityValidation.ok) {
    const explanation = explainExecutionCorruption(checkpointPlan.id, checkpointPlan);
    const state = describeExecutionState(checkpointPlan.id, checkpointPlan);
    const diagnostics =
      integrityValidation.diagnostics
      || (explanation.ok ? explanation.data.diagnostics : null)
      || buildFallbackCorruptionDiagnostics(checkpointPlan.id, integrityValidation.issues || []);
    const corruption = explanation.ok
      ? explanation.data
      : diagnostics
        ? {
            planId: checkpointPlan.id,
            corrupted: true,
            issues: integrityValidation.issues || [],
            diagnostics,
          }
        : null;
    return finalizeFailureWithReleasedLock({
      ok: false,
      error: integrityValidation.message,
      code: deriveIntegrityFailureCode(integrityValidation),
      issues: integrityValidation.issues || [],
      ...(corruption ? { diagnostics: corruption.diagnostics, corruption } : {}),
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  const reconciliation = reconcileExecutionState(checkpointPlan);
  if (!reconciliation.ok) {
    return finalizeFailureWithReleasedLock({
      ok: false,
      error: reconciliation.message,
      code: reconciliation.code,
      issues: reconciliation.issues || [],
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  const startResult = startExecutionState(checkpointPlan);
  if (!startResult.ok) {
    return finalizeFailureWithReleasedLock({
      ok: false,
      error: startResult.message,
      code: startResult.code,
      ...buildStatePayload(checkpointPlan.id, checkpointPlan),
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  const run = createStagedRun({
    ...plan,
    runId: executionId,
    planId: checkpointPlan.id,
  }, {
    ...modes,
    executionMode: assignedMode,
    systemTimeoutSeconds: Number(
      modes.systemTimeoutSeconds
      || Math.ceil(Number(rules.maxExecutionDurationMs || resolveSystemTimeoutSeconds().seconds * 1000 || 300000) / 1000)
    ),
  });

  let nextRun = {
    ...run,
    planId: checkpointPlan.id,
    totalAttempts: 0,
    consecutiveFailures: 0,
    noProgressAttempts: 0,
    lastProgressAt: run.createdAt || nowIso(),
  };
  emitLedgerEvent(checkpointPlan.id, executionId, "execution.created", {
    status: "pending",
    stageCount: Array.isArray(nextRun.stages) ? nextRun.stages.length : 0,
    stepCount: Array.isArray(nextRun.steps) ? nextRun.steps.length : 0,
  });
  if (!Array.isArray(nextRun.stages) || nextRun.stages.length === 0) {
    return {
      ok: false,
      error: "Execution plan has zero stages.",
      run: nextRun,
      control: buildControlResponse(modes),
    };
  }
  if (
    Array.isArray(modes.executedStepIds) &&
    nextRun.steps.some((step) => modes.executedStepIds.includes(step.id)) &&
    !modes.resetExecutedSteps
  ) {
    return {
      ok: false,
      error: `Execution blocked because step ${nextRun.steps.find((step) => modes.executedStepIds.includes(step.id)).id} already ran without reset.`,
      run: nextRun,
      control: buildControlResponse(modes),
    };
  }

  const cycle = detectDependencyCycle(nextRun.steps);
  if (cycle) {
    const activeStage = getCurrentStage(nextRun);
    nextRun.steps.forEach((step) => {
      nextRun = setStepStatus(nextRun, step.id, "blocked", {
        errorType: "dependency_cycle",
        error: "dependency_cycle",
        blockReason: "dependency_cycle",
      });
    });
    if (activeStage) {
      nextRun = setStageStatus(nextRun, activeStage.id, "failed", {
        pauseReason: "dependency_cycle",
        finishedAt: nowIso(),
      });
      emitLedgerEvent(checkpointPlan.id, executionId, "stage.failed", {
        stageId: activeStage.id,
        status: "failed",
        reason: "dependency_cycle",
      });
    }
    nextRun = {
      ...nextRun,
      globalState: "error",
      updatedAt: nowIso(),
    };
    const cycleReviewRecord = createReviewRecord(nextRun.runId, nextRun.steps, assignedMode, {
      status: "blocked",
      reasonFlagged: "dependency_cycle",
      currentStage: activeStage
        ? { id: activeStage.id, name: activeStage.name, status: "failed" }
        : null,
    });
    const atomicFailure = finalizeCheckpointedTerminalFailure(
      nextRun,
      "dependency_cycle",
      { checkpointPlanId: checkpointPlan.id, executionId },
      modes,
      { type: "dependency_cycle" },
    );
    if (!atomicFailure.lockReleased) {
      return atomicFailure;
    }
    commitRuntimeSnapshot(nextRun, cycleReviewRecord);
    return {
      ...atomicFailure,
      reviewSurface: getReviewSurface(nextRun.runId),
    };
  }

  const stepIds = new Set(nextRun.steps.map((step) => step.id));
  const missingDependency = nextRun.steps.find((step) =>
    (step.dependsOn || []).some((dependencyId) => !stepIds.has(dependencyId))
  );
  if (missingDependency) {
    const activeStage = getCurrentStage(nextRun);
    nextRun.steps.forEach((step) => {
      nextRun = setStepStatus(nextRun, step.id, step.id === missingDependency.id ? "blocked" : "deferred", {
        errorType: step.id === missingDependency.id ? "dependency_failure" : "dependency_failure",
        error: `Missing dependency ${missingDependency.dependsOn.find((dependencyId) => !stepIds.has(dependencyId))}.`,
        blockReason: step.id === missingDependency.id ? "dependency_failure" : null,
        deferred: step.id !== missingDependency.id,
      });
    });
    if (activeStage) {
      nextRun = setStageStatus(nextRun, activeStage.id, "failed", {
        pauseReason: "dependency_failure",
        finishedAt: nowIso(),
      });
      emitLedgerEvent(checkpointPlan.id, executionId, "stage.failed", {
        stageId: activeStage.id,
        status: "failed",
        reason: "dependency_failure",
      });
    }
    nextRun = {
      ...nextRun,
      globalState: "error",
      updatedAt: nowIso(),
    };
    const dependencyMessage = `Execution blocked because prerequisite ${missingDependency.dependsOn.find((dependencyId) => !stepIds.has(dependencyId))} was not satisfied before ${missingDependency.id}.`;
    const dependencyReviewRecord = createReviewRecord(nextRun.runId, nextRun.steps, assignedMode, {
      status: "blocked",
      reasonFlagged: "dependency_failure",
      currentStage: activeStage
        ? { id: activeStage.id, name: activeStage.name, status: "failed" }
        : null,
    });
    const atomicFailure = finalizeCheckpointedTerminalFailure(
      nextRun,
      dependencyMessage,
      { checkpointPlanId: checkpointPlan.id, executionId },
      modes,
    );
    if (!atomicFailure.lockReleased) {
      return atomicFailure;
    }
    commitRuntimeSnapshot(nextRun, dependencyReviewRecord);
    return {
      ...atomicFailure,
      reviewSurface: getReviewSurface(nextRun.runId),
    };
  }

  const orchestrationState = loadOrchestrationState();
  const anomalies = detectAnomalies(nextRun, orchestrationState, rules);
  if (anomalies.length) {
    const breach = anomalies.some((anomaly) =>
      ["execution_frequency_spike", "failure_rate_increase", "operator_disagreement_pattern"].includes(anomaly)
    );
    const reviewRecord = createReviewRecord(nextRun.runId, nextRun.steps, assignedMode, {
      status: "pending",
      reasonFlagged: breach ? "anomaly_threshold_breach" : "forced_manual_review",
    });
    const nextState = breach ? enterSafeMode(orchestrationState, anomalies.join(",")) : orchestrationState;
    appendAuditEvent({
      type: "execution_orchestration",
      actor: "system",
      eventType: breach ? "anomaly_threshold_breach" : "anomaly_detected",
      message: breach
        ? `Anomaly threshold breach for ${nextRun.runId}.`
        : `Anomaly detected for ${nextRun.runId}; forcing manual review.`,
      payload: {
        runId: nextRun.runId,
        anomalies,
      },
    });
    const pausedRun = {
      ...nextRun,
      globalState: breach ? "safe_mode" : "paused",
      requiresReview: true,
      reviewStatus: "pending",
    };
    const pauseResult = pauseExecutionForReviewAtomic({
      planId: checkpointPlan.id,
      executionId,
      runSnapshot: pausedRun,
      reviewRecord,
      pauseStatus: breach ? "safe_mode" : "paused",
      reason: breach ? "anomaly_threshold_breach" : "forced_manual_review",
    });
    if (!pauseResult.ok) {
      return buildPersistenceFailureResult(pausedRun, pauseResult, checkpointPlan.id);
    }
    saveRuntimeCaches(pausedRun, reviewRecord, {
      globalState: breach ? "safe_mode" : "paused",
      anomalies: [
        {
          runId: nextRun.runId,
          anomalies,
          detectedAt: nowIso(),
        },
        ...(nextState.anomalies || []),
      ].slice(0, 100),
      approvalQueue: [
        ...(nextState.approvalQueue || []),
        {
          runId: nextRun.runId,
          queuedAt: nowMs(),
          reason: "forced_manual_review",
          executionMode: assignedMode,
          stepIds: nextRun.steps.map((step) => step.id),
        },
      ].slice(0, 100),
      safeMode: nextState.safeMode,
    });
    return {
      ok: false,
      requiresReview: true,
      forcedManualReview: true,
      error: breach ? "Anomaly threshold breach forced safe_mode." : "Anomaly detected; forced manual review.",
      run: pausedRun,
      control: buildControlResponse(modes),
    };
  }

  if (assignedMode === "blocked") {
    commitRuntimeSnapshot(
      nextRun,
      createReviewRecord(nextRun.runId, nextRun.steps, assignedMode, {
        status: "blocked",
        reasonFlagged: "policy_block",
      })
    );
    return {
      ok: false,
      error: "Execution blocked by assigned mode.",
      run: nextRun,
      control: buildControlResponse(modes),
    };
  }

  if (assignedMode === "simulate") {
    commitRuntimeSnapshot(
      nextRun,
      createReviewRecord(nextRun.runId, nextRun.steps, assignedMode, { status: "approved" })
    );
    resolveReview(nextRun.runId, "simulated");
    return {
      ok: true,
      simulated: true,
      run: nextRun,
      control: buildControlResponse(modes),
    };
  }

  if (assignedMode === "confirm_required") {
    const safeAlternative = buildSafeAlternative(nextRun);
    if (safeAlternative) {
      const reviewRecord = buildQueuedReviewRecord(
        nextRun,
        assignedMode,
        "confirm_required",
        "preview_first"
      );
      const pausedRun = {
        ...nextRun,
        globalState: "paused",
        requiresReview: true,
        reviewStatus: "pending",
      };
      const pauseResult = pauseExecutionForReviewAtomic({
        planId: checkpointPlan.id,
        executionId,
        runSnapshot: pausedRun,
        reviewRecord,
        pauseStatus: "paused",
        reason: "confirm_required",
      });
      if (!pauseResult.ok) {
        return buildPersistenceFailureResult(pausedRun, pauseResult, checkpointPlan.id);
      }
      saveRuntimeCaches(pausedRun, reviewRecord, {
        approvalQueue: [
          ...(orchestrationState.approvalQueue || []),
          {
            runId: nextRun.runId,
            queuedAt: nowMs(),
            reason: "confirm_required",
            executionMode: assignedMode,
            stepIds: nextRun.steps.map((step) => step.id),
          },
        ].slice(0, 100),
      });
      return {
        ok: false,
        requiresReview: true,
        rewritten: true,
        plan: safeAlternative,
        error: "Execution requires review; preview-first rewrite available.",
        run: pausedRun,
        reviewSurface: getReviewSurface(pausedRun.runId),
        control: buildControlResponse(modes),
      };
    }
    nextRun.steps.forEach((step) => {
      nextRun = setStepStatus(nextRun, step.id, "blocked", {
        errorType: "policy_block",
        error: "confirm_required",
      });
    });
    commitRuntimeSnapshot(
      nextRun,
      buildQueuedReviewRecord(nextRun, assignedMode, "confirm_required"),
      {
        approvalQueue: [
          ...(orchestrationState.approvalQueue || []).filter((entry) => entry.runId !== nextRun.runId),
          {
            runId: nextRun.runId,
            queuedAt: nowMs(),
            reason: "confirm_required",
            executionMode: assignedMode,
            stepIds: nextRun.steps.map((step) => step.id),
          },
        ].slice(0, 100),
      }
    );
    return {
      ok: false,
      requiresReview: true,
      error: "Execution requires review and no safe rewrite is available.",
      run: nextRun,
      reviewSurface: getReviewSurface(nextRun.runId),
      control: buildControlResponse(modes),
    };
  }

  if (orchestrationState.safeMode?.enabled) {
    const reviewRecord = buildQueuedReviewRecord(nextRun, assignedMode, "safe_mode_active");
    const safeModeRun = {
      ...nextRun,
      globalState: "safe_mode",
      requiresReview: true,
      reviewStatus: "pending",
    };
    const pauseResult = pauseExecutionForReviewAtomic({
      planId: checkpointPlan.id,
      executionId,
      runSnapshot: safeModeRun,
      reviewRecord,
      pauseStatus: "safe_mode",
      reason: "safe_mode_active",
    });
    if (!pauseResult.ok) {
      return buildPersistenceFailureResult(safeModeRun, pauseResult, checkpointPlan.id);
    }
    saveRuntimeCaches(safeModeRun, reviewRecord, {
      globalState: "safe_mode",
      safeMode: orchestrationState.safeMode,
      approvalQueue: [
        ...(orchestrationState.approvalQueue || []).filter((entry) => entry.runId !== nextRun.runId),
        {
          runId: nextRun.runId,
          queuedAt: nowMs(),
          reason: "forced_manual_review",
          executionMode: assignedMode,
          stepIds: nextRun.steps.map((step) => step.id),
        },
      ].slice(0, 100),
    });
    return {
      ok: false,
      requiresReview: true,
      forcedManualReview: true,
      error: "Execution held because safe_mode is active.",
      run: safeModeRun,
      reviewSurface: getReviewSurface(safeModeRun.runId),
      control: buildControlResponse(modes),
    };
  }

  if (!isExecutionAuthorized({ ...modes, executionMode: toRuntimeExecutionMode(assignedMode) })) {
    return {
      ok: false,
      error: `Execution engine blocked in ${assignedMode} mode.`,
      run: nextRun,
      control: buildControlResponse(modes),
    };
  }

  const throttleDecision = evaluateApprovalThrottle(nextRun, orchestrationState, rules);
  if (throttleDecision.status !== "approved") {
    const reasonFlagged =
      throttleDecision.status === "queued"
        ? "auto_approval_queued"
        : throttleDecision.queueTimedOut
          ? "queue_timeout"
          : throttleDecision.overflow
            ? "queue_overflow"
            : "forced_manual_review";
    const queuedRun = {
      ...nextRun,
      globalState: "paused",
      requiresReview: true,
      reviewStatus: "pending",
    };
    const reviewRecord = buildQueuedReviewRecord(queuedRun, assignedMode, reasonFlagged);
    const pauseResult = pauseExecutionForReviewAtomic({
      planId: checkpointPlan.id,
      executionId,
      runSnapshot: queuedRun,
      reviewRecord,
      pauseStatus: "paused",
      reason: reasonFlagged,
    });
    if (!pauseResult.ok) {
      return buildPersistenceFailureResult(queuedRun, pauseResult, checkpointPlan.id);
    }
    saveRuntimeCaches(queuedRun, reviewRecord, {
      globalState: "paused",
      approvalQueue: throttleDecision.queue,
      safeMode: orchestrationState.safeMode,
    });
    return {
      ok: false,
      requiresReview: true,
      forcedManualReview: throttleDecision.status !== "queued",
      queued: throttleDecision.status === "queued",
      error:
        throttleDecision.status === "queued"
          ? "Auto-approval rate limited; request queued for re-evaluation."
          : "Auto-approval unavailable; manual review required.",
      run: queuedRun,
      reviewSurface: getReviewSurface(queuedRun.runId),
      control: buildControlResponse(modes),
    };
  }

  commitRuntimeSnapshot(
    nextRun,
    createReviewRecord(nextRun.runId, nextRun.steps, assignedMode, { status: "approved" }),
    {
      approvalQueue: throttleDecision.queue,
      safeMode: orchestrationState.safeMode,
    }
  );
  resolveReview(nextRun.runId, "approved");
  const result = await continueExecution(
    {
      ...nextRun,
      reviewStatus: "approved",
    },
    modes,
    {
      checkpointPlanId: checkpointPlan.id,
      executionId,
    }
  );
  if (shouldReleaseExecutionLock(result)) {
    return finalizeResultWithReleasedLock(result, checkpointPlan.id, executionId, modes, checkpointPlan);
  }
  return result;
}

async function recoverExecution(plan, modes = {}) {
  const preflight = runRecoveryPreflight(plan, modes);
  if (!preflight.ok) {
    return preflight;
  }
  const checkpointPlan = preflight.data.checkpointPlan;
  const persistedExecutionState = preflight.data.persistedExecutionState;
  const executionId = String(preflight.data.executionId);
  const statePayload = preflight.data.state ? { state: preflight.data.state } : buildStatePayload(checkpointPlan.id, checkpointPlan);
  const checkpoint = preflight.data.checkpoint || null;

  if (!preflight.data.eligible) {
    return {
      ok: false,
      error: preflight.data.message || "Execution is not eligible for deterministic recovery.",
      code: preflight.data.code || preflight.data.reason || "RECOVERY_INELIGIBLE",
      checkpoint,
      ...(preflight.data.issues ? { issues: preflight.data.issues } : {}),
      ...(preflight.data.diagnostics ? { diagnostics: preflight.data.diagnostics } : {}),
      ...(preflight.data.corruption ? { corruption: preflight.data.corruption } : {}),
      ...statePayload,
      control: preflight.data.control || buildControlResponse(modes),
    };
  }

  const lockResult = acquireOrReuseExecutionLock(checkpointPlan.id, executionId);
  if (!lockResult.ok) {
    return {
      ok: false,
      error: lockResult.message,
      code: lockResult.code,
      control: buildControlResponse(modes),
    };
  }

  const integrityValidation = validateExecutionIntegrity(checkpointPlan.id, checkpointPlan);
  if (!integrityValidation.ok) {
    const explanation = explainExecutionCorruption(checkpointPlan.id, checkpointPlan);
    const diagnostics =
      integrityValidation.diagnostics
      || (explanation.ok ? explanation.data.diagnostics : null)
      || buildFallbackCorruptionDiagnostics(checkpointPlan.id, integrityValidation.issues || []);
    const corruption = explanation.ok
      ? explanation.data
      : {
          planId: checkpointPlan.id,
          corrupted: true,
          issues: integrityValidation.issues || [],
          diagnostics,
        };
    return finalizeFailureWithReleasedLock({
      ok: false,
      error: integrityValidation.message,
      code: deriveIntegrityFailureCode(integrityValidation),
      issues: integrityValidation.issues || [],
      diagnostics,
      corruption,
      ...buildStatePayload(checkpointPlan.id, checkpointPlan),
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  const reconciliation = reconcileExecutionState(checkpointPlan);
  if (!reconciliation.ok) {
    return finalizeFailureWithReleasedLock({
      ok: false,
      error: reconciliation.message,
      code: reconciliation.code,
      issues: reconciliation.issues || [],
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  if (reconciliation.data.action === "operator_recovery") {
    return {
      ok: false,
      requiresReview: true,
      code: "MANUAL_REVIEW_REQUIRED",
      error: "Execution requires operator recovery before it can resume.",
      checkpoint: reconciliation.data.checkpoint,
      recoveryQueue: reconciliation.data.recoveryQueue || [],
      ...statePayload,
      control: buildControlResponse(modes),
    };
  }

  if (reconciliation.data.action === "abandon") {
    return {
      ok: false,
      code: "EXECUTION_ABANDONED",
      error: "Execution was abandoned after operator recovery expired.",
      checkpoint: reconciliation.data.checkpoint,
      ...statePayload,
      control: buildControlResponse(modes),
    };
  }

  if (reconciliation.data.action === "halt") {
    const explanation = explainExecutionCorruption(checkpointPlan.id, checkpointPlan);
    return {
      ok: false,
      code: "INVALID_STATE",
      error: "Execution cannot be resumed from its current checkpoint state.",
      checkpoint: reconciliation.data.checkpoint,
      ...(explanation.ok ? { diagnostics: explanation.data.diagnostics, corruption: explanation.data } : {}),
      ...statePayload,
      control: buildControlResponse(modes),
    };
  }

  if (reconciliation.data.action === "completed") {
    return finalizeResultWithReleasedLock({
      ok: true,
      recovered: true,
      run: null,
      checkpoint: reconciliation.data.checkpoint,
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  if (reconciliation.data.action === "cancelled") {
    return {
      ok: false,
      code: "EXECUTION_CANCELLED",
      error: "Execution was cancelled before it could be resumed.",
      checkpoint: reconciliation.data.checkpoint,
      ...statePayload,
      control: buildControlResponse(modes),
    };
  }

  if (reconciliation.data.action === "noop") {
    return {
      ok: false,
      code: "EXECUTION_ACTIVE",
      error: "Execution is still active and cannot be resumed deterministically yet.",
      checkpoint: reconciliation.data.checkpoint,
      ...statePayload,
      control: buildControlResponse(modes),
    };
  }

  const recovered = recoverExecutionState(checkpointPlan);
  if (!recovered.ok) {
    return finalizeFailureWithReleasedLock({
      ok: false,
      error: recovered.message,
      code: recovered.code,
      ...buildStatePayload(checkpointPlan.id, checkpointPlan),
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  if (recovered.data.completed) {
    return finalizeResultWithReleasedLock({
      ok: true,
      recovered: true,
      run: null,
      checkpoint: recovered.data.checkpoint,
      control: buildControlResponse(modes),
    }, checkpointPlan.id, executionId, modes, checkpointPlan);
  }

  const recoveryPlan = buildRecoveryPlanFromPersistedState(plan, persistedExecutionState);
  const run = createStagedRun({
    ...recoveryPlan,
    runId: executionId,
    planId: checkpointPlan.id,
  }, {
    ...modes,
    executionMode: normalizeExecutionMode(modes.executionMode || recoveryPlan.finalMode || recoveryPlan.proposedMode || "blocked"),
    systemTimeoutSeconds: Number(modes.systemTimeoutSeconds || resolveSystemTimeoutSeconds().seconds || 300),
  });

  const hydratedRun = applyCheckpointToRun(
    persistedExecutionState?.execution
      ? hydrateRunFromPersistedState(
        {
          ...run,
          planId: checkpointPlan.id,
        },
        { persisted: persistedExecutionState },
      )
      : {
        ...run,
        planId: checkpointPlan.id,
      },
    recovered.data.checkpoint,
    checkpointPlan.steps.length,
  );

  const result = await continueExecution(
    hydratedRun,
    modes,
    {
      resumed: true,
      checkpointPlanId: checkpointPlan.id,
      executionId: hydratedRun.runId,
    }
  );
  if (shouldReleaseExecutionLock(result)) {
    return finalizeResultWithReleasedLock(result, checkpointPlan.id, hydratedRun.runId, modes, checkpointPlan);
  }
  return result;
}

/**
 * Resume a paused execution from the current paused step.
 * @param {string} planId
 * @param {string} operatorId
 * @param {string|object} decision
 * @returns {Promise<object>}
 */
async function resumeExecution(planId, operatorId, decision) {
  const rulesValidation = validateRuntimeRules();
  if (!rulesValidation.ok) {
    return {
      ok: false,
      error: rulesValidation.error,
      code: rulesValidation.code,
      issues: rulesValidation.issues,
    };
  }
  const orchestrationState = loadOrchestrationState();
  const storedRun = (orchestrationState.runs || []).find((entry) => entry.runId === String(planId));
  if (!storedRun) {
    return { ok: false, error: "Execution plan not found." };
  }
  const checkpointPlanId = String(storedRun.planId || storedRun.runId || planId);
  if (String(storedRun.reviewStatus || "") !== "pending" && String(storedRun.globalState || "") !== "paused") {
    return {
      ok: false,
      error: "Execution plan is not paused for review.",
      ...buildStatePayload(checkpointPlanId),
    };
  }

  const persistedResumeState = getPersistedResumeState(String(storedRun.runId));
  const resumeStateValidation = validateResumeStateConsistency(storedRun, persistedResumeState);
  if (!resumeStateValidation.ok) {
    return {
      ok: false,
      code: resumeStateValidation.code,
      error: resumeStateValidation.error,
      ...buildStatePayload(checkpointPlanId),
    };
  }
  let nextRun = resumeStateValidation.run;
  const { currentStage, pausedStep } = resumeStateValidation;
  if (hasLiveExecutionLease(persistedResumeState?.persisted?.execution)) {
    return {
      ok: false,
      code: "EXECUTION_ACTIVE",
      error: "Execution is still leased and cannot be resumed safely yet.",
      ...buildStatePayload(checkpointPlanId),
    };
  }

  const normalizedDecision = typeof decision === "string" ? { action: decision } : { ...(decision || {}) };
  const action = String(normalizedDecision.action || "").toLowerCase();
  if (!["approve", "reject", "modify"].includes(action)) {
    return { ok: false, error: "Unsupported review decision." };
  }

  const lockResult = acquireOrReuseExecutionLock(checkpointPlanId, String(storedRun.runId));
  if (!lockResult.ok) {
    return {
      ok: false,
      error: lockResult.message,
      code: lockResult.code,
      ...buildStatePayload(checkpointPlanId),
    };
  }

  appendAuditEvent({
    type: "execution_review",
    actor: "operator",
    eventType: `review_${action}`,
    message: `Operator ${operatorId} applied ${action} to ${planId}.`,
    payload: {
      planId,
      operatorId,
      stepId: pausedStep.id,
      stageId: currentStage.id,
    },
  });

  if (action === "reject") {
    nextRun = setStepStatus(nextRun, pausedStep.id, "failed", {
      errorType: "operator_rejected",
      error: "Execution rejected by operator.",
      blockReason: "operator_rejected",
    });
    nextRun = setStageStatus(nextRun, currentStage.id, "failed", {
      pauseReason: "operator_rejected",
      finishedAt: nowIso(),
    });
    nextRun = appendExecutionLog(
      {
        ...nextRun,
        globalState: "error",
        reviewStatus: "rejected",
      },
      {
        eventType: "verification",
        status: "failed",
        timestamp: nowMs(),
      }
    );
    emitLedgerEvent(checkpointPlanId, String(nextRun.runId), "stage.failed", {
      stageId: currentStage.id,
      status: "failed",
      reason: "operator_rejected",
      stepId: pausedStep.id,
    });
    emitLedgerEvent(checkpointPlanId, String(nextRun.runId), "execution.failed", {
      status: "failed",
      reason: "operator_rejected",
      stepId: pausedStep.id,
    });
    commitRuntimeSnapshot(nextRun, createReviewRecord(nextRun.runId, [pausedStep], nextRun.executionMode, {
      status: "blocked",
      reasonFlagged: "operator_rejected",
      currentStage: { id: currentStage.id, name: currentStage.name, status: "failed" },
    }), { globalState: "error" });
    resolveReview(planId, "rejected");
      return {
        ok: false,
        error: "Execution rejected by operator.",
        run: nextRun,
        reviewSurface: getReviewSurface(planId),
      };
  }

  if (action === "modify") {
    if (!Object.prototype.hasOwnProperty.call(normalizedDecision, "updatedInput")) {
      return { ok: false, error: "Modify decisions require updatedInput." };
    }
    nextRun = updateStep(nextRun, pausedStep.id, {
      originalInput: normalizedDecision.updatedInput,
      normalizedInput: normalizedDecision.updatedInput,
      rewritten: false,
      rewriteReason: "operator_modified",
      normalizationNote: "Operator modified the step input before resuming execution.",
      requiresReview: false,
      reviewAcknowledged: true,
      pauseReason: null,
      status: "pending",
    });
    resolveReview(planId, "modified");
  } else {
    nextRun = updateStep(nextRun, pausedStep.id, {
      requiresReview: false,
      reviewAcknowledged: true,
      pauseReason: null,
      status: "pending",
    });
    resolveReview(planId, "approved");
  }

  nextRun = setStageStatus(
    {
      ...nextRun,
      globalState: "running",
      reviewStatus: "approved",
    },
    currentStage.id,
    "running",
    {
      resumed: true,
      pauseReason: null,
    }
  );

  const resumedStep = (nextRun.steps || []).find((step) => step.id === pausedStep.id) || pausedStep;
  commitRuntimeSnapshot(nextRun, createReviewRecord(nextRun.runId, [resumedStep], nextRun.executionMode, {
    status: action === "modify" ? "modified" : "approved",
    currentStage: { id: currentStage.id, name: currentStage.name, status: "running" },
  }), { globalState: "running" });

  const result = await continueExecution(nextRun, { executionMode: nextRun.executionMode, controlApproved: true }, {
    resumed: true,
    resumeStageId: currentStage.id,
    checkpointPlanId,
    executionId: String(nextRun.runId),
  });
  if (shouldReleaseExecutionLock(result)) {
    return finalizeResultWithReleasedLock(result, checkpointPlanId, String(nextRun.runId), {
      executionMode: nextRun.executionMode,
      controlApproved: true,
    }, { id: checkpointPlanId });
  }
  return result;
}

module.exports = { execute, preflightRecovery, recoverExecution, resumeExecution };
