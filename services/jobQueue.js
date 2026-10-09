const {
  openJobStore,
  upsertJob,
  getJob: getStoredJob,
  listJobs: listStoredJobs,
  listRecentJobs,
  listEligibleJobs,
  listLatestFailures,
  getQueueCounts,
  getQueueHealthCounts,
  getQueuedCount,
  getNextRetryAt,
  recordWorkerHeartbeat,
  clearJobs: clearStoredJobs,
  normalizeEvents,
} = require("./jobQueueStore");

const DEFAULT_EVENT_PREVIEW = 6;
const DEFAULT_JOB_RUNTIME_LIMIT_MS = 60_000;
const STALE_RUNNING_JOB_MS = 5 * 60_000;
const JOB_HEARTBEAT_INTERVAL_MS = 5_000;
const MIN_JOB_LEASE_MS = 15_000;
const DEFAULT_MAX_PENDING_JOBS = 100;
const DEFAULT_MAX_RUNNING_JOBS = 12;
const MAX_JOB_BATCH_SIZE = 24;
const WORKER_INSTANCE_ID = `worker_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;

const processors = new Map();
let workerTimer = null;
let workerLoopActive = false;
let workerLoopRequested = false;
let queueExecutionMode = "in_process";
let workerPollIntervalMs = 2_000;
let maxPendingJobs = DEFAULT_MAX_PENDING_JOBS;
let maxRunningJobs = DEFAULT_MAX_RUNNING_JOBS;

class QueueSaturationError extends Error {
  constructor(details = {}) {
    super("The job queue is saturated. Try again after current work drains.");
    this.name = "QueueSaturationError";
    this.code = "job_queue_saturated";
    this.status = 429;
    this.details = details;
  }
}

function createJobEvent(level, message, meta = {}) {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    meta: meta && typeof meta === "object" ? meta : {},
  };
}

function computeLeaseDurationMs(runtimeLimitMs) {
  const normalizedRuntime = Number.isFinite(Number(runtimeLimitMs))
    ? Math.max(1_000, Number(runtimeLimitMs))
    : DEFAULT_JOB_RUNTIME_LIMIT_MS;

  return Math.max(MIN_JOB_LEASE_MS, Math.min(STALE_RUNNING_JOB_MS, normalizedRuntime + MIN_JOB_LEASE_MS));
}

function serializeJob(job, options = {}) {
  const events = normalizeEvents(job?.events);
  const eventLimit = options.full
    ? events.length
    : options.eventLimit === null
      ? events.length
      : Math.max(0, Number(options.eventLimit ?? DEFAULT_EVENT_PREVIEW));

  return {
    ...job,
    events: events.slice(-eventLimit),
    eventCount: Number(job?.eventCount || events.length),
    latestEvent: job?.latestEvent || (events.length ? events[events.length - 1] : null),
  };
}

function defaultJobsState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    jobs: [],
  };
}

function loadJobsState() {
  return {
    ...defaultJobsState(),
    jobs: listStoredJobs(200),
  };
}

function saveJobsState(state) {
  clearStoredJobs();
  const jobs = Array.isArray(state?.jobs) ? state.jobs : [];
  for (const job of jobs) {
    upsertJob(job);
  }
  return loadJobsState();
}

function registerJobProcessor(type, processor, options = {}) {
  processors.set(type, {
    processor,
    requiresAdmission: options.requiresAdmission === true,
    requiresReviewedExecution: options.requiresReviewedExecution === true,
    admissionContract: String(options.admissionContract || "typed_background_job_v1"),
    executeReviewedPlan: typeof options.executeReviewedPlan === "function" ? options.executeReviewedPlan : null,
  });
}

function validateProcessorAdmission(job, registration) {
  if (!registration?.requiresAdmission) {
    return { ok: true };
  }
  const admission = job?.admission && typeof job.admission === "object" ? job.admission : null;
  if (!admission) {
    return { ok: false, reason: "Processor admission evidence is missing." };
  }
  if (admission.status !== "approved" || admission.contract !== registration.admissionContract) {
    return { ok: false, reason: "Processor admission evidence is not approved for this contract." };
  }
  if (!String(admission.source || "").trim() || !Number.isFinite(new Date(admission.admittedAt || "").getTime())) {
    return { ok: false, reason: "Processor admission provenance is incomplete." };
  }
  if (String(admission.jobType || "") !== String(job.type || "")) {
    return { ok: false, reason: "Processor admission job type does not match the queued job." };
  }
  const payloadWorkspaceId = typeof job.payload?.workspaceId === "string"
    ? job.payload.workspaceId
    : typeof job.payload?.workspace === "string"
      ? job.payload.workspace
      : null;
  if (payloadWorkspaceId && String(admission.workspaceId || "") !== payloadWorkspaceId) {
    return { ok: false, reason: "Processor admission workspace does not match the queued job." };
  }
  if (job.actorId && String(admission.actorId || "") !== String(job.actorId)) {
    return { ok: false, reason: "Processor admission actor does not match the queued job." };
  }
  return { ok: true };
}

function configureJobQueue(options = {}) {
  openJobStore();

  if (options.executionMode === "in_process" || options.executionMode === "external") {
    queueExecutionMode = options.executionMode;
  }

  if (Number.isFinite(Number(options.workerPollIntervalMs)) && Number(options.workerPollIntervalMs) >= 250) {
    workerPollIntervalMs = Math.floor(Number(options.workerPollIntervalMs));
  }

  if (Number.isFinite(Number(options.maxPendingJobs)) && Number(options.maxPendingJobs) >= 1) {
    maxPendingJobs = Math.floor(Number(options.maxPendingJobs));
  }

  if (Number.isFinite(Number(options.maxRunningJobs)) && Number(options.maxRunningJobs) >= 1) {
    maxRunningJobs = Math.floor(Number(options.maxRunningJobs));
  }
}

function listJobs(limit = 30, options = {}) {
  return listStoredJobs(limit).map((job) => serializeJob(job, options));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildJobMetrics(limit = 60) {
  const jobs = listRecentJobs(limit).map((job) => serializeJob(job, { eventLimit: 0 }));
  const completed = jobs.filter((job) => job.status === "completed");
  const terminal = jobs.filter((job) => ["completed", "failed", "canceled"].includes(job.status));
  const retries = jobs.filter((job) => Number(job.retryCount || 0) > 0 || job.status === "scheduled_retry");
  const timedOut = jobs.filter((job) => String(job.error || "").toLowerCase().includes("timed out")).length;
  const queueWaitTimes = jobs
    .filter((job) => job.startedAt && job.createdAt)
    .map((job) => Math.max(0, new Date(job.startedAt).getTime() - new Date(job.createdAt).getTime()));
  const runTimes = jobs
    .filter((job) => job.startedAt && job.completedAt)
    .map((job) => Math.max(0, new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()));

  return {
    avgQueueWaitMs: average(queueWaitTimes),
    avgRunTimeMs: average(runTimes),
    completionRate: terminal.length ? Math.round((completed.length / terminal.length) * 100) : 0,
    retryPressure: jobs.length ? Math.round((retries.length / jobs.length) * 100) : 0,
    scheduledRetries: jobs.filter((job) => job.status === "scheduled_retry").length,
    timedOut,
  };
}

function getQueueCapacity() {
  const counts = getQueueCounts();
  const pending = Number(counts.queued || 0) + Number(counts.scheduledRetries || 0);
  const running = Number(counts.running || 0);

  return {
    queued: Number(counts.queued || 0),
    scheduledRetries: Number(counts.scheduledRetries || 0),
    pending,
    running,
    maxPendingJobs,
    maxRunningJobs,
    saturated: pending >= maxPendingJobs || running >= maxRunningJobs,
  };
}

function buildQueueHealth() {
  const counts = getQueueHealthCounts(STALE_RUNNING_JOB_MS);
  const capacity = getQueueCapacity();

  return {
    executionMode: queueExecutionMode,
    running: Number(counts.running || 0),
    activeWorkers: Number(counts.activeWorkers || 0),
    queued: Number(counts.queued || 0),
    scheduledRetries: Number(counts.scheduledRetries || 0),
    staleRunning: Number(counts.staleRunning || 0),
    unhealthy: Number(counts.staleRunning || 0) > 0 || capacity.saturated,
    pending: capacity.pending,
    saturated: capacity.saturated,
    maxPendingJobs,
    maxRunningJobs,
  };
}

function getJob(jobId, options = {}) {
  const job = getStoredJob(jobId);
  return job ? serializeJob(job, options) : null;
}

function appendJobEvent(jobId, level, message, meta = {}) {
  return updateJob(jobId, (current) => {
    const eventMeta = {
      traceId: current.traceId || null,
      ...(meta && typeof meta === "object" ? meta : {}),
    };

    return {
      ...current,
      events: [...normalizeEvents(current.events), createJobEvent(level, message, eventMeta)].slice(-40),
    };
  });
}

function updateJob(jobId, updater) {
  const current = getStoredJob(jobId);
  if (!current) {
    return null;
  }
  const next = typeof updater === "function" ? updater(current) : current;
  if (!next) {
    return null;
  }
  return upsertJob({
    ...current,
    ...next,
    id: current.id,
    updatedAt: new Date().toISOString(),
  });
}

function enqueueJob(type, payload = {}, meta = {}) {
  const capacity = getQueueCapacity();
  if (capacity.saturated) {
    throw new QueueSaturationError({
      ...capacity,
      executionMode: queueExecutionMode,
    });
  }

  const traceId = meta.traceId || `jobtrace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    traceId,
    type,
    payload,
    status: "queued",
    actorId: meta.actorId || null,
    actorName: meta.actorName || null,
    admission: meta.admission && typeof meta.admission === "object" ? { ...meta.admission } : null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    workerId: null,
    lastHeartbeatAt: null,
    leaseExpiresAt: null,
    result: null,
    error: null,
    attempts: 0,
    maxAttempts: Number.isFinite(Number(meta.maxAttempts)) ? Math.max(1, Number(meta.maxAttempts)) : 3,
    retryCount: 0,
    retryDelayMs: Number.isFinite(Number(meta.retryDelayMs)) ? Math.max(100, Number(meta.retryDelayMs)) : 5000,
    runtimeLimitMs: Number.isFinite(Number(meta.runtimeLimitMs))
      ? Math.max(1000, Number(meta.runtimeLimitMs))
      : DEFAULT_JOB_RUNTIME_LIMIT_MS,
    nextRetryAt: null,
    canceledAt: null,
    events: [
      createJobEvent("info", "Job queued.", {
        traceId,
        type,
        actorId: meta.actorId || null,
        actorName: meta.actorName || null,
      }),
    ],
  };
  upsertJob(job);
  if (queueExecutionMode === "in_process") {
    scheduleWorker();
  }
  return serializeJob(job, { full: true });
}

