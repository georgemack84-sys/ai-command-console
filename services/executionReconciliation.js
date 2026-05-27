const {
  EXECUTION_STATE_SCHEMA_VERSION,
  LEASE_DURATION_MS,
  OPERATOR_RECOVERY_TTL_MS,
  acquireExecutionLock,
  appendLedgerEvent,
  cancelExecutionAttempt,
  enqueueOperatorRecovery,
  expireOperatorRecoveryItems,
  listExecutionAttempts,
  listExecutionLocks,
  listLedgerEvents,
  listRecoveryQueue,
  releaseExecutionLock,
} = require("./executionIntegrityStore");
const {
  checkpointAfterStep,
  failExecutionCheckpoint,
  finalizeExecutionTransition,
  loadExecutionCheckpoint,
  loadExecutionState,
  setExecutionCheckpointStatus,
} = require("./executionStateStore");
const { getDatabaseNowMs, withDatabase } = require("./stateDatabase");
const { withTransaction } = require("./transaction");

const MAX_EXECUTION_DURATION_MS = 3600000;
const MAX_EXECUTION_ATTEMPTS = 50;
const RETRYABLE_SIDE_EFFECT_CLASSES = new Set(["pure_read", "local_write"]);
const IDEMPOTENT_RETRY_CLASSES = new Set(["network_call", "external_write"]);
const OPERATOR_RECOVERY_CLASSES = new Set(["destructive", "human_review", "unknown"]);

function success(data) {
  return { ok: true, data };
}

function failure(code, message, details = {}) {
  return { ok: false, code, message, ...details };
}

function inferSideEffectClass(step = {}, metadata = {}) {
  const explicit = String(
    step.sideEffectClass
    || metadata.sideEffectClass
    || step.effectClass
    || ""
  ).trim().toLowerCase();
  if (explicit) {
    return explicit;
  }

  const action = String(step.action || step.actionClass || step.kind || "").trim().toLowerCase();
  if (["read", "read_file", "list", "inspect", "query", "fetch"].includes(action)) {
    return "pure_read";
  }
  if (["write", "write_file", "create", "update", "mutate", "edit"].includes(action)) {
    return "local_write";
  }
  if (["delete", "remove", "destroy"].includes(action)) {
    return "destructive";
  }
  if (["network", "http", "api_call", "plugin"].includes(action)) {
    return "network_call";
  }
  if (["execute", "shell", "run_command"].includes(action)) {
    return "external_write";
  }
  return "unknown";
}

function normalizeCheckpointPlan(plan = {}) {
  const rawSteps = Array.isArray(plan.steps)
    ? plan.steps
    : Array.isArray(plan.stages)
      ? plan.stages.flatMap((stage) => (Array.isArray(stage.steps) ? stage.steps : []))
      : [];

  return {
    id: plan.planId ? String(plan.planId) : plan.id ? String(plan.id) : "",
    steps: rawSteps.map((step, index) => {
      const metadata = step.metadata && typeof step.metadata === "object" ? step.metadata : {};
      const idempotent =
        metadata.idempotent === true
        || String(step.idempotencyClass || "").trim().toLowerCase() === "safe_repeat";
      const sideEffectClass = inferSideEffectClass(step, metadata);

      return {
        id: String(step.id || `step_${index}`),
        metadata: {
          idempotent,
          idempotencyKey: step.idempotencyKey || metadata.idempotencyKey || null,
          retryStrategy:
            metadata.retryStrategy === "safe" || metadata.retryStrategy === "manual_only"
              ? metadata.retryStrategy
              : idempotent
                ? "safe"
                : "manual_only",
          sideEffectClass,
          sideEffects: Array.isArray(step.sideEffects)
            ? step.sideEffects.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean)
            : Array.isArray(metadata.sideEffects)
              ? metadata.sideEffects.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean)
              : [],
        },
      };
    }),
  };
}

function groupBy(items, keyFn) {
  const grouped = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  }
  return grouped;
}

function collectExecutionLifecycleIssues(ledger = [], checkpoint = null, activeExecutionId = null) {
  const issues = [];
  const targetExecutionIds = new Set(
    [activeExecutionId]
      .concat(ledger.map((entry) => entry.executionId))
      .filter((value) => String(value || "").trim()),
  );

  for (const executionId of targetExecutionIds) {
    const executionLedger = ledger
      .filter((entry) => String(entry.executionId || "") === String(executionId))
      .sort((left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0) || Number(left.id || 0) - Number(right.id || 0));
    if (!executionLedger.length) {
      continue;
    }

    const createdEvents = executionLedger.filter((entry) => entry.eventType === "execution.created");
    const startedEvents = executionLedger.filter((entry) => entry.eventType === "execution.started");
    const terminalEvents = executionLedger.filter((entry) =>
      ["execution.completed", "execution.failed", "execution.cancelled", "execution.abandoned", "execution.corrupted"].includes(entry.eventType),
    );

    if (createdEvents.length > 1) {
      issues.push({
        code: "LEDGER_INVALID",
        message: `Execution ${executionId} has duplicate execution.created ledger entries.`,
      });
    }
    if (startedEvents.length > 1) {
      issues.push({
        code: "LEDGER_INVALID",
        message: `Execution ${executionId} has duplicate execution.started ledger entries.`,
      });
    }
    if (terminalEvents.length > 1) {
      issues.push({
        code: "LEDGER_INVALID",
        message: `Execution ${executionId} has multiple terminal ledger entries.`,
      });
    }
    if ((startedEvents.length > 0 || terminalEvents.length > 0) && createdEvents.length !== 1) {
      issues.push({
        code: "LEDGER_INVALID",
        message: `Execution ${executionId} is missing a single execution.created ledger entry.`,
      });
    }
    if (terminalEvents.length === 1 && startedEvents.length !== 1) {
      issues.push({
        code: "LEDGER_INVALID",
        message: `Execution ${executionId} reached a terminal state without a single execution.started ledger entry.`,
      });
    }

    const stageGroups = groupBy(
      executionLedger.filter((entry) => /^stage\./.test(String(entry.eventType || ""))),
      (entry) => String(entry.eventPayload?.stageId || entry.stepId || "unknown"),
    );
    for (const [stageId, stageEvents] of stageGroups) {
      const started = stageEvents.filter((entry) => ["stage.started", "stage.resumed"].includes(entry.eventType));
      const terminal = stageEvents.filter((entry) => ["stage.completed", "stage.failed"].includes(entry.eventType));
      if (terminal.length > 1) {
        issues.push({
          code: "LEDGER_INVALID",
          message: `Stage ${stageId} in execution ${executionId} has multiple terminal ledger entries.`,
        });
      }
      if (stageEvents.some((entry) => ["stage.completed", "stage.failed", "stage.paused_for_review"].includes(entry.eventType)) && started.length === 0) {
        issues.push({
          code: "LEDGER_INVALID",
          message: `Stage ${stageId} in execution ${executionId} has terminal or paused ledger entries without a prior start.`,
        });
      }
    }

    if (checkpoint && ["completed", "failed", "cancelled", "execution_abandoned", "corrupted"].includes(String(checkpoint.status || ""))) {
      const expectedTerminal = checkpoint.status === "execution_abandoned"
        ? "execution.abandoned"
        : checkpoint.status === "cancelled"
          ? "execution.cancelled"
          : checkpoint.status === "corrupted"
            ? "execution.corrupted"
            : `execution.${checkpoint.status}`;
      if (!executionLedger.some((entry) => entry.eventType === expectedTerminal)) {
        issues.push({
          code: "LEDGER_MISSING",
          message: `Checkpoint ${checkpoint.planId} is ${checkpoint.status} without matching ${expectedTerminal} ledger entry.`,
        });
      }
    }
  }

  return issues;
}

