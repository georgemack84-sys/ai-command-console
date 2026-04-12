const test = require("node:test");
const assert = require("node:assert/strict");

const {
  clearJobs,
  configureJobQueue,
  enqueueJob,
  updateJob,
  recoverStaleJobs,
  buildQueueHealth,
  getJob,
  runPendingJobs,
  runJobWorkerCycle,
  registerJobProcessor,
} = require("../services/jobQueue");

test.beforeEach(() => {
  configureJobQueue({ executionMode: "in_process", workerPollIntervalMs: 2000 });
  clearJobs();
});

test.after(() => {
  clearJobs();
});

test("recoverStaleJobs reschedules stale running jobs", () => {
  const job = enqueueJob("workspace:generate-insights", { workspaceId: "workspace_1" }, { retryDelayMs: 250 });

  updateJob(job.id, (current) => ({
    ...current,
    status: "running",
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    workerId: "worker_test",
    leaseExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    attempts: 1,
  }));

  const recovered = recoverStaleJobs();
  const refreshed = getJob(job.id, { full: true });

  assert.equal(recovered, true);
  assert.match(String(refreshed.traceId || ""), /^jobtrace_/);
  assert.equal(refreshed.status, "scheduled_retry");
  assert.ok(refreshed.nextRetryAt);
  assert.match(String(refreshed.error || ""), /stale running job/i);
});

test("buildQueueHealth reports stale running pressure", () => {
  const job = enqueueJob("workspace:generate-summary", { workspaceId: "workspace_1" }, {});

  updateJob(job.id, (current) => ({
    ...current,
    status: "running",
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    workerId: "worker_test",
    leaseExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    attempts: 1,
  }));

  const health = buildQueueHealth();

  assert.equal(health.running, 1);
  assert.equal(health.activeWorkers, 1);
  assert.equal(health.staleRunning, 1);
  assert.equal(health.unhealthy, true);
});

test("enqueueJob assigns trace IDs and includes them in event history", () => {
  const job = enqueueJob("workspace:generate-summary", { workspaceId: "workspace_1" }, {});
  const refreshed = getJob(job.id, { full: true });

  assert.match(String(refreshed.traceId || ""), /^jobtrace_/);
  assert.equal(refreshed.events[0]?.meta?.traceId, refreshed.traceId);
});

test("recoverStaleJobs uses expired lease metadata even when startedAt is recent", () => {
  const job = enqueueJob("workspace:generate-insights", { workspaceId: "workspace_1" }, {});

  updateJob(job.id, (current) => ({
    ...current,
    status: "running",
    startedAt: new Date(Date.now() - 5_000).toISOString(),
    workerId: "worker_test",
    leaseExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    attempts: 1,
  }));

  const recovered = recoverStaleJobs();
  const refreshed = getJob(job.id, { full: true });

  assert.equal(recovered, true);
  assert.equal(refreshed.status, "scheduled_retry");
  assert.equal(refreshed.leaseExpiresAt, null);
  assert.equal(refreshed.events.at(-1)?.meta?.leaseExpired, true);
});

test("runPendingJobs records worker lease fields on completion", async () => {
  registerJobProcessor("test:lease-success", async (job) => {
    job.log("Processor entered.", { phase: "start" });
    return { ok: true, traceId: job.traceId };
  });

  const job = enqueueJob("test:lease-success", { workspaceId: "workspace_1" }, { runtimeLimitMs: 2_000 });
  await runPendingJobs();
  const refreshed = getJob(job.id, { full: true });

  assert.equal(refreshed.status, "completed");
  assert.match(String(refreshed.workerId || ""), /^worker_/);
  assert.ok(refreshed.lastHeartbeatAt);
  assert.equal(refreshed.leaseExpiresAt, null);
});

test("queue health reports external worker mode when configured", () => {
  configureJobQueue({ executionMode: "external", workerPollIntervalMs: 1500 });
  const health = buildQueueHealth();

  assert.equal(health.executionMode, "external");
});

test("runJobWorkerCycle executes queued work in external mode", async () => {
  configureJobQueue({ executionMode: "external", workerPollIntervalMs: 1500 });
  registerJobProcessor("test:external-worker", async () => ({ ok: true }));

  const job = enqueueJob("test:external-worker", { workspaceId: "workspace_1" }, {});
  await runJobWorkerCycle();
  const refreshed = getJob(job.id, { full: true });

  assert.equal(refreshed.status, "completed");
});

test("enqueueJob rejects new work when the queue is saturated", () => {
  configureJobQueue({ executionMode: "external", maxPendingJobs: 1, maxRunningJobs: 1 });
  enqueueJob("test:first", { workspaceId: "workspace_1" }, {});

  assert.throws(
    () => enqueueJob("test:second", { workspaceId: "workspace_1" }, {}),
    (error) => error && error.code === "job_queue_saturated" && error.status === 429,
  );
});

test("in-process scheduling does not overlap worker loops under enqueue pressure", async () => {
  configureJobQueue({ executionMode: "in_process", maxPendingJobs: 10, maxRunningJobs: 10, workerPollIntervalMs: 2000 });
  let concurrent = 0;
  let maxConcurrent = 0;

  registerJobProcessor("test:serialized-worker", async () => {
    concurrent += 1;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    await new Promise((resolve) => setTimeout(resolve, 40));
    concurrent -= 1;
    return { ok: true };
  });

  enqueueJob("test:serialized-worker", { workspaceId: "workspace_1" }, {});
  enqueueJob("test:serialized-worker", { workspaceId: "workspace_1" }, {});
  enqueueJob("test:serialized-worker", { workspaceId: "workspace_1" }, {});

  await new Promise((resolve) => setTimeout(resolve, 250));

  assert.equal(maxConcurrent, 1);
});
