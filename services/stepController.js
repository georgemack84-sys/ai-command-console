const path = require("path");
const { appendAuditEvent } = require("./auditTrail");
const { loadJsonDocument } = require("./documentStore");
const {
  persistExecutionSnapshot,
} = require("./executionStateStore");
const { getDatabaseNowIso, getDatabaseNowMs, loadDocument, saveDocument, transactDocuments } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");
const {
  REVIEW_SURFACE_KEY,
  REVIEW_SURFACE_PATH,
  createReviewRecord,
  defaultReviewSurfaceState,
} = require("./reviewSurface");

const EXECUTION_RULES_PATH = path.join(__dirname, "..", "config", "executionRules.json");
const EXECUTION_RULES_KEY = "execution-rules";
const ORCHESTRATION_STATE_KEY = "execution-orchestration-state";
const ORCHESTRATION_STATE_PATH = getAgentsDataPath("execution-orchestration-state.json");
const BACKTEST_STATE_KEY = "execution-backtests";
const BACKTEST_STATE_PATH = getAgentsDataPath("execution-backtests.json");
const resourceQueues = new Map();

function defaultExecutionRules() {
  return {
    defaultTimeoutMs: 300000,
    heartbeatIntervalMs: 5000,
    heartbeatTimeoutMs: 15000,
    maxRetries: 1,
    allowParallelSafeSteps: true,
    safeMode: {
      enabled: false,
      enteredAt: null,
      reason: null,
    },
    autoApprovalWindowMs: 60000,
    autoApprovalMaxPerWindow: 1000,
    maxQueueDepth: 100,
    maxQueueWaitMs: 120000,
    anomalyThresholds: {
      maxExecutionsPerWindow: 1000,
      maxFailureRate: 0.35,
      maxDurationDeviationMs: 120000,
      maxOperatorDisagreementRate: 0.4,
    },
    maxExecutionDurationMs: 900000,
    maxExecutionAttempts: 50,
    maxStepDurationMs: 120000,
    maxConsecutiveFailures: 5,
    maxConcurrentExecutions: 10,
    leaseDurationMs: 30000,
    leaseRenewalIntervalMs: 10000,
    noProgressAttemptLimit: 3,
    maxSequenceFailureRate: 0.35,
    blockedCapabilities: ["credential:access"],
  };
}

function normalizeExecutionRules(value = {}) {
  const defaults = defaultExecutionRules();
  return {
    defaultTimeoutMs: Math.max(1000, Number(value.defaultTimeoutMs || defaults.defaultTimeoutMs)),
    heartbeatIntervalMs: Math.max(1000, Number(value.heartbeatIntervalMs || defaults.heartbeatIntervalMs)),
    heartbeatTimeoutMs: Math.max(
      Number(value.heartbeatIntervalMs || defaults.heartbeatIntervalMs),
      Number(value.heartbeatTimeoutMs || defaults.heartbeatTimeoutMs)
    ),
    maxRetries: Math.max(0, Number(value.maxRetries ?? defaults.maxRetries)),
    allowParallelSafeSteps: Boolean(
      value.allowParallelSafeSteps == null ? defaults.allowParallelSafeSteps : value.allowParallelSafeSteps
    ),
    safeMode: {
      enabled: Boolean(value.safeMode?.enabled),
      enteredAt: value.safeMode?.enteredAt || null,
      reason: value.safeMode?.reason || null,
    },
    autoApprovalWindowMs: Math.max(1000, Number(value.autoApprovalWindowMs || defaults.autoApprovalWindowMs)),
    autoApprovalMaxPerWindow: Math.max(1, Number(value.autoApprovalMaxPerWindow || defaults.autoApprovalMaxPerWindow)),
    maxQueueDepth: Math.max(1, Number(value.maxQueueDepth || defaults.maxQueueDepth)),
    maxQueueWaitMs: Math.max(1000, Number(value.maxQueueWaitMs || defaults.maxQueueWaitMs)),
    anomalyThresholds: {
      maxExecutionsPerWindow: Math.max(
        1,
        Number(value.anomalyThresholds?.maxExecutionsPerWindow || defaults.anomalyThresholds.maxExecutionsPerWindow)
      ),
      maxFailureRate: Math.min(
        1,
        Math.max(0, Number(value.anomalyThresholds?.maxFailureRate ?? defaults.anomalyThresholds.maxFailureRate))
      ),
      maxDurationDeviationMs: Math.max(
        1000,
        Number(value.anomalyThresholds?.maxDurationDeviationMs || defaults.anomalyThresholds.maxDurationDeviationMs)
      ),
      maxOperatorDisagreementRate: Math.min(
        1,
        Math.max(0, Number(value.anomalyThresholds?.maxOperatorDisagreementRate ?? defaults.anomalyThresholds.maxOperatorDisagreementRate))
      ),
    },
    maxExecutionDurationMs: Math.max(
      1000,
      Number(value.maxExecutionDurationMs || defaults.maxExecutionDurationMs)
    ),
    maxExecutionAttempts: Math.max(1, Number(value.maxExecutionAttempts || defaults.maxExecutionAttempts)),
    maxStepDurationMs: Math.max(1000, Number(value.maxStepDurationMs || defaults.maxStepDurationMs)),
    maxConsecutiveFailures: Math.max(1, Number(value.maxConsecutiveFailures || defaults.maxConsecutiveFailures)),
    maxConcurrentExecutions: Math.max(1, Number(value.maxConcurrentExecutions || defaults.maxConcurrentExecutions)),
    leaseDurationMs: Math.max(1000, Number(value.leaseDurationMs || defaults.leaseDurationMs)),
    leaseRenewalIntervalMs: Math.max(
      1000,
      Number(value.leaseRenewalIntervalMs || defaults.leaseRenewalIntervalMs)
    ),
    noProgressAttemptLimit: Math.max(
      1,
      Number(value.noProgressAttemptLimit || defaults.noProgressAttemptLimit)
    ),
    maxSequenceFailureRate: Math.min(
      1,
      Math.max(0, Number(value.maxSequenceFailureRate ?? defaults.maxSequenceFailureRate))
    ),
    blockedCapabilities: Array.isArray(value.blockedCapabilities)
      ? [...new Set(value.blockedCapabilities.map((entry) => String(entry)).filter(Boolean))]
      : defaults.blockedCapabilities,
  };
}