function loadLatestExecutionSnapshot(planId) {
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

function buildReplaySummary(ledger = [], snapshot = null, checkpoint = null) {
  const executionIds = [...new Set(ledger.map((entry) => String(entry.executionId || "")).filter(Boolean))];
  const terminalEvents = ledger.filter((entry) =>
    ["execution.completed", "execution.failed", "execution.cancelled", "execution.abandoned", "execution.corrupted"].includes(String(entry.eventType || "")),
  );
  const latestTerminalEvent = terminalEvents.length ? terminalEvents[terminalEvents.length - 1] : null;
  const orderedLedger = [...ledger].sort(
    (left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0) || Number(left.id || 0) - Number(right.id || 0),
  );

  const stages = [...new Set(
    orderedLedger
      .filter((entry) => /^stage\./.test(String(entry.eventType || "")))
      .map((entry) => String(entry.eventPayload?.stageId || ""))
      .filter(Boolean),
  )].map((stageId) => {
    const stageEvents = orderedLedger.filter((entry) => String(entry.eventPayload?.stageId || "") === stageId);
    const lastEvent = stageEvents.length ? stageEvents[stageEvents.length - 1] : null;
    return {
      stageId,
      eventCount: stageEvents.length,
      lastEventType: lastEvent?.eventType || null,
    };
  });

  const steps = [...new Set(
    orderedLedger
      .filter((entry) => String(entry.stepId || "").trim())
      .map((entry) => String(entry.stepId || "")),
  )].map((stepId) => {
    const stepEvents = orderedLedger.filter((entry) => String(entry.stepId || "") === stepId);
    const attempts = [...new Set(stepEvents.map((entry) => Number(entry.attemptNumber)).filter(Number.isFinite))];
    const lastEvent = stepEvents.length ? stepEvents[stepEvents.length - 1] : null;
    return {
      stepId,
      attemptCount: attempts.length,
      lastEventType: lastEvent?.eventType || null,
    };
  });

  const snapshotSummary = snapshot?.execution
    ? {
        executionId: String(snapshot.execution.id || ""),
        status: String(snapshot.execution.status || ""),
        stageCount: Array.isArray(snapshot.stages) ? snapshot.stages.length : 0,
        stepCount: Array.isArray(snapshot.steps) ? snapshot.steps.length : 0,
        completedStepCount: Array.isArray(snapshot.steps)
          ? snapshot.steps.filter((step) => String(step.status || "") === "completed").length
          : 0,
      }
    : null;

  const checkpointActive = checkpoint
    ? {
        status: String(checkpoint.status || ""),
        currentStepIndex: Number(checkpoint.currentStep ?? -1),
      }
    : null;
  const snapshotActiveStage = snapshot?.stages?.find((stage) =>
    ["running", "paused_for_review", "pending"].includes(String(stage.status || "")),
  ) || null;
  const snapshotActiveStep = snapshot?.steps?.find((step) =>
    ["running", "paused_for_review", "pending", "paused"].includes(String(step.status || "")),
  ) || null;
  const latestStagePointer = [...orderedLedger]
    .reverse()
    .find((entry) => /^stage\./.test(String(entry.eventType || "")) && entry.eventPayload?.stageId);
  const latestStepPointer = [...orderedLedger]
    .reverse()
    .find((entry) => String(entry.stepId || "").trim());

  return {
    executionIds,
    terminalEventType: latestTerminalEvent?.eventType || null,
    stageCount: stages.length,
    stepCount: steps.length,
    active: {
      checkpoint: checkpointActive,
      snapshot: snapshot?.execution
        ? {
            stageId: snapshotActiveStage ? String(snapshotActiveStage.id || "") : null,
            stageStatus: snapshotActiveStage ? String(snapshotActiveStage.status || "") : null,
            stepId: snapshotActiveStep ? String(snapshotActiveStep.id || "") : null,
            stepStatus: snapshotActiveStep ? String(snapshotActiveStep.status || "") : null,
          }
        : null,
      ledger: {
        stageId: latestStagePointer?.eventPayload?.stageId ? String(latestStagePointer.eventPayload.stageId) : null,
        stageEventType: latestStagePointer?.eventType || null,
        stepId: latestStepPointer?.stepId ? String(latestStepPointer.stepId) : null,
        stepEventType: latestStepPointer?.eventType || null,
      },
    },
    stages,
    steps,
    snapshot: snapshotSummary,
  };
}

function buildIntegrityDiagnostics(planId, collected) {
  const snapshot = loadLatestExecutionSnapshot(planId);
  return {
    planId: String(planId),
    checkpoint: collected.data.checkpoint,
    activeLock: collected.data.locks.find((entry) => entry.lockReleasedAt == null) || null,
    summary: buildReplaySummary(collected.data.ledger, snapshot, collected.data.checkpoint),
    snapshot,
  };
}

function buildIntegrityPayload(planId, collected) {
  const activeLock = collected.data.locks.find((entry) => entry.lockReleasedAt == null) || null;
  return {
    planId: String(planId),
    corrupted: collected.data.issues.length > 0,
    issues: collected.data.issues,
    checkpoint: collected.data.checkpoint,
    activeLock,
    diagnostics: buildIntegrityDiagnostics(planId, collected),
  };
}

function explainExecutionCorruption(planId, plan = null) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required to explain execution corruption.");
  }

  const normalizedPlan = plan ? normalizeCheckpointPlan(plan) : null;
  const collected = collectIntegrityIssues(String(planId), normalizedPlan);
  if (!collected.ok) {
    return collected;
  }

  const payload = buildIntegrityPayload(planId, collected);
  return success({
    planId: payload.planId,
    corrupted: payload.corrupted,
    issues: payload.issues,
    diagnostics: payload.diagnostics,
  });
}

