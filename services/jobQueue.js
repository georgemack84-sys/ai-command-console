const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");

const JOBS_PATH = path.join(process.cwd(), "data", "agents", "jobs.json");
const JOBS_KEY = "jobs";
const MAX_EVENT_HISTORY = 200;
const DEFAULT_EVENT_PREVIEW = 6;

const processors = new Map();
let workerTimer = null;

function createJobEvent(level, message, meta = {}) {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    meta: meta && typeof meta === "object" ? meta : {},
  };
}

function normalizeEvents(events) {
  return Array.isArray(events) ? events.slice(-MAX_EVENT_HISTORY) : [];
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
    eventCount: events.length,
    latestEvent: events.length ? events[events.length - 1] : null,
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
  const parsed = loadDocument(JOBS_KEY, defaultJobsState, { legacyPath: JOBS_PATH });
  return {
    ...defaultJobsState(),
    ...parsed,
    jobs: Array.isArray(parsed.jobs)
      ? parsed.jobs.map((job) => ({
          ...job,
          events: normalizeEvents(job.events),
        }))
      : [],
  };
}

function saveJobsState(state) {
  return saveDocument(
    JOBS_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      jobs: Array.isArray(state.jobs) ? state.jobs.slice(-200) : [],
    },
    { legacyPath: JOBS_PATH }
  );
}

function registerJobProcessor(type, processor) {
  processors.set(type, processor);
}

function listJobs(limit = 30, options = {}) {
  return loadJobsState()
    .jobs.slice(-Math.max(1, Number(limit || 30)))
    .reverse()
    .map((job) => serializeJob(job, options));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildJobMetrics(limit = 60) {
  const jobs = listJobs(limit);
  const completed = jobs.filter((job) => job.status === "completed");
  const terminal = jobs.filter((job) => ["completed", "failed", "canceled"].includes(job.status));
  const retries = jobs.filter((job) => Number(job.retryCount || 0) > 0 || job.status === "scheduled_retry");
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
  };
}

function getJob(jobId, options = {}) {
  const job = loadJobsState().jobs.find((item) => item.id === jobId) || null;
  return job ? serializeJob(job, options) : null;
}

function appendJobEvent(jobId, level, message, meta = {}) {
  return updateJob(jobId, (current) => ({
    ...current,
    events: [...normalizeEvents(current.events), createJobEvent(level, message, meta)].slice(-40),
  }));
}

function updateJob(jobId, updater) {
  const state = loadJobsState();
  const index = state.jobs.findIndex((job) => job.id === jobId);
  if (index === -1) {
    return null;
  }
  const current = state.jobs[index];
  state.jobs[index] = typeof updater === "function" ? updater(current) : current;
  saveJobsState(state);
  return state.jobs[index];
}

function enqueueJob(type, payload = {}, meta = {}) {
  const state = loadJobsState();
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    status: "queued",
    actorId: meta.actorId || null,
    actorName: meta.actorName || null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    attempts: 0,
    maxAttempts: Number.isFinite(Number(meta.maxAttempts)) ? Math.max(1, Number(meta.maxAttempts)) : 3,
    retryCount: 0,
    retryDelayMs: Number.isFinite(Number(meta.retryDelayMs)) ? Math.max(100, Number(meta.retryDelayMs)) : 5000,
    nextRetryAt: null,
    canceledAt: null,
    events: [
      createJobEvent("info", "Job queued.", {
        type,
        actorId: meta.actorId || null,
        actorName: meta.actorName || null,
      }),
    ],
  };
  state.jobs.push(job);
  saveJobsState(state);
  scheduleWorker();
  return job;
}

async function runJob(job) {
  const latest = getJob(job.id);
  const currentFull = getJob(job.id, { full: true });
  if (!currentFull || currentFull.status === "canceled") {
    return;
  }

  const processor = processors.get(job.type);
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

  updateJob(job.id, (current) => ({
    ...current,
    status: "running",
    startedAt: new Date().toISOString(),
    error: null,
    attempts: Number(current.attempts || 0) + 1,
  }));
  appendJobEvent(job.id, "info", "Job execution started.", {
    attempt: Number(currentFull.attempts || 0) + 1,
  });

  try {
    const runtimeJob = {
      ...job,
      log(message, meta = {}) {
        appendJobEvent(job.id, "info", String(message || "Processor event."), meta);
      },
    };
    const result = await processor(runtimeJob);
    updateJob(job.id, (current) => ({
      ...current,
      status: "completed",
      completedAt: new Date().toISOString(),
      result: result || null,
      error: null,
      nextRetryAt: null,
    }));
    appendJobEvent(job.id, "success", "Job completed successfully.", {
      result:
        result && typeof result === "object"
          ? Object.keys(result).slice(0, 5)
          : typeof result === "string"
            ? result.slice(0, 120)
            : result ?? null,
    });
  } catch (error) {
    updateJob(job.id, (current) => {
      const attempts = Number(current.attempts || 0);
      const canRetry = attempts < Number(current.maxAttempts || 1);
      const retryCount = Number(current.retryCount || 0);
      const retryDelayMs = Number(current.retryDelayMs || 5000) * Math.pow(2, retryCount);

      return {
        ...current,
        status: canRetry ? "scheduled_retry" : "failed",
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Job failed.",
        nextRetryAt: canRetry ? new Date(Date.now() + retryDelayMs).toISOString() : null,
      };
    });
    appendJobEvent(
      job.id,
      "error",
      error instanceof Error ? error.message : "Job failed.",
      { retryScheduled: Number(currentFull.attempts || 0) + 1 < Number(currentFull.maxAttempts || 1) }
    );
  }
}

async function runPendingJobs() {
  const now = Date.now();
  const queued = loadJobsState().jobs.filter((job) => {
    if (job.status === "queued") {
      return true;
    }

    if (job.status === "scheduled_retry") {
      return !job.nextRetryAt || new Date(job.nextRetryAt).getTime() <= now;
    }

    return false;
  });
  for (const job of queued) {
    if (job.status === "scheduled_retry") {
      updateJob(job.id, (current) => ({
        ...current,
        status: "queued",
        retryCount: Number(current.retryCount || 0) + 1,
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
  const state = loadJobsState();
  const now = Date.now();

  if (state.jobs.some((job) => job.status === "queued")) {
    return 10;
  }

  const scheduledDelays = state.jobs
    .filter((job) => job.status === "scheduled_retry" && job.nextRetryAt)
    .map((job) => Math.max(10, new Date(job.nextRetryAt).getTime() - now))
    .sort((a, b) => a - b);

  return scheduledDelays[0] ?? null;
}

function scheduleWorker() {
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
    try {
      await runPendingJobs();
    } finally {
      workerTimer = null;
      scheduleWorker();
    }
  }, delay);
}

function clearJobs() {
  saveJobsState(defaultJobsState());
}

function cancelJob(jobId) {
  const updated = updateJob(jobId, (current) => {
    if (!current || !["queued", "scheduled_retry"].includes(current.status)) {
      return current;
    }

    return {
      ...current,
      status: "canceled",
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
  }
  return updated;
}

module.exports = {
  loadJobsState,
  saveJobsState,
  registerJobProcessor,
  enqueueJob,
  listJobs,
  buildJobMetrics,
  getJob,
  appendJobEvent,
  updateJob,
  cancelJob,
  retryJob,
  runPendingJobs,
  clearJobs,
};