function extendJobLease(jobId, workerId, runtimeLimitMs) {
  const heartbeatAt = new Date().toISOString();
  const leaseExpiresAt = new Date(Date.now() + computeLeaseDurationMs(runtimeLimitMs)).toISOString();

  return updateJob(jobId, (current) => {
    if (!current || current.status !== "running") {
      return current;
    }

    return {
      ...current,
      workerId: workerId || current.workerId || null,
      lastHeartbeatAt: heartbeatAt,
      leaseExpiresAt,
    };
  });
}

function createRuntimeJob(job, currentFull) {
  return {
    ...currentFull,
    traceId: currentFull.traceId || job.traceId || null,
    workerId: WORKER_INSTANCE_ID,
    heartbeat(meta = {}) {
      extendJobLease(job.id, WORKER_INSTANCE_ID, currentFull.runtimeLimitMs || DEFAULT_JOB_RUNTIME_LIMIT_MS);
      appendJobEvent(job.id, "info", "Job heartbeat recorded.", {
        traceId: currentFull.traceId || job.traceId || null,
        workerId: WORKER_INSTANCE_ID,
        ...meta,
      });
    },
    log(message, meta = {}) {
      appendJobEvent(job.id, "info", String(message || "Processor event."), meta);
    },
  };
}

async function invokeRegisteredJobProcessor(jobId, authority = {}) {
  const reviewStatus = String(authority.reviewStatus || "");
  if (
    authority.controlApproved !== true ||
    authority.executionMode !== "auto_execute" ||
    !["approved", "downgraded", "rewritten", "split"].includes(reviewStatus)
  ) {
    throw new Error("Reviewed job processor invocation requires approved runtime authority.");
  }

  const currentFull = getJob(jobId, { full: true });
  if (!currentFull || currentFull.status !== "running") {
    throw new Error("Reviewed job processor invocation requires a running job.");
  }
  if (authority.jobType && String(authority.jobType) !== String(currentFull.type || "")) {
    throw new Error("Reviewed job processor job type does not match the queued job.");
  }

  const registration = processors.get(currentFull.type);
  if (!registration?.requiresReviewedExecution || typeof registration.processor !== "function") {
    throw new Error(`No reviewed processor registered for ${currentFull.type}.`);
  }
  const admission = validateProcessorAdmission(currentFull, registration);
  if (!admission.ok) {
    throw new Error(`Reviewed job processor admission denied: ${admission.reason}`);
  }

  appendJobEvent(jobId, "info", "Job processor runtime authority verified.", {
    code: "job_processor_runtime_authority_verified",
    reviewStatus,
    traceId: currentFull.traceId || null,
  });

  return registration.processor(createRuntimeJob(currentFull, currentFull));
}