function describeExecutionState(planId, plan = null) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required to describe execution state.");
  }

  const normalizedPlan = plan ? normalizeCheckpointPlan(plan) : null;
  const collected = collectIntegrityIssues(String(planId), normalizedPlan);
  if (!collected.ok) {
    return collected;
  }

  const payload = buildIntegrityPayload(planId, collected);
  return success({
    planId: payload.planId,
    corrupted: payload.corrupted,
    issues: payload.issues,
    checkpoint: payload.checkpoint,
    activeLock: payload.activeLock,
    recoveryQueue: collected.data.recovery,
    diagnostics: payload.diagnostics,
  });
}

function collectExecutionSnapshotIssues(planId, checkpoint = null, normalizedPlan = null) {
  const snapshot = loadLatestExecutionSnapshot(planId);
  if (!snapshot?.execution) {
    return [];
  }

  const issues = [];
  const executionStatus = String(snapshot.execution.status || "");
  const snapshotSteps = Array.isArray(snapshot.steps) ? snapshot.steps : [];
  const snapshotStages = Array.isArray(snapshot.stages) ? snapshot.stages : [];
  const completedSteps = snapshot.steps.filter((step) => String(step.status || "") === "completed").length;
  const totalSteps = normalizedPlan ? normalizedPlan.steps.length : snapshot.steps.length;
  const expectedCompletedSteps = checkpoint
    ? Number(checkpoint.lastCompletedStepIndex ?? -1) + 1
    : 0;

  if (normalizedPlan) {
    const planStepIds = new Set(normalizedPlan.steps.map((step) => String(step.id || "")));
    const snapshotStepIds = new Set(snapshotSteps.map((step) => String(step.id || "")));
    if (snapshotStepIds.size !== planStepIds.size) {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Execution snapshot for ${planId} does not contain the same number of steps as the plan.`,
      });
    }
    for (const stepId of planStepIds) {
      if (!snapshotStepIds.has(stepId)) {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} is missing step ${stepId}.`,
        });
      }
    }
    for (const stepId of snapshotStepIds) {
      if (!planStepIds.has(stepId)) {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} contains unexpected step ${stepId}.`,
        });
      }
    }
  }

  if (snapshotStages.length > 0) {
    const stageIds = new Set(snapshotStages.map((stage) => String(stage.id || "")));
    for (const step of snapshotSteps) {
      if (step.stageId && !stageIds.has(String(step.stageId))) {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} contains step ${step.id} assigned to missing stage ${step.stageId}.`,
        });
      }
    }
    for (const stage of snapshotStages) {
      const stageSteps = snapshotSteps.filter((step) => String(step.stageId || "") === String(stage.id || ""));
      const stageStatus = String(stage.status || "");
      if (stageStatus === "completed" && stageSteps.some((step) => String(step.status || "") !== "completed")) {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} marks stage ${stage.id} completed while it still has non-completed steps.`,
        });
      }
      if (stageStatus === "failed" && stageSteps.length > 0 && stageSteps.every((step) => !["failed", "cancelled"].includes(String(step.status || "")))) {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} marks stage ${stage.id} failed without a failed or cancelled step.`,
        });
      }
    }
  }

  if (checkpoint) {
    const checkpointStatus = String(checkpoint.status || "");
    if (completedSteps < expectedCompletedSteps) {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Execution snapshot for ${planId} trails checkpoint completion progress.`,
      });
    }
    if (totalSteps > 0 && completedSteps > totalSteps) {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Execution snapshot for ${planId} reports more completed steps than exist in the plan.`,
      });
    }
    if (checkpointStatus === "completed" && executionStatus !== "completed") {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Checkpoint ${planId} is completed while execution snapshot status is ${executionStatus || "missing"}.`,
      });
    }
    if (checkpointStatus === "failed" && executionStatus !== "failed") {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Checkpoint ${planId} is failed while execution snapshot status is ${executionStatus || "missing"}.`,
      });
    }
    if (checkpointStatus === "cancelled" && executionStatus !== "cancelled") {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Checkpoint ${planId} is cancelled while execution snapshot status is ${executionStatus || "missing"}.`,
      });
    }
    if (checkpointStatus === "running" && !["running", "pending"].includes(executionStatus)) {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Checkpoint ${planId} is running while execution snapshot status is ${executionStatus || "missing"}.`,
      });
    }
    if (["awaiting_review", "pause_for_operator_recovery", "paused"].includes(checkpointStatus)
      && !["paused", "paused_for_review", "pending", "running"].includes(executionStatus)) {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Checkpoint ${planId} is ${checkpointStatus} while execution snapshot status is ${executionStatus || "missing"}.`,
      });
    }
    if (checkpointStatus !== "completed" && totalSteps > 0 && completedSteps > expectedCompletedSteps) {
      issues.push({
        code: "SNAPSHOT_MISMATCH",
        message: `Execution snapshot for ${planId} is ahead of checkpoint completion progress.`,
      });
    }
    const currentStepIndex = Number(checkpoint.currentStep ?? -1);
    if (
      ["running", "paused", "awaiting_review", "pause_for_operator_recovery"].includes(checkpointStatus)
      && normalizedPlan
      && currentStepIndex >= 0
      && currentStepIndex < normalizedPlan.steps.length
    ) {
      const currentStepId = String(normalizedPlan.steps[currentStepIndex].id || "");
      const snapshotCurrentStep = snapshotSteps.find((step) => String(step.id || "") === currentStepId) || null;
      if (!snapshotCurrentStep) {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} cannot locate checkpoint current step ${currentStepId}.`,
        });
      } else if (String(snapshotCurrentStep.status || "") === "completed") {
        issues.push({
          code: "SNAPSHOT_MISMATCH",
          message: `Execution snapshot for ${planId} marks checkpoint current step ${currentStepId} completed.`,
        });
      }
    }
  }

  return issues;
}