function loadExecutionRules() {
  return loadJsonDocument(
    EXECUTION_RULES_KEY,
    EXECUTION_RULES_PATH,
    defaultExecutionRules,
    normalizeExecutionRules
  );
}

function validateExecutionRules(rules = loadExecutionRules()) {
  const issues = [];
  if (Number(rules.leaseDurationMs || 0) <= Number(rules.leaseRenewalIntervalMs || 0) * 2) {
    issues.push("leaseDurationMs must be greater than leaseRenewalIntervalMs * 2.");
  }
  if (Number(rules.leaseRenewalIntervalMs || 0) >= Number(rules.leaseDurationMs || 0)) {
    issues.push("leaseRenewalIntervalMs must be less than leaseDurationMs.");
  }
  if (Number(rules.maxStepDurationMs || 0) > Number(rules.maxExecutionDurationMs || 0)) {
    issues.push("maxStepDurationMs must be less than or equal to maxExecutionDurationMs.");
  }
  if (Number(rules.noProgressAttemptLimit || 0) > Number(rules.maxExecutionAttempts || 0)) {
    issues.push("noProgressAttemptLimit must be less than or equal to maxExecutionAttempts.");
  }
  if (Number(rules.maxConsecutiveFailures || 0) > Number(rules.maxExecutionAttempts || 0)) {
    issues.push("maxConsecutiveFailures must be less than or equal to maxExecutionAttempts.");
  }
  if (issues.length === 0) {
    return { ok: true, data: rules };
  }

  appendAuditEvent({
    type: "execution_orchestration",
    actor: "system",
    eventType: "config_validation_failed",
    message: "Execution runtime configuration is invalid.",
    payload: {
      issues,
      rules,
    },
  });

  return {
    ok: false,
    code: "CONFIG_ERROR",
    message: issues.join(" "),
    issues,
    rules,
  };
}

function defaultOrchestrationState() {
  return {
    createdAt: nowIso(),
    updatedAt: nowIso(),
    globalState: "idle",
    runs: [],
    bootstraps: [],
    approvalQueue: [],
    anomalies: [],
    sequenceLearning: {
      status: "GAP_UNKNOWN_STRUCTURE",
    },
  };
}

function loadOrchestrationState() {
  return loadDocument(ORCHESTRATION_STATE_KEY, defaultOrchestrationState, {
    legacyPath: ORCHESTRATION_STATE_PATH,
  });
}

function saveOrchestrationState(value) {
  return saveDocument(ORCHESTRATION_STATE_KEY, value, {
    legacyPath: ORCHESTRATION_STATE_PATH,
  });
}

function defaultBacktestState() {
  return {
    createdAt: nowIso(),
    updatedAt: nowIso(),
    derivedRecords: [],
  };
}

function loadBacktestState() {
  return loadDocument(BACKTEST_STATE_KEY, defaultBacktestState, {
    legacyPath: BACKTEST_STATE_PATH,
  });
}

function transactRuntimeState(work) {
  return transactDocuments(({ read, write }) =>
    work({
      orchestration: read(ORCHESTRATION_STATE_KEY, defaultOrchestrationState()),
      reviewSurface: read(REVIEW_SURFACE_KEY, defaultReviewSurfaceState()),
      backtests: read(BACKTEST_STATE_KEY, defaultBacktestState()),
      saveOrchestration(next) {
        return write(ORCHESTRATION_STATE_KEY, next, { legacyPath: ORCHESTRATION_STATE_PATH });
      },
      saveReviewSurface(next) {
        return write(REVIEW_SURFACE_KEY, next, { legacyPath: REVIEW_SURFACE_PATH });
      },
      saveBacktests(next) {
        return write(BACKTEST_STATE_KEY, next, { legacyPath: BACKTEST_STATE_PATH });
      },
    })
  );
}