async function executeProcessorThroughReviewedRuntime(currentFull, registration) {
  const executePlan = registration.executeReviewedPlan || require("./runtimeControl").executeControlledStructuredPlan;
  const workspaceId = typeof currentFull.payload?.workspaceId === "string"
    ? currentFull.payload.workspaceId
    : typeof currentFull.payload?.workspace === "string"
      ? currentFull.payload.workspace
      : currentFull.admission?.workspaceId || "";
  const actor = {
    id: "system:job-worker",
    workspaceId,
    name: "Background job worker",
    email: "system@local",
    role: "system",
  };
  const controlled = await executePlan(
    {
      type: "single",
      action: "jobs:execute-processor",
      payload: {
        jobId: currentFull.id,
        jobType: currentFull.type,
        initiatedByActorId: currentFull.actorId || null,
        initiatedByActorName: currentFull.actorName || null,
      },
      originalRequest: `execute background job ${currentFull.type}`,
      source: "job_worker",
      meta: {
        userId: actor.id,
        workspaceId: actor.workspaceId,
        userName: actor.name,
        userEmail: actor.email,
        userRole: actor.role,
      },
    },
    { actor, identitySource: "system", modes: { confirmed: true } },
  );
  const decision = String(controlled?.control?.decision?.decision || "blocked");
  if (decision !== "auto_execute" || controlled?.ok === false) {
    throw new Error(controlled?.error || controlled?.control?.decision?.explanation || "Reviewed job processor execution was blocked.");
  }
  return controlled.result;
}