function getActiveLock(planId) {
  const locks = listExecutionLocks(planId);
  if (!locks.ok) {
    return locks;
  }
  return success(locks.data.find((entry) => entry.lockReleasedAt == null) || null);
}

// Integrity checks compare the three durable views we can reconstruct after a crash:
// the checkpoint row (what should be active next), the normalized execution snapshot
// tables (what the runtime last persisted), and the immutable ledger (what happened).
function collectIntegrityIssues(planId, normalizedPlan = null) {
  const checkpointResult = loadExecutionCheckpoint(planId);
  const attemptsResult = listExecutionAttempts(planId);
  const ledgerResult = listLedgerEvents(planId);
  const locksResult = listExecutionLocks(planId);
  const recoveryResult = listRecoveryQueue(planId);

  if (!attemptsResult.ok) {
    return failure(attemptsResult.code, attemptsResult.message);
  }
  if (!ledgerResult.ok) {
    return failure(ledgerResult.code, ledgerResult.message);
  }
  if (!locksResult.ok) {
    return failure(locksResult.code, locksResult.message);
  }
  if (!recoveryResult.ok) {
    return failure(recoveryResult.code, recoveryResult.message);
  }

  const issues = [];
  const checkpoint = checkpointResult.ok ? checkpointResult.data : null;
  const attempts = attemptsResult.data;
  const ledger = ledgerResult.data;
  const locks = locksResult.data;
  const recovery = recoveryResult.data;

  const schemaVersion = withDatabase((db) =>
    db
      .prepare("SELECT version FROM schema_metadata WHERE name = ?")
      .get("execution_state")
  );
  if (Number(schemaVersion?.version || 0) !== EXECUTION_STATE_SCHEMA_VERSION) {
    issues.push({
      code: "SCHEMA_MISMATCH",
      message: `Expected execution_state schema version ${EXECUTION_STATE_SCHEMA_VERSION}.`,
    });
  }

  if (checkpoint) {
    const totalSteps = normalizedPlan ? normalizedPlan.steps.length : null;
    if (checkpoint.lastCompletedStepIndex < -1 || checkpoint.currentStep < 0) {
      issues.push({
        code: "INVALID_STEP_ORDER",
        message: "Checkpoint contains negative step indices.",
      });
    }
      if (
        !["completed", "cancelled", "failed", "execution_abandoned", "corrupted"].includes(String(checkpoint.status))
        && checkpoint.currentStep < checkpoint.lastCompletedStepIndex + 1
      ) {
      issues.push({
        code: "INVALID_STEP_ORDER",
        message: "Checkpoint currentStep regressed behind lastCompletedStepIndex.",
      });
    }
    if (totalSteps != null) {
      if (checkpoint.lastCompletedStepIndex >= totalSteps || checkpoint.currentStep > totalSteps) {
        issues.push({
          code: "CHECKPOINT_INVALID",
          message: `Checkpoint for ${planId} references steps outside the plan.`,
        });
      }
    }
  }

  const activeLocks = locks.filter((entry) => entry.lockReleasedAt == null);
  if (activeLocks.length > 1) {
    issues.push({
      code: "LOCK_CONFLICT",
      message: `Multiple active locks detected for ${planId}.`,
    });
  }
  if (
    checkpoint
    && ["completed", "cancelled", "failed", "execution_abandoned", "corrupted"].includes(String(checkpoint.status))
    && activeLocks.length
  ) {
    issues.push({
      code: "LOCK_INVALID",
      message: `Terminal checkpoint ${planId} still holds an active lock.`,
    });
  }

  issues.push(
    ...collectExecutionLifecycleIssues(
      ledger,
      checkpoint,
      activeLocks.find((entry) => entry.lockReleasedAt == null)?.executionId || null,
    ),
  );
  issues.push(...collectExecutionSnapshotIssues(planId, checkpoint, normalizedPlan));

  const attemptsByStep = groupBy(attempts, (attempt) => `${attempt.executionId}:${attempt.stepId}`);
  const ledgerByAttempt = groupBy(ledger, (event) => `${event.executionId}:${event.stepId}:${event.attemptNumber}`);

  for (const [, rows] of attemptsByStep) {
    const ordered = [...rows].sort((left, right) => left.attemptNumber - right.attemptNumber);
    let expectedAttempt = 1;
    let runningCount = 0;
    for (const attempt of ordered) {
      if (attempt.attemptNumber !== expectedAttempt) {
        issues.push({
          code: "INVALID_ATTEMPT_SEQUENCE",
          message: `Attempt numbering is non-contiguous for ${attempt.executionId}:${attempt.stepId}.`,
        });
        break;
      }
      expectedAttempt += 1;
      if (attempt.status === "running") {
        runningCount += 1;
      }
      if (attempt.sideEffectClass === "external_write" && !attempt.idempotencyKey) {
        issues.push({
          code: "IDEMPOTENCY_MISMATCH",
          message: `External write attempt ${attempt.executionId}:${attempt.stepId}:${attempt.attemptNumber} is missing an idempotency key.`,
        });
      }

      const ledgerEntries = ledgerByAttempt.get(
        `${attempt.executionId}:${attempt.stepId}:${attempt.attemptNumber}`
      ) || [];
      const startedEvents = ledgerEntries.filter((event) => event.eventType === "attempt.started");
      if (startedEvents.length !== 1) {
        issues.push({
          code: "LEDGER_MISSING",
          message: `Attempt ${attempt.executionId}:${attempt.stepId}:${attempt.attemptNumber} is missing a single start ledger entry.`,
        });
      }
      if (["completed", "failed", "cancelled", "abandoned"].includes(attempt.status)) {
        const terminalEvents = ledgerEntries.filter(
          (event) => event.eventType === `attempt.${attempt.status}`
        );
        if (terminalEvents.length !== 1) {
          issues.push({
            code: "LEDGER_MISSING",
            message: `Attempt ${attempt.executionId}:${attempt.stepId}:${attempt.attemptNumber} is missing a terminal ledger entry.`,
          });
        }
      }
    }
    if (runningCount > 1) {
      issues.push({
        code: "MULTIPLE_ACTIVE_ATTEMPTS",
        message: `More than one running attempt exists for ${rows[0].executionId}:${rows[0].stepId}.`,
      });
    }
  }

  const unresolvedRecovery = recovery.filter((entry) => entry.resolvedAt == null);
  if (
    checkpoint
    && checkpoint.status === "pause_for_operator_recovery"
    && unresolvedRecovery.length === 0
  ) {
    issues.push({
      code: "RECOVERY_MISSING",
      message: `Checkpoint ${planId} is paused for operator recovery without a recovery queue item.`,
    });
  }

  return success({
    checkpoint,
    attempts,
    ledger,
    locks,
    recovery,
    issues,
  });
}