function addImmutableAuditEvent(eventType, message, payload = {}, actor = "system") {
  return appendAuditEvent({
    type: "execution_orchestration",
    actor,
    eventType,
    message,
    payload,
  });
}

function nowIso() {
  return getDatabaseNowIso();
}

function nowMs() {
  return getDatabaseNowMs();
}

function mapLogEntryToExecutionAuditEvents(run, entry = {}) {
  const createdAt = new Date(Number(entry.timestamp || nowMs())).toISOString();
  const executionId = String(run.runId || run.id || "");
  if (!executionId) {
    return [];
  }

  if (entry.eventType === "run_staged") {
    return [
      {
        executionId,
        eventType: "execution.created",
        createdAt,
        payload: {
          status: "pending",
        },
      },
      ...(run.steps || []).map((step) => ({
        executionId,
        stepId: step.id,
        eventType: "step.created",
        createdAt,
        payload: {
          sequence: step.sequence || null,
          kind: step.kind || step.actionClass || step.action || step.tool || "step",
        },
      })),
    ];
  }

  if (entry.eventType === "review_stage") {
    if (entry.status === "awaiting_review") {
      return [];
    }
    return [
      {
        executionId,
        eventType: "execution.paused",
        createdAt,
        payload: {
          reason: "review_requested",
        },
      },
      {
        executionId,
        eventType: "review.requested",
        createdAt,
        payload: {
          status: "pending",
        },
      },
    ];
  }

  if (entry.eventType === "execution_start") {
    return [
      {
        executionId,
        eventType: "execution.started",
        createdAt,
        payload: {
          status: "running",
        },
      },
    ];
  }

  if (entry.eventType === "verification") {
    return [
      {
        executionId,
        eventType: entry.status === "completed" ? "execution.completed" : "execution.failed",
        createdAt,
        payload: {
          status: entry.status,
        },
      },
    ];
  }

  if (entry.eventType === "step_status") {
    if (entry.status === "running") {
      return [
        {
          executionId,
          stepId: entry.stepId,
          eventType: "step.started",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (entry.status === "completed") {
      return [
        {
          executionId,
          stepId: entry.stepId,
          eventType: "step.completed",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (["failed", "timeout", "blocked"].includes(String(entry.status || ""))) {
      return [
        {
          executionId,
          stepId: entry.stepId,
          eventType: "step.failed",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (entry.status === "deferred") {
      return [
        {
          executionId,
          stepId: entry.stepId,
          eventType: "step.deferred",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (entry.status === "skipped") {
      return [
        {
          executionId,
          stepId: entry.stepId,
          eventType: "step.skipped",
          createdAt,
          payload: entry,
        },
      ];
    }
  }

  if (entry.eventType === "stage_status") {
    if (entry.status === "running") {
      return [
        {
          executionId,
          eventType: entry.resumed ? "stage.resumed" : "stage.started",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (entry.status === "paused_for_review") {
      return [
        {
          executionId,
          eventType: "stage.paused_for_review",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (entry.status === "completed") {
      return [
        {
          executionId,
          eventType: "stage.completed",
          createdAt,
          payload: entry,
        },
      ];
    }
    if (entry.status === "failed") {
      return [
        {
          executionId,
          eventType: "stage.failed",
          createdAt,
          payload: entry,
        },
      ];
    }
  }

  return [];
}

function buildSnapshotAuditEvents(run, reviewRecord) {
  if (!reviewRecord || !reviewRecord.runId) {
    return [];
  }

  const createdAt = String(reviewRecord.updatedAt || reviewRecord.createdAt || nowIso());
  if (reviewRecord.status === "pending") {
    return [
      {
        executionId: reviewRecord.runId,
        eventType: "review.requested",
        createdAt,
        payload: {
          reviewMode: reviewRecord.reviewMode || "standard",
          stepCount: Array.isArray(reviewRecord.steps) ? reviewRecord.steps.length : 0,
        },
      },
      {
        executionId: reviewRecord.runId,
        eventType: "execution.paused",
        createdAt,
        payload: {
          reason: "review_requested",
        },
      },
    ];
  }

  if (["blocked", "rejected"].includes(String(reviewRecord.status || "").toLowerCase())) {
    return [
      {
        executionId: reviewRecord.runId,
        eventType: "review.rejected",
        createdAt,
        payload: {
          summary: reviewRecord.summary || null,
        },
      },
    ];
  }

  return [];
}

function sequenceLearningGap() {
  return {
    status: "GAP_UNKNOWN_STRUCTURE",
    reason: "Sequence tracking schema is not verified in the repo audit.",
  };
}

function normalizeExecutionMode(mode = "blocked") {
  if (mode === "auto_execute") {
    return "safe_execute";
  }
  return ["simulate", "safe_execute", "confirm_required", "blocked"].includes(String(mode))
    ? String(mode)
    : "blocked";
}

function createRunId(plan = {}) {
  return String(plan.runId || `run_${nowMs()}_${Math.random().toString(36).slice(2, 8)}`);
}

function inferResourceTargets(step = {}) {
  const targets = new Set();
  const payload = step.payload;
  if (typeof payload === "string" && payload.trim()) {
    targets.add(`${step.action || step.tool || "step"}:${payload.trim()}`);
  }
  if (payload && typeof payload === "object") {
    for (const key of ["path", "name", "jobId", "taskId", "alertId", "agentName", "workspaceId", "reportId", "briefId"]) {
      if (payload[key]) {
        targets.add(`${step.action || step.tool || "step"}:${String(payload[key])}`);
      }
    }
  }
  if (targets.size === 0) {
    targets.add(`${step.action || step.tool || "step"}:global`);
  }
  return [...targets];
}

function cloneValue(value) {
  if (value === undefined) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value ?? null;
  }
}

function normalizeStepForStage(step = {}, stageId, globalSequence, indexInStage) {
  const originalInput = cloneValue(step.originalInput ?? step.payload ?? step.command ?? null);
  const normalizedInput = cloneValue(step.normalizedInput ?? originalInput);
  const rewritten = JSON.stringify(normalizedInput) !== JSON.stringify(originalInput);
  return {
    ...step,
    id: String(step.id || `step_${globalSequence}`),
    stageId,
    stageSequence: indexInStage + 1,
    sequence: Number.isFinite(Number(step.sequence)) ? Number(step.sequence) : globalSequence,
    originalInput,
    normalizedInput,
    rewritten,
    rewriteReason: rewritten ? String(step.rewriteReason || "normalized_input_changed") : null,
    normalizationNote: step.normalizationNote
      ? String(step.normalizationNote)
      : rewritten
        ? "Step input differs from its original form and must be surfaced for review."
        : null,
    deferred: Boolean(step.deferred),
    blockReason: step.blockReason ? String(step.blockReason) : null,
    reviewAcknowledged: Boolean(step.reviewAcknowledged),
    status: String(step.status || "pending"),
  };
}

function normalizeExecutionStages(plan = {}) {
  const sourceStages = Array.isArray(plan.stages) ? plan.stages : null;
  const derivedStages = sourceStages !== null
    ? sourceStages
    : [{
      id: "stage_default",
      name: "Default Stage",
      requiresReview: Boolean(plan.requiresReview),
      steps: Array.isArray(plan.steps) ? plan.steps : [plan],
    }];

  let globalSequence = 1;
  return derivedStages.map((stage, stageIndex) => {
    const stageId = String(stage.id || `stage_${stageIndex + 1}`);
    const stageSteps = Array.isArray(stage.steps) ? stage.steps : [];
    const normalizedSteps = stageSteps.map((step, indexInStage) =>
      normalizeStepForStage(step, stageId, globalSequence++, indexInStage)
    );
    return {
      id: stageId,
      name: String(stage.name || `Stage ${stageIndex + 1}`),
      sequence: Number.isFinite(Number(stage.sequence)) ? Number(stage.sequence) : stageIndex + 1,
      status: String(stage.status || "pending"),
      requiresReview: Boolean(stage.requiresReview),
      steps: normalizedSteps,
    };
  });
}

function findStage(run, stageId) {
  return (run.stages || []).find((stage) => stage.id === stageId) || null;
}

function updateStep(run, stepId, changes = {}) {
  return {
    ...run,
    steps: (run.steps || []).map((step) =>
      step.id === stepId
        ? {
          ...step,
          ...changes,
          updatedAt: nowIso(),
        }
        : step
    ),
  };
}

function setStageStatus(run, stageId, status, extra = {}) {
  const nextRun = {
    ...run,
    stages: (run.stages || []).map((stage) =>
      stage.id === stageId
        ? {
          ...stage,
          status,
          updatedAt: nowIso(),
          ...extra,
        }
        : stage
    ),
  };
  return appendExecutionLog(nextRun, {
    eventType: "stage_status",
    stageId,
    status,
    timestamp: nowMs(),
    ...extra,
  });
}

function prepareStepForReview(run, stepId, extra = {}) {
  const step = (run.steps || []).find((entry) => entry.id === stepId);
  if (!step) {
    return { run, pauseSignal: null };
  }

  const rewritten = JSON.stringify(step.normalizedInput ?? null) !== JSON.stringify(step.originalInput ?? null);
  const deferred = Boolean(step.deferred);
  const blocked = Boolean(step.blockReason);
  const requiresReview = Boolean(
    (step.requiresReview || rewritten || deferred || (blocked && !step.safeFallback)) && !step.reviewAcknowledged
  );

  const nextRun = updateStep(run, stepId, {
    rewritten,
    requiresReview,
    rewriteReason: rewritten ? step.rewriteReason || "normalized_input_changed" : step.rewriteReason || null,
    normalizationNote: rewritten
      ? step.normalizationNote || "Step input differs from its original form and requires operator review."
      : step.normalizationNote || null,
    pauseReason: blocked
      ? step.blockReason
      : deferred
        ? step.deferReason || "step_deferred"
        : rewritten
          ? step.rewriteReason || "normalized_input_changed"
          : step.pauseReason || null,
    ...extra,
  });

  if (!requiresReview) {
    return { run: nextRun, pauseSignal: null };
  }

  return {
    run: nextRun,
    pauseSignal: {
      status: "paused_for_review",
      reason: nextRun.steps.find((entry) => entry.id === stepId)?.pauseReason || "review_required",
    },
  };
}

function queueEntryForRun(run, reason = "forced_manual_review") {
  return {
    runId: run.runId,
    originalRequest: run.originalRequest,
    queuedAt: nowMs(),
    reason,
    executionMode: run.executionMode,
    stepIds: (run.steps || []).map((step) => step.id),
  };
}

function computeHistoricalMetrics(orchestration, rules) {
  const now = nowMs();
  const recentRuns = (orchestration.runs || []).filter((run) => now - new Date(run.updatedAt || run.createdAt || now).getTime() <= rules.autoApprovalWindowMs);
  const completedRuns = recentRuns.filter((run) =>
    (run.steps || []).some((step) => step.status === "completed")
  );
  const failedRuns = recentRuns.filter((run) =>
    (run.steps || []).some((step) => ["failed", "timeout", "blocked"].includes(step.status))
  );
  const durations = completedRuns
    .flatMap((run) => (run.steps || []).map((step) => Number(step.duration || 0)))
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageDuration = durations.length
    ? durations.reduce((sum, value) => sum + value, 0) / durations.length
    : 0;
  const disagreementCount = (orchestration.approvalQueue || []).filter((entry) => entry.reason === "forced_manual_review").length;
  return {
    recentRuns,
    completedRuns,
    failedRuns,
    averageDuration,
    disagreementRate: recentRuns.length ? disagreementCount / recentRuns.length : 0,
  };
}

function detectAnomalies(run, orchestration, rules = loadExecutionRules()) {
  const metrics = computeHistoricalMetrics(orchestration, rules);
  const anomalies = [];
  const currentDurations = (run.steps || []).map((step) => Number(step.duration || 0)).filter((value) => value > 0);
  const averageCurrentDuration = currentDurations.length
    ? currentDurations.reduce((sum, value) => sum + value, 0) / currentDurations.length
    : 0;
  const currentFailureRate = metrics.recentRuns.length
    ? (metrics.failedRuns.length + (run.steps || []).filter((step) => ["failed", "timeout", "blocked"].includes(step.status)).length) /
      (metrics.recentRuns.length + 1)
    : 0;

  if (metrics.recentRuns.length + 1 > rules.anomalyThresholds.maxExecutionsPerWindow) {
    anomalies.push("execution_frequency_spike");
  }
  if (
    metrics.averageDuration &&
    Math.abs(averageCurrentDuration - metrics.averageDuration) > rules.anomalyThresholds.maxDurationDeviationMs
  ) {
    anomalies.push("historical_timing_deviation");
  }
  if (currentFailureRate > rules.anomalyThresholds.maxFailureRate) {
    anomalies.push("failure_rate_increase");
  }
  if (metrics.disagreementRate > rules.anomalyThresholds.maxOperatorDisagreementRate) {
    anomalies.push("operator_disagreement_pattern");
  }
  return anomalies;
}

function enterSafeMode(orchestration, reason) {
  const next = {
    ...orchestration,
    globalState: "safe_mode",
    updatedAt: nowIso(),
    safeMode: {
      enabled: true,
      enteredAt: nowIso(),
      reason,
    },
  };
  addImmutableAuditEvent("anomaly_threshold_breach", `Safe mode entered: ${reason}.`, { reason }, "system");
  return next;
}

function exitSafeMode(operator = {}, reason = "") {
  return transactRuntimeState(({ orchestration, saveOrchestration }) => {
    const next = {
      ...orchestration,
      globalState: "idle",
      updatedAt: nowIso(),
      safeMode: {
        enabled: false,
        enteredAt: null,
        reason: null,
        exitedAt: nowIso(),
        exitedBy: String(operator.id || operator.name || "operator"),
        exitReason: String(reason || "explicit_operator_exit"),
      },
    };
    saveOrchestration(next);
    addImmutableAuditEvent("safe_mode_exit", "Safe mode exited by explicit operator action.", {
      operatorId: operator.id || null,
      reason: String(reason || "explicit_operator_exit"),
    }, "operator");
    return next;
  });
}

function evaluateApprovalThrottle(run, orchestration, rules = loadExecutionRules()) {
  const now = nowMs();
  const queue = (orchestration.approvalQueue || []).filter((entry) => {
    const age = now - Number(entry.queuedAt || now);
    if (age > rules.maxQueueWaitMs) {
      addImmutableAuditEvent("queue_timeout", `Approval queue item ${entry.runId} timed out.`, entry, "system");
      return false;
    }
    return true;
  });

  if (queue.length !== (orchestration.approvalQueue || []).length) {
    return {
      status: "forced_manual_review",
      queue,
      queueTimedOut: true,
    };
  }

  const metrics = computeHistoricalMetrics({ ...orchestration, approvalQueue: queue }, rules);
  if (metrics.completedRuns.length >= rules.autoApprovalMaxPerWindow) {
    const nextQueue = [...queue, queueEntryForRun(run, "throttled_auto_approval")];
    if (nextQueue.length > rules.maxQueueDepth) {
      addImmutableAuditEvent("queue_overflow", `Approval queue overflow for ${run.runId}.`, { runId: run.runId }, "system");
      return {
        status: "forced_manual_review",
        queue,
        overflow: true,
      };
    }
    return {
      status: "queued",
      queue: nextQueue,
    };
  }

  return {
    status: "approved",
    queue,
  };
}

function recordRun(run) {
  transactRuntimeState(({ orchestration, saveOrchestration }) => {
    const next = {
      ...orchestration,
      updatedAt: nowIso(),
      globalState: run.globalState || orchestration.globalState || "idle",
      sequenceLearning: orchestration.sequenceLearning || sequenceLearningGap(),
      runs: [
        run,
        ...(orchestration.runs || []).filter((entry) => entry.runId !== run.runId),
      ].slice(0, 100),
    };
    saveOrchestration(next);
  });
  return run;
}

function saveRuntimeCaches(run, reviewRecord = null, extras = {}) {
  return transactRuntimeState(({ orchestration, reviewSurface, saveOrchestration, saveReviewSurface }) => {
    const nextOrchestration = {
      ...orchestration,
      updatedAt: nowIso(),
      globalState: extras.globalState || run.globalState || orchestration.globalState || "idle",
      approvalQueue: extras.approvalQueue || orchestration.approvalQueue || [],
      anomalies: extras.anomalies || orchestration.anomalies || [],
      safeMode: extras.safeMode || orchestration.safeMode || { enabled: false, enteredAt: null, reason: null },
      sequenceLearning: orchestration.sequenceLearning || sequenceLearningGap(),
      runs: [
        run,
        ...(orchestration.runs || []).filter((entry) => entry.runId !== run.runId),
      ].slice(0, 100),
    };
    saveOrchestration(nextOrchestration);

    if (reviewRecord) {
      saveReviewSurface({
        ...reviewSurface,
        updatedAt: nowIso(),
        reviews: [
          reviewRecord,
          ...(reviewSurface.reviews || []),
        ],
      });
    }

    return nextOrchestration;
  });
}

function commitRuntimeSnapshot(run, reviewRecord = null, extras = {}) {
  const snapshot = saveRuntimeCaches(run, reviewRecord, extras);

  persistExecutionSnapshot(run, {
    triggerSource: run.triggerSource || "system",
    reviewRecord,
    auditEvents: buildSnapshotAuditEvents(run, reviewRecord),
  });
  return snapshot;
}

function appendExecutionLog(run, entry) {
  const nextRun = {
    ...run,
    updatedAt: nowIso(),
    logs: [...(run.logs || []), entry].slice(-500),
  };
  recordRun(nextRun);
  addImmutableAuditEvent(
    entry.eventType || entry.status,
    `${entry.stepId || nextRun.runId}: ${entry.status}`,
    entry,
    "engine"
  );
  const auditEvents = mapLogEntryToExecutionAuditEvents(nextRun, entry);
  persistExecutionSnapshot(nextRun, {
    triggerSource: nextRun.triggerSource || "system",
    auditEvents,
  });
  return nextRun;
}

function setStepStatus(run, stepId, status, extra = {}) {
  const nextRun = {
    ...run,
    steps: (run.steps || []).map((step) =>
      step.id === stepId
        ? {
          ...step,
          status,
          updatedAt: nowIso(),
          ...extra,
        }
        : step
    ),
  };
  return appendExecutionLog(nextRun, {
    eventType: "step_status",
    stepId,
    status,
    timestamp: nowMs(),
    ...extra,
  });
}

function createStagedRun(plan, modes = {}, options = {}) {
  const rules = loadExecutionRules();
  const executionMode = normalizeExecutionMode(
    modes.executionMode || plan.finalMode || plan.proposedMode || "blocked"
  );
  const stages = normalizeExecutionStages(plan);
  const steps = stages.flatMap((stage) => stage.steps);
  const run = {
    runId: createRunId(plan),
    originalRequest: String(plan.originalRequest || ""),
    triggerSource: String(modes.triggerSource || plan.triggerSource || "system"),
    reviewStatus: String(plan.reviewStatus || "pending"),
    executionMode,
    globalState: executionMode === "blocked" ? "error" : "paused",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    retries: 0,
    planType: String(plan.type || "single"),
    timeoutMs: Number(options.timeoutMs || modes.systemTimeoutSeconds * 1000 || rules.defaultTimeoutMs),
    stages: stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      sequence: stage.sequence,
      status: stage.status,
      requiresReview: stage.requiresReview,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })),
    steps: steps.map((step) => ({
      ...step,
      status: ["staged", "pending", "running", "completed", "failed", "blocked", "deferred", "paused_for_review"].includes(step.status)
        ? step.status
        : "pending",
      retries: Number(step.retries || 0),
      resourceTargets: inferResourceTargets(step),
      dependsOn: Array.isArray(step.dependsOn)
        ? step.dependsOn.map((value) => String(value))
        : step.requiresPrerequisite
          ? [String(step.requiresPrerequisite)]
          : [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })),
    logs: [],
  };
  return appendExecutionLog(recordRun(run), {
    eventType: "run_staged",
    status: "staged",
    timestamp: nowMs(),
  });
}

function canRunInParallel(steps = [], rules = loadExecutionRules()) {
  if (!rules.allowParallelSafeSteps || steps.length <= 1) {
    return false;
  }
  const seenTargets = new Set();
  for (const step of steps) {
    const risky = ["mutate", "delete", "execute", "network", "process", "plugin"].includes(step.actionClass);
    if (risky) {
      return false;
    }
    for (const target of inferResourceTargets(step)) {
      if (seenTargets.has(target)) {
        return false;
      }
      seenTargets.add(target);
    }
  }
  return true;
}

function lockResources(resourceIds = [], task) {
  const keys = [...new Set(resourceIds.map((value) => String(value)).filter(Boolean))].sort();
  const heldLocks = [];

  async function acquire() {
    for (const key of keys) {
      const previous = resourceQueues.get(key) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => {
        release = resolve;
      });
      resourceQueues.set(key, previous.then(() => current));
      await previous;
      heldLocks.push({ key, current, release });
    }
  }

  return (async () => {
    try {
      await acquire();
      return await task();
    } finally {
      heldLocks.forEach(({ key, current, release }) => {
        release();
        if (resourceQueues.get(key) === current) {
          resourceQueues.delete(key);
        }
      });
    }
  })();
}

function enforceIdempotency(step = {}) {
  if (["running", "completed"].includes(String(step.status || ""))) {
    return {
      ok: false,
      error: `Step ${step.id} is not retry-safe because it already reached ${step.status}.`,
      reviewRequired: false,
    };
  }

  const sideEffectClass = String(
    step.sideEffectClass
    || step.metadata?.sideEffectClass
    || step.effectClass
    || step.actionClass
    || step.action
    || step.kind
    || "unknown"
  ).trim().toLowerCase();
  const normalizedSideEffectClass =
    sideEffectClass === "read"
    || sideEffectClass === "read_file"
    || sideEffectClass === "list"
    || sideEffectClass === "inspect"
    || sideEffectClass === "query"
    || sideEffectClass === "fetch"
      ? "pure_read"
      : sideEffectClass === "write"
        || sideEffectClass === "write_file"
        || sideEffectClass === "create"
        || sideEffectClass === "update"
        || sideEffectClass === "mutate"
        || sideEffectClass === "edit"
          ? "local_write"
          : sideEffectClass === "delete"
            || sideEffectClass === "remove"
            || sideEffectClass === "destroy"
              ? "destructive"
              : sideEffectClass === "network"
                || sideEffectClass === "http"
                || sideEffectClass === "api_call"
                || sideEffectClass === "plugin"
                  ? "network_call"
                  : sideEffectClass === "execute"
                    || sideEffectClass === "shell"
                    || sideEffectClass === "run_command"
                      ? "external_write"
                      : sideEffectClass || "unknown";
  const sideEffects = Array.isArray(step.sideEffects)
    ? step.sideEffects
    : Array.isArray(step.metadata?.sideEffects)
      ? step.metadata.sideEffects
      : [];
  const normalizedSideEffects = sideEffects
    .map((entry) => String(entry).trim().toLowerCase())
    .filter(Boolean);
  const hasUnknownSideEffects =
    normalizedSideEffectClass === "unknown" || normalizedSideEffects.includes("unknown");
  const hasDeclaredSideEffects = normalizedSideEffects.length > 0;
  const hasIdempotencyEvidence = Boolean(
    step.idempotencyKey
    || step.metadata?.idempotencyKey
    || step.isIdempotent === true
    || step.metadata?.idempotent === true
    || String(step.idempotencyClass || "").trim().toLowerCase() === "safe_repeat"
  );
  const explicitlyNonIdempotent =
    step.isIdempotent === false || step.metadata?.idempotent === false;
  const hasOperatorApproval =
    step.reviewAcknowledged === true || step.metadata?.reviewAcknowledged === true;

  if (hasUnknownSideEffects) {
    return {
      ok: false,
      error: `Step ${step.id} requires operator review because its side effects are unknown.`,
      reviewRequired: true,
      reason: "unknown_side_effects",
      code: "REVIEW_REQUIRED",
    };
  }

  if (["destructive", "human_review"].includes(normalizedSideEffectClass)) {
    return {
      ok: false,
      error: `Step ${step.id} requires operator review before executing ${normalizedSideEffectClass} work.`,
      reviewRequired: true,
      reason: "operator_approval_required",
      code: "REVIEW_REQUIRED",
    };
  }

  if (["local_write", "network_call", "external_write"].includes(normalizedSideEffectClass)) {
    if (hasOperatorApproval) {
      return { ok: true };
    }

    if (!hasDeclaredSideEffects) {
      return {
        ok: false,
        error: `Step ${step.id} requires declared side effects before executing ${normalizedSideEffectClass} work.`,
        reviewRequired: true,
        reason: "side_effects_required",
        code: "REVIEW_REQUIRED",
      };
    }

    if (explicitlyNonIdempotent || !hasIdempotencyEvidence) {
      return {
        ok: false,
        error: `Step ${step.id} requires operator review because idempotency evidence is missing for ${normalizedSideEffectClass} work.`,
        reviewRequired: true,
        reason: "idempotency_key_required",
        code: "IDEMPOTENCY_KEY_REQUIRED",
      };
    }
  }

  return { ok: true };
}

function enforceCapabilities(step = {}, rules = loadExecutionRules()) {
  const blocked = (step.permissions || []).find((permission) =>
    (rules.blockedCapabilities || []).includes(String(permission))
  );
  if (blocked) {
    return {
      ok: false,
      error: `Capability ${blocked} is blocked by execution rules.`,
    };
  }
  return { ok: true };
}

function startHeartbeat(runId, stepId, intervalMs) {
  return setInterval(() => {
    const state = loadOrchestrationState();
    const run = (state.runs || []).find((entry) => entry.runId === runId);
    if (!run) {
      return;
    }
    appendExecutionLog(run, {
      eventType: "heartbeat",
      stepId,
      status: "running",
      timestamp: nowMs(),
      heartbeat: true,
    });
  }, intervalMs);
}

function stopHeartbeat(timer) {
  if (timer) {
    clearInterval(timer);
  }
}

function recoverOrchestrationState() {
  const rules = loadExecutionRules();
  const state = loadOrchestrationState();
  let changed = false;
  const now = nowMs();
  const runs = (state.runs || []).map((run) => {
    if (!["running", "recovery"].includes(String(run.globalState || ""))) {
      return run;
    }
    const nextSteps = (run.steps || []).map((step) => {
      if (step.status !== "running") {
        return step;
      }
      const startedAt = Number(step.startedAt || 0);
      const lastHeartbeatAt = Number(step.lastHeartbeatAt || startedAt || 0);
      const timedOut =
        (startedAt && now - startedAt > Number(run.timeoutMs || rules.defaultTimeoutMs)) ||
        (lastHeartbeatAt && now - lastHeartbeatAt > Number(rules.heartbeatTimeoutMs));
      if (!timedOut) {
        return step;
      }
      changed = true;
      appendAuditEvent({
        type: "execution_recovery_timeout",
        actor: "system",
        eventType: "timeout",
        message: `Recovered timed-out step ${step.id}.`,
        payload: { runId: run.runId, stepId: step.id },
      });
      return {
        ...step,
        status: "timeout",
        updatedAt: nowIso(),
        error: "Recovered as timeout during orchestration bootstrap.",
      };
    });
    return {
      ...run,
      globalState: nextSteps.some((step) => step.status === "timeout") ? "recovery" : run.globalState,
      steps: nextSteps,
      updatedAt: nowIso(),
    };
  });

  if (!changed) {
    return state;
  }

  return saveOrchestrationState({
    ...state,
    globalState: "recovery",
    updatedAt: nowIso(),
    runs,
  });
}

function initializeExecutionOrchestration(options = {}) {
  const state = recoverOrchestrationState();
  const next = {
    ...state,
    updatedAt: nowIso(),
    bootstraps: [
      {
        bootstrap: String(options.bootstrap || "unknown"),
        timestamp: nowIso(),
      },
      ...(state.bootstraps || []),
    ].slice(0, 20),
  };
  saveOrchestrationState(next);
  return next;
}

function recordBacktest(record = {}, options = {}) {
  if (!options.initiatedByOperator) {
    throw new Error("Backtesting must be operator-initiated only.");
  }
  return transactRuntimeState(({ backtests, saveBacktests }) => {
    const derivedRecord = {
      id: String(record.id || `backtest_${nowMs()}`),
      createdAt: nowIso(),
      namespace: "backtest",
      ...record,
    };
    const next = {
      ...backtests,
      updatedAt: nowIso(),
      derivedRecords: [derivedRecord, ...(backtests.derivedRecords || [])].slice(0, 200),
    };
    saveBacktests(next);
    addImmutableAuditEvent("backtest_recorded", `Recorded isolated backtest ${derivedRecord.id}.`, {
      id: derivedRecord.id,
      namespace: "backtest",
    }, "operator");
    return derivedRecord;
  });
}

module.exports = {
  appendExecutionLog,
  canRunInParallel,
  commitRuntimeSnapshot,
  createStagedRun,
  detectAnomalies,
  enterSafeMode,
  enforceCapabilities,
  enforceIdempotency,
  evaluateApprovalThrottle,
  exitSafeMode,
  inferResourceTargets,
  initializeExecutionOrchestration,
  loadExecutionRules,
  loadOrchestrationState,
  loadBacktestState,
  lockResources,
  normalizeExecutionMode,
  normalizeExecutionStages,
  prepareStepForReview,
  recordRun,
  recordBacktest,
  recoverOrchestrationState,
  saveRuntimeCaches,
  setStageStatus,
  setStepStatus,
  startHeartbeat,
  stopHeartbeat,
  validateExecutionRules,
  findStage,
  updateStep,
};