async function runJob(job) {
  const currentFull = getJob(job.id, { full: true });
  if (!currentFull || currentFull.status === "canceled") {
    return;
  }

  const registration = processors.get(job.type);
  const processor = typeof registration === "function" ? registration : registration?.processor;
  if (!processor) {
    updateJob(job.id, (current) => ({
      ...current,
      status: "failed",
      startedAt: current.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: `No processor registered for ${job.type}.`,
    }));
    appendJobEvent(job.id, "error", `No processor registered for ${job.type}.`);
    return;
  }

  const admission = validateProcessorAdmission(currentFull, registration);
  if (!admission.ok) {
    updateJob(job.id, (current) => ({
      ...current,
      status: "failed",
      startedAt: current.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: `Job processor admission denied: ${admission.reason}`,
    }));
    appendJobEvent(job.id, "error", "Job processor admission denied.", {
      code: "job_processor_admission_denied",
      reason: admission.reason,
      traceId: currentFull.traceId || job.traceId || null,
    });
    return;
  }

  updateJob(job.id, (current) => ({
    ...current,
    status: "running",
    startedAt: new Date().toISOString(),
    workerId: WORKER_INSTANCE_ID,
    lastHeartbeatAt: new Date().toISOString(),
    leaseExpiresAt: new Date(Date.now() + computeLeaseDurationMs(current.runtimeLimitMs)).toISOString(),
    error: null,
    attempts: Number(current.attempts || 0) + 1,
  }));
  appendJobEvent(job.id, "info", "Job execution started.", {
    traceId: currentFull.traceId || job.traceId || null,
    attempt: Number(currentFull.attempts || 0) + 1,
    workerId: WORKER_INSTANCE_ID,
  });

  let heartbeatTimer = null;
  try {
    let timeoutId = null;
    const runtimeJob = createRuntimeJob(job, currentFull);
    heartbeatTimer = setInterval(() => {
      extendJobLease(job.id, WORKER_INSTANCE_ID, currentFull.runtimeLimitMs || DEFAULT_JOB_RUNTIME_LIMIT_MS);
    }, JOB_HEARTBEAT_INTERVAL_MS);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Job timed out after ${Number(currentFull.runtimeLimitMs || DEFAULT_JOB_RUNTIME_LIMIT_MS)}ms.`));
      }, Number(currentFull.runtimeLimitMs || DEFAULT_JOB_RUNTIME_LIMIT_MS));
    });
    const processorPromise = registration?.requiresReviewedExecution
      ? executeProcessorThroughReviewedRuntime(currentFull, registration)
      : processor(runtimeJob);
    const result = await Promise.race([processorPromise, timeoutPromise]);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    updateJob(job.id, (current) => ({
      ...current,
      status: "completed",
      completedAt: new Date().toISOString(),
      workerId: WORKER_INSTANCE_ID,
      lastHeartbeatAt: new Date().toISOString(),
      leaseExpiresAt: null,
      result: result || null,
      error: null,
      nextRetryAt: null,
    }));
    appendJobEvent(job.id, "success", "Job completed successfully.", {
      traceId: currentFull.traceId || job.traceId || null,
      workerId: WORKER_INSTANCE_ID,
      result:
        result && typeof result === "object"
          ? Object.keys(result).slice(0, 5)
          : typeof result === "string"
            ? result.slice(0, 120)
            : result ?? null,
    });
  } catch (error) {
    if (typeof heartbeatTimer !== "undefined" && heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    updateJob(job.id, (current) => {
      const attempts = Number(current.attempts || 0);
      const canRetry = attempts < Number(current.maxAttempts || 1);
      const retryCount = Number(current.retryCount || 0);
      const retryDelayMs = Number(current.retryDelayMs || 5000) * Math.pow(2, retryCount);

      return {
        ...current,
        status: canRetry ? "scheduled_retry" : "failed",
        completedAt: new Date().toISOString(),
        workerId: WORKER_INSTANCE_ID,
        lastHeartbeatAt: new Date().toISOString(),
        leaseExpiresAt: null,
        error: error instanceof Error ? error.message : "Job failed.",
        nextRetryAt: canRetry ? new Date(Date.now() + retryDelayMs).toISOString() : null,
      };
    });
    appendJobEvent(
      job.id,
      "error",
      error instanceof Error ? error.message : "Job failed.",
      {
        traceId: currentFull.traceId || job.traceId || null,
        workerId: WORKER_INSTANCE_ID,
        retryScheduled: Number(currentFull.attempts || 0) + 1 < Number(currentFull.maxAttempts || 1),
      }
    );
  }
}

function recoverStaleJobs() {
  const now = Date.now();
  const runningJobs = listStoredJobs(200).filter((job) => job.status === "running");
  let changed = false;

  for (const job of runningJobs) {
    const startedAtMs = job.startedAt ? new Date(job.startedAt).getTime() : 0;
    const leaseExpired = job.leaseExpiresAt ? new Date(job.leaseExpiresAt).getTime() <= now : false;
    const isStale = leaseExpired || !startedAtMs || now - startedAtMs > STALE_RUNNING_JOB_MS;
    if (!isStale) {
      continue;
    }

    const updated = updateJob(job.id, (current) => {
      const canRetry = Number(current.attempts || 0) < Number(current.maxAttempts || 1);
      const nextRetryAt = canRetry
        ? new Date(now + Math.max(100, Number(current.retryDelayMs || 5000))).toISOString()
        : null;

      return {
        ...current,
        status: canRetry ? "scheduled_retry" : "failed",
        completedAt: new Date().toISOString(),
        workerId: current.workerId || null,
        lastHeartbeatAt: new Date().toISOString(),
        leaseExpiresAt: null,
        error: "Recovered a stale running job after a worker restart.",
        nextRetryAt,
        events: [
          ...normalizeEvents(current.events),
          createJobEvent(
            "warning",
            canRetry
              ? "Recovered a stale running job and scheduled a retry."
              : "Recovered a stale running job and marked it failed.",
            { traceId: current.traceId || null, startedAt: current.startedAt || null, workerId: current.workerId || null, leaseExpired },
          ),
        ],
      };
    });
    changed = changed || Boolean(updated);
  }

  return changed;
}

async function runPendingJobs() {
  const queued = listEligibleJobs(MAX_JOB_BATCH_SIZE);
  for (const job of queued) {
    if (job.status === "scheduled_retry") {
      updateJob(job.id, (current) => ({
        ...current,
        status: "queued",
        retryCount: Number(current.retryCount || 0) + 1,
        workerId: null,
        lastHeartbeatAt: null,
        leaseExpiresAt: null,
        nextRetryAt: null,
        startedAt: null,
        completedAt: null,
      }));
      appendJobEvent(job.id, "warning", "Retry window reached. Job moved back to queue.");
    }
    await runJob(job);
  }
}

function nextEligibleDelayMs() {
  const now = Date.now();

  if (getQueuedCount() > 0) {
    return 10;
  }

  const nextRetryAt = getNextRetryAt();
  if (!nextRetryAt) {
    return null;
  }

  return Math.max(10, new Date(nextRetryAt).getTime() - now);
}

function scheduleWorker() {
  if (queueExecutionMode !== "in_process") {
    if (workerTimer) {
      clearTimeout(workerTimer);
      workerTimer = null;
    }
    workerLoopRequested = false;
    return;
  }

  if (workerLoopActive) {
    workerLoopRequested = true;
    return;
  }

  const delay = nextEligibleDelayMs();

  if (delay === null) {
    if (workerTimer) {
      clearTimeout(workerTimer);
      workerTimer = null;
    }
    return;
  }

  if (workerTimer) {
    clearTimeout(workerTimer);
  }

  workerTimer = setTimeout(async () => {
    workerTimer = null;
    if (workerLoopActive) {
      workerLoopRequested = true;
      return;
    }

    workerLoopActive = true;
    try {
      await runPendingJobs();
    } finally {
      workerLoopActive = false;
      const shouldContinue = workerLoopRequested || nextEligibleDelayMs() !== null;
      workerLoopRequested = false;
      if (shouldContinue) {
        scheduleWorker();
      }
    }
  }, delay);
}

async function runJobWorkerCycle() {
  recordWorkerHeartbeat(WORKER_INSTANCE_ID);
  recoverStaleJobs();
  await runPendingJobs();
  recordWorkerHeartbeat(WORKER_INSTANCE_ID);
  return {
    health: buildQueueHealth(60),
    metrics: buildJobMetrics(60),
  };
}

function clearJobs() {
  clearStoredJobs();
  if (workerTimer) {
    clearTimeout(workerTimer);
    workerTimer = null;
  }
  workerLoopActive = false;
  workerLoopRequested = false;
}

function cancelJob(jobId) {
  const updated = updateJob(jobId, (current) => {
    if (!current || !["queued", "scheduled_retry"].includes(current.status)) {
      return current;
    }

    return {
      ...current,
      status: "canceled",
      workerId: current.workerId || null,
      lastHeartbeatAt: current.lastHeartbeatAt || null,
      leaseExpiresAt: null,
      canceledAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: null,
      nextRetryAt: null,
    };
  });
  if (updated && updated.status === "canceled") {
    appendJobEvent(jobId, "warning", "Job canceled by operator.");
  }
  return updated;
}

function retryJob(jobId) {
  const updated = updateJob(jobId, (current) => {
    if (!current || !["failed", "scheduled_retry"].includes(current.status)) {
      return current;
    }

    return {
      ...current,
      status: "queued",
      retryCount: Number(current.retryCount || 0) + 1,
      workerId: null,
      lastHeartbeatAt: null,
      leaseExpiresAt: null,
      startedAt: null,
      completedAt: null,
      error: null,
      result: null,
      canceledAt: null,
      nextRetryAt: null,
    };
  });
  if (updated && updated.status === "queued") {
    appendJobEvent(jobId, "info", "Manual retry requested. Job re-queued.");
    if (queueExecutionMode === "in_process") {
      scheduleWorker();
    }
  }
  return updated;
}

module.exports = {
  QueueSaturationError,
  loadJobsState,
  saveJobsState,
  registerJobProcessor,
  enqueueJob,
  listJobs,
  buildJobMetrics,
  buildQueueHealth,
  configureJobQueue,
  getJob,
  appendJobEvent,
  updateJob,
  cancelJob,
  retryJob,
  runPendingJobs,
  runJobWorkerCycle,
  recoverStaleJobs,
  extendJobLease,
  invokeRegisteredJobProcessor,
  clearJobs,
  getQueueCapacity,
  listLatestFailures,
};