function validateExecutionIntegrity(planId, plan = null) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required for integrity validation.");
  }

  expireOperatorRecoveryItems(planId);
  const explained = explainExecutionCorruption(planId, plan);
  if (!explained.ok) {
    return explained;
  }
  if (explained.data.corrupted) {
    const { diagnostics, issues } = explained.data;
    const checkpoint = diagnostics.checkpoint;
    if (checkpoint) {
      setExecutionCheckpointStatus(planId, "corrupted");
      appendLedgerEvent({
        planId: String(planId),
        executionId: diagnostics.activeLock?.executionId || null,
        eventType: "execution.corrupted",
        payload: {
          issues,
          diagnostics: {
            activeLock: diagnostics.activeLock,
            summary: diagnostics.summary,
          },
        },
      });
    }
    return failure(
      "CORRUPTED",
      `Execution integrity validation failed for ${planId}.`,
      {
        issues,
        diagnostics,
      }
    );
  }
  const normalizedPlan = plan ? normalizeCheckpointPlan(plan) : null;
  const collected = collectIntegrityIssues(String(planId), normalizedPlan);
  if (!collected.ok) {
    return collected;
  }

  const payload = buildIntegrityPayload(planId, collected);
  return success({
    planId: payload.planId,
    checkpoint: payload.checkpoint,
    activeLock: payload.activeLock,
    attempts: collected.data.attempts,
    recovery: collected.data.recovery,
  });
}

function decideRecoveryAction(step = {}, attempt = null) {
  const sideEffectClass = String(
    attempt?.sideEffectClass || step?.metadata?.sideEffectClass || "unknown"
  ).trim().toLowerCase() || "unknown";
  const retryStrategy = step?.metadata?.retryStrategy == null
    ? null
    : String(step.metadata.retryStrategy).trim().toLowerCase() || null;
  const sideEffects = Array.isArray(step?.metadata?.sideEffects)
    ? step.metadata.sideEffects.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean)
    : [];
  const hasUnknownSideEffects = sideEffects.includes("unknown");
  const hasDeclaredSideEffects = sideEffects.length > 0;
  const hasIdempotencyEvidence = Boolean(
    attempt?.idempotencyKey
    || step?.metadata?.idempotent
    || String(step?.metadata?.idempotencyKey || "").trim()
  );

  if (hasUnknownSideEffects) {
    return { action: "operator_recovery", sideEffectClass };
  }

  if (retryStrategy === "manual_only" && sideEffectClass !== "pure_read") {
    return { action: "operator_recovery", sideEffectClass };
  }

  if (RETRYABLE_SIDE_EFFECT_CLASSES.has(sideEffectClass)) {
    if (sideEffectClass === "local_write" && (!hasDeclaredSideEffects || !hasIdempotencyEvidence)) {
      return { action: "operator_recovery", sideEffectClass };
    }
    return { action: sideEffectClass === "local_write" ? "guarded_retry" : "retry", sideEffectClass };
  }
  if (IDEMPOTENT_RETRY_CLASSES.has(sideEffectClass)) {
    if (!hasDeclaredSideEffects) {
      return { action: "operator_recovery", sideEffectClass };
    }
    return { action: "operator_recovery", sideEffectClass };
  }
  if (OPERATOR_RECOVERY_CLASSES.has(sideEffectClass)) {
    return { action: "operator_recovery", sideEffectClass };
  }
  return { action: "operator_recovery", sideEffectClass: "unknown" };
}

function getExecutionAttemptStats(attempts = [], executionId) {
  const scoped = attempts.filter((attempt) => attempt.executionId === executionId);
  const totalAttempts = scoped.length;
  const firstCreatedAt = scoped.length
    ? Math.min(...scoped.map((attempt) => Number(attempt.createdAt || 0)).filter((value) => Number.isFinite(value)))
    : null;
  return {
    totalAttempts,
    firstCreatedAt,
  };
}

function getLatestAttemptLedgerState(ledger = [], executionId, stepId, attemptNumber = null) {
  const scoped = ledger
    .filter((event) =>
      String(event.executionId || "") === String(executionId || "")
      && String(event.stepId || "") === String(stepId || "")
      && /^attempt\./.test(String(event.eventType || ""))
      && (attemptNumber == null || Number(event.attemptNumber) === Number(attemptNumber))
    )
    .sort((left, right) =>
      Number(right.attemptNumber || 0) - Number(left.attemptNumber || 0)
      || Number(right.createdAt || 0) - Number(left.createdAt || 0)
      || Number(right.id || 0) - Number(left.id || 0),
    );

  if (!scoped.length) {
    return {
      attemptNumber: attemptNumber == null ? null : Number(attemptNumber),
      started: false,
      completed: false,
      failed: false,
      cancelled: false,
      terminalEventType: null,
    };
  }

  const resolvedAttemptNumber = attemptNumber == null
    ? Number(scoped[0].attemptNumber || 0)
    : Number(attemptNumber);
  const attemptLedger = scoped.filter((event) => Number(event.attemptNumber || 0) === resolvedAttemptNumber);
  const terminalEvent = attemptLedger.find((event) =>
    ["attempt.completed", "attempt.failed", "attempt.cancelled", "attempt.abandoned"].includes(String(event.eventType || "")),
  ) || null;

  return {
    attemptNumber: resolvedAttemptNumber,
    started: attemptLedger.some((event) => event.eventType === "attempt.started"),
    completed: attemptLedger.some((event) => event.eventType === "attempt.completed"),
    failed: attemptLedger.some((event) => event.eventType === "attempt.failed"),
    cancelled: attemptLedger.some((event) => event.eventType === "attempt.cancelled"),
    terminalEventType: terminalEvent?.eventType || null,
  };
}

function getPersistedStepRecoveryState(executionId, stepId) {
  if (!String(executionId || "").trim() || !String(stepId || "").trim()) {
    return {
      status: null,
      started: false,
      completed: false,
      failed: false,
      pausedForReview: false,
    };
  }

  const snapshot = loadExecutionState(String(executionId));
  const step = (snapshot?.steps || []).find((entry) => String(entry.id || "") === String(stepId)) || null;
  const status = String(step?.status || "").trim().toLowerCase() || null;

  return {
    status,
    started: Boolean(step?.startedAt),
    completed: status === "completed",
    failed: status === "failed",
    pausedForReview: status === "paused_for_review",
  };
}

function queueRecoveryReview(planId, executionId, checkpoint, stepId, reason, payload = {}, options = {}) {
  try {
    return withTransaction((tx) => {
      const queued = enqueueOperatorRecovery({
        planId: String(planId),
        executionId: String(executionId),
        stepId: stepId == null ? null : String(stepId),
        reason: String(reason),
        lastState: String(checkpoint?.status || "running"),
        safeOptions: Array.isArray(options.safeOptions) && options.safeOptions.length ? options.safeOptions : ["inspect", "cancel"],
        recommended: options.recommended || "inspect",
        ttlMs: OPERATOR_RECOVERY_TTL_MS,
      }, tx);
      if (!queued.ok) {
        throw Object.assign(new Error(queued.message), { code: queued.code });
      }

      const paused = finalizeExecutionTransition(String(planId), String(executionId), {
        status: "pause_for_operator_recovery",
        overrides: checkpoint
          ? {
              currentStep: checkpoint.currentStep,
              lastCompletedStepIndex: checkpoint.lastCompletedStepIndex,
            }
          : {},
        eventType: "recovery.ambiguous",
        stepId: stepId == null ? null : String(stepId),
        payload: {
          reason: String(reason),
          recoveryId: queued.data?.id,
          ...payload,
        },
        releaseLock: true,
      }, tx);
      if (!paused.ok) {
        throw Object.assign(new Error(paused.message), { code: paused.code });
      }

      return success({
        action: "operator_recovery",
        checkpoint: paused.data?.checkpoint ?? checkpoint,
        executionId: String(executionId),
        recoveryQueue: [queued.data],
      });
    });
  } catch (error) {
    return failure(
      error && typeof error === "object" && "code" in error ? String(error.code) : "DB_WRITE_FAILED",
      error instanceof Error ? error.message : String(error),
    );
  }
}

function pauseForExistingRecoveryQueue(planId, executionId, checkpoint, recoveryQueue = [], payload = {}) {
  const paused = finalizeExecutionTransition(String(planId), String(executionId), {
    status: "pause_for_operator_recovery",
    overrides: checkpoint
      ? {
          currentStep: checkpoint.currentStep,
          lastCompletedStepIndex: checkpoint.lastCompletedStepIndex,
        }
      : {},
    eventType: "recovery.pending",
    stepId: recoveryQueue[0]?.stepId || null,
    payload: {
      recoveryIds: recoveryQueue.map((entry) => entry.id),
      ...payload,
    },
    releaseLock: true,
  });
  if (!paused.ok) {
    return paused;
  }

  return success({
    action: "operator_recovery",
    checkpoint: paused.data?.checkpoint ?? checkpoint,
    executionId: String(executionId),
    recoveryQueue,
  });
}

function reconcileExecutionState(plan = {}) {
  const normalizedPlan = normalizeCheckpointPlan(plan);
  if (!normalizedPlan.id) {
    return failure("INVALID_STATE", "plan id is required for reconciliation.");
  }

  const expired = expireOperatorRecoveryItems(normalizedPlan.id);
  if (!expired.ok) {
    return expired;
  }

  const activeLock = getActiveLock(normalizedPlan.id);
  if (!activeLock.ok) {
    return activeLock;
  }
  if (!activeLock.data) {
    return failure("LOCK_REQUIRED", `Execution lock is required to reconcile ${normalizedPlan.id}.`);
  }

  const checkpointResult = loadExecutionCheckpoint(normalizedPlan.id);
  if (!checkpointResult.ok && checkpointResult.code !== "NOT_FOUND") {
    return checkpointResult;
  }
  const checkpoint = checkpointResult.ok ? checkpointResult.data : null;

  if (expired.data.length > 0) {
    const abandoned = finalizeExecutionTransition(normalizedPlan.id, activeLock.data.executionId, {
      status: checkpoint ? "execution_abandoned" : null,
      eventType: "execution.abandoned",
      payload: {
        expiredRecoveryItems: expired.data.map((entry) => entry.id),
      },
      releaseLock: true,
      requireCheckpoint: false,
    });
    if (!abandoned.ok) {
      return abandoned;
    }
    return success({
      action: "abandon",
      checkpoint: abandoned.ok ? abandoned.data?.checkpoint ?? checkpoint : checkpoint,
      executionId: activeLock.data.executionId,
    });
  }

  const validation = validateExecutionIntegrity(normalizedPlan.id, normalizedPlan);
  if (!validation.ok) {
    return validation;
  }

  const validatedCheckpoint = validation.data.checkpoint;
  if (!validatedCheckpoint) {
    return success({
      action: "none",
      checkpoint: null,
      executionId: activeLock.data.executionId,
    });
  }

  const unresolvedRecovery = validation.data.recovery.filter((entry) => entry.resolvedAt == null);
  if (unresolvedRecovery.length > 0) {
    return pauseForExistingRecoveryQueue(
      normalizedPlan.id,
      activeLock.data.executionId,
      validatedCheckpoint,
      unresolvedRecovery,
      { reason: "existing_operator_recovery" },
    );
  }

  if (validatedCheckpoint.status === "completed") {
    return success({
      action: "completed",
      checkpoint: validatedCheckpoint,
      executionId: activeLock.data.executionId,
    });
  }
  if (validatedCheckpoint.status === "cancelled") {
    const released = finalizeExecutionTransition(normalizedPlan.id, activeLock.data.executionId, {
      releaseLock: true,
    });
    if (!released.ok) {
      return released;
    }
    return success({
      action: "cancelled",
      checkpoint: released.data?.checkpoint ?? validatedCheckpoint,
      executionId: activeLock.data.executionId,
    });
  }
  if (["failed", "corrupted", "execution_abandoned", "pause_for_operator_recovery"].includes(validatedCheckpoint.status)) {
    if (validatedCheckpoint.status === "failed") {
      const { totalAttempts, firstCreatedAt } = getExecutionAttemptStats(
        validation.data.attempts,
        activeLock.data.executionId,
      );
      const now = getDatabaseNowMs();
      if (firstCreatedAt != null && now - firstCreatedAt > MAX_EXECUTION_DURATION_MS) {
        return queueRecoveryReview(
          normalizedPlan.id,
          activeLock.data.executionId,
          validatedCheckpoint,
          normalizedPlan.steps[validatedCheckpoint.currentStep]?.id || null,
          "execution_duration_exceeded",
          {},
          {
            safeOptions: ["inspect", "cancel"],
            recommended: "inspect",
          },
        );
      }

      if (totalAttempts >= MAX_EXECUTION_ATTEMPTS) {
        const abandoned = finalizeExecutionTransition(normalizedPlan.id, activeLock.data.executionId, {
          status: "execution_abandoned",
          eventType: "execution.abandoned",
          payload: {
            reason: "max_attempts_exceeded",
            totalAttempts,
          },
          releaseLock: true,
        });
        if (!abandoned.ok) {
          return abandoned;
        }
        return success({
          action: "abandon",
          checkpoint: abandoned.data?.checkpoint ?? validatedCheckpoint,
          executionId: activeLock.data.executionId,
        });
      }
    }
    return success({
      action: "halt",
      checkpoint: validatedCheckpoint,
      executionId: activeLock.data.executionId,
    });
  }

  if (validatedCheckpoint.status === "running") {
    const step = normalizedPlan.steps[validatedCheckpoint.currentStep] || null;
    const persistedStep = getPersistedStepRecoveryState(activeLock.data.executionId, step?.id || null);
    const { totalAttempts, firstCreatedAt } = getExecutionAttemptStats(
      validation.data.attempts,
      activeLock.data.executionId,
    );
    const attemptsForStep = validation.data.attempts
      .filter(
        (attempt) =>
          attempt.executionId === activeLock.data.executionId
          && step
          && attempt.stepId === step.id
      )
      .sort((left, right) => right.attemptNumber - left.attemptNumber);
    const latestAttempt = attemptsForStep[0] || null;
    const attemptLedger = getLatestAttemptLedgerState(
      validation.data.ledger,
      activeLock.data.executionId,
      step?.id || null,
      latestAttempt?.attemptNumber ?? null,
    );
    const now = getDatabaseNowMs();
    const hasStepStartedEvidence = Boolean(
      latestAttempt
      || attemptLedger.started
      || persistedStep.started
      || persistedStep.pausedForReview
      || persistedStep.failed
      || persistedStep.completed
    );
    const hasStepTerminalEvidence = Boolean(
      attemptLedger.completed
      || attemptLedger.failed
      || attemptLedger.cancelled
      || persistedStep.failed
      || persistedStep.completed
    );

    if (firstCreatedAt != null && now - firstCreatedAt > MAX_EXECUTION_DURATION_MS) {
      return queueRecoveryReview(
        normalizedPlan.id,
        activeLock.data.executionId,
        validatedCheckpoint,
        step?.id || null,
        "execution_duration_exceeded",
        {},
        {
          safeOptions: ["inspect", "cancel"],
          recommended: "inspect",
        },
      );
    }

    if (totalAttempts >= MAX_EXECUTION_ATTEMPTS) {
      const abandoned = finalizeExecutionTransition(normalizedPlan.id, activeLock.data.executionId, {
        status: "execution_abandoned",
        eventType: "execution.abandoned",
        stepId: step?.id || null,
        payload: {
          reason: "max_attempts_exceeded",
          totalAttempts,
        },
        releaseLock: true,
      });
      if (!abandoned.ok) {
        return abandoned;
      }
      return success({
        action: "abandon",
        checkpoint: abandoned.data?.checkpoint ?? validatedCheckpoint,
        executionId: activeLock.data.executionId,
      });
    }

    if (persistedStep.completed && !attemptLedger.completed && !(latestAttempt && latestAttempt.status === "completed")) {
      return queueRecoveryReview(
        normalizedPlan.id,
        activeLock.data.executionId,
        validatedCheckpoint,
        step?.id || null,
        "recovery_snapshot_ledger_mismatch",
        {
          persistedStepStatus: persistedStep.status,
          attemptNumber: attemptLedger.attemptNumber,
          terminalEventType: attemptLedger.terminalEventType,
        },
      );
    }

    if (attemptLedger.completed || (latestAttempt && latestAttempt.status === "completed")) {
      const advanced = checkpointAfterStep(normalizedPlan.id, validatedCheckpoint.currentStep, normalizedPlan.steps.length);
      return success({
        action: "continue",
        checkpoint: advanced.ok ? advanced.data : validatedCheckpoint,
        executionId: activeLock.data.executionId,
      });
    }

    if (attemptLedger.failed || (latestAttempt && latestAttempt.status === "failed")) {
      const decision = decideRecoveryAction(step, latestAttempt || {
        attemptNumber: attemptLedger.attemptNumber,
        sideEffectClass: step?.metadata?.sideEffectClass || "unknown",
      });
      if (decision.action === "operator_recovery") {
        return queueRecoveryReview(
          normalizedPlan.id,
          activeLock.data.executionId,
          validatedCheckpoint,
          step?.id || null,
          `unsafe_recovery_${decision.sideEffectClass}`,
          {
            attemptNumber: attemptLedger.attemptNumber,
            terminalEventType: attemptLedger.terminalEventType || "attempt.failed",
          },
        );
      }
      return success({
        action: decision.action,
        checkpoint: validatedCheckpoint,
        executionId: activeLock.data.executionId,
        nextStepIndex: validatedCheckpoint.currentStep,
      });
    }

    if (latestAttempt && latestAttempt.status === "running" && latestAttempt.leaseExpiresAt > now) {
      return success({
        action: validatedCheckpoint.cancellationRequested ? "cancel_pending" : "noop",
        checkpoint: validatedCheckpoint,
        executionId: activeLock.data.executionId,
      });
    }

    if (validatedCheckpoint.cancellationRequested) {
      if (latestAttempt && latestAttempt.status === "running") {
        const cancelledAttempt = cancelExecutionAttempt(
          normalizedPlan.id,
          activeLock.data.executionId,
          latestAttempt.stepId,
          latestAttempt.attemptNumber,
          { reason: "cancellation_requested" },
        );
        if (!cancelledAttempt.ok) {
          return cancelledAttempt;
        }
      }
      const cancelled = finalizeExecutionTransition(normalizedPlan.id, activeLock.data.executionId, {
        status: "cancelled",
        overrides: {
          currentStep: validatedCheckpoint.currentStep,
        },
        eventType: "execution.cancelled",
        stepId: step?.id || null,
        payload: {
          reason: "cancellation_requested",
          leaseExpired: Boolean(latestAttempt),
        },
        releaseLock: true,
      });
      if (!cancelled.ok) {
        return cancelled;
      }
      return success({
        action: "cancelled",
        checkpoint: cancelled.data?.checkpoint ?? validatedCheckpoint,
        executionId: activeLock.data.executionId,
      });
    }

    if (hasStepStartedEvidence && !hasStepTerminalEvidence) {
      return queueRecoveryReview(
        normalizedPlan.id,
        activeLock.data.executionId,
        validatedCheckpoint,
        step?.id || null,
        "recovery_ambiguous",
        {
          attemptNumber: attemptLedger.attemptNumber,
          terminalEventType: attemptLedger.terminalEventType,
          persistedStepStatus: persistedStep.status,
        },
      );
    }

    if (attemptLedger.started || latestAttempt) {
      return queueRecoveryReview(
        normalizedPlan.id,
        activeLock.data.executionId,
        validatedCheckpoint,
        step?.id || null,
        "recovery_ambiguous",
        {
          attemptNumber: latestAttempt?.attemptNumber ?? attemptLedger.attemptNumber,
          terminalEventType: attemptLedger.terminalEventType,
          sideEffectClass: latestAttempt?.sideEffectClass || step?.metadata?.sideEffectClass || "unknown",
        },
      );
    }

    return success({
      action: "resume",
      checkpoint: validatedCheckpoint,
      executionId: activeLock.data.executionId,
      nextStepIndex: validatedCheckpoint.currentStep,
    });
  }

  if (validatedCheckpoint.status === "paused" || validatedCheckpoint.status === "pending" || validatedCheckpoint.status === "awaiting_review") {
    if (validatedCheckpoint.cancellationRequested) {
      const cancelled = finalizeExecutionTransition(normalizedPlan.id, activeLock.data.executionId, {
        status: "cancelled",
        overrides: {
          currentStep: validatedCheckpoint.currentStep,
        },
        eventType: "execution.cancelled",
        payload: {
          reason: "cancellation_requested",
          safeBoundary: true,
        },
        releaseLock: true,
      });
      if (!cancelled.ok) {
        return cancelled;
      }
      return success({
        action: "cancelled",
        checkpoint: cancelled.data?.checkpoint ?? validatedCheckpoint,
        executionId: activeLock.data.executionId,
      });
    }
    return success({
      action: "resume",
      checkpoint: validatedCheckpoint,
      executionId: activeLock.data.executionId,
      nextStepIndex: validatedCheckpoint.lastCompletedStepIndex + 1,
    });
  }

  return success({
    action: "none",
    checkpoint: validatedCheckpoint,
    executionId: activeLock.data.executionId,
  });
}

function replayExecution(planId) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required for replay.");
  }

  const collected = collectIntegrityIssues(String(planId), null);
  if (!collected.ok) {
    return collected;
  }
  if (collected.data.issues.length > 0) {
    return failure(
      "CORRUPTED",
      `Execution replay halted because integrity checks failed for ${planId}.`,
      { issues: collected.data.issues }
    );
  }

  const snapshot = loadLatestExecutionSnapshot(String(planId));
  const timeline = collected.data.ledger.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    stepId: event.stepId,
    attemptNumber: event.attemptNumber,
    createdAt: event.createdAt,
    payload: event.eventPayload,
  }));

  return success({
    planId: String(planId),
    checkpoint: collected.data.checkpoint,
    timeline,
    summary: buildReplaySummary(collected.data.ledger, snapshot, collected.data.checkpoint),
    snapshot,
    attempts: collected.data.attempts,
    recoveryQueue: collected.data.recovery,
    lock: collected.data.locks.find((entry) => entry.lockReleasedAt == null) || null,
  });
}

module.exports = {
  EXECUTION_STATE_SCHEMA_VERSION,
  LEASE_DURATION_MS,
  MAX_EXECUTION_ATTEMPTS,
  MAX_EXECUTION_DURATION_MS,
  OPERATOR_RECOVERY_TTL_MS,
  acquireExecutionLock,
  describeExecutionState,
  explainExecutionCorruption,
  reconcileExecutionState,
  replayExecution,
  validateExecutionIntegrity,
};
