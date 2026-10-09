import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/jobs/background-jobs", () => ({
  queueBackgroundJob: vi.fn(),
  readBackgroundJobs: vi.fn(() => ({
    items: [],
    metrics: {},
    health: { running: 0, queued: 0, scheduledRetries: 0, staleRunning: 0, unhealthy: false },
    diagnostics: {
      summary: { total: 0, errors: 0, warnings: 0, byScope: {}, latestAt: null },
      recent: [],
      health: { running: 0, queued: 0, scheduledRetries: 0, staleRunning: 0, unhealthy: false },
      latestFailures: [],
    },
  })),
  readBackgroundJob: vi.fn(),
  cancelBackgroundJob: vi.fn(),
  retryBackgroundJob: vi.fn(),
}));

vi.mock("@/src/server/services/governed-job-action-service", () => ({
  executeGovernedJobAction: vi.fn(),
}));

import { GET, POST } from "@/app/api/jobs/route";
import { AppError } from "@/src/server/api/errors";
import { getSessionUser } from "@/src/lib/auth";
import { cancelBackgroundJob, queueBackgroundJob, readBackgroundJobs, retryBackgroundJob } from "@/src/server/jobs/background-jobs";
import { executeGovernedJobAction } from "@/src/server/services/governed-job-action-service";

describe("jobs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(executeGovernedJobAction).mockImplementation(async (input, user) => {
      const body = input as Record<string, unknown>;
      if (body.type === "job:cancel" || body.type === "job:retry") {
        const job = body.type === "job:cancel"
          ? cancelBackgroundJob(String(body.jobId))
          : retryBackgroundJob(String(body.jobId));
        if (!job) throw new AppError(404, "job_not_found", "Job not found.");
        return { data: { job } } as never;
      }
      const workspaceId = String(body.workspaceId || user.workspaceId);
      const job = queueBackgroundJob(
        body.type as "workspace:generate-insights" | "workspace:generate-summary" | "workspace:failure-drill",
        body.type === "workspace:generate-summary" ? { workspaceId, view: body.view } : { workspaceId },
        { actorId: user.id, actorName: user.name },
      );
      return { data: { job }, status: 202 } as never;
    });
  });

  it("queues an insight job for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(queueBackgroundJob).mockReturnValue({ id: "job_1", traceId: "job_trace_1", type: "workspace:generate-insights" });

    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({ type: "workspace:generate-insights" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.ok).toBe(true);
    expect(payload.data.job.traceId).toBe("job_trace_1");
    expect(queueBackgroundJob).toHaveBeenCalledWith(
      "workspace:generate-insights",
      { workspaceId: "workspace_1" },
      { actorId: "user_1", actorName: "Operator" },
    );
  });

  it("queues a failure drill job for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(queueBackgroundJob).mockReturnValue({ id: "job_2", traceId: "job_trace_2", type: "workspace:failure-drill" });

    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({ type: "workspace:failure-drill" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.ok).toBe(true);
    expect(payload.data.job.traceId).toBe("job_trace_2");
    expect(queueBackgroundJob).toHaveBeenCalledWith(
      "workspace:failure-drill",
      { workspaceId: "workspace_1" },
      { actorId: "user_1", actorName: "Operator" },
    );
  });

  it("rejects anonymous job access", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/jobs"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
  });

  it("returns 429 when the queue is saturated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(queueBackgroundJob).mockImplementation(() => {
      throw new AppError(429, "job_queue_saturated", "The job queue is saturated.");
    });

    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({ type: "workspace:generate-insights" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("job_queue_saturated");
  });

  it("returns queue diagnostics for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(readBackgroundJobs).mockReturnValue({
      items: [],
      metrics: { timedOut: 1 },
      health: { running: 1, queued: 0, scheduledRetries: 1, staleRunning: 0, unhealthy: false },
      diagnostics: {
        summary: { total: 2, errors: 0, warnings: 1, byScope: { "jobs.queue": 1, "ai.summary": 1 }, latestAt: "2026-04-08T00:00:00.000Z" },
        recent: [
          { id: "diag_1", scope: "jobs.queue", level: "warn", message: "Queue degraded", timestamp: "2026-04-08T00:00:00.000Z", traceId: "job_trace_1", context: {} },
        ],
        health: { running: 1, queued: 0, scheduledRetries: 1, staleRunning: 0, unhealthy: false },
        latestFailures: [{ id: "job_1", traceId: "job_trace_1", type: "workspace:generate-summary", status: "failed", error: "Timed out", nextRetryAt: null, latestEventAt: "2026-04-08T00:00:00.000Z" }],
      },
    });

    const response = await GET(new Request("http://localhost/api/jobs"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.diagnostics.summary.total).toBe(2);
    expect(payload.data.diagnostics.recent[0].scope).toBe("jobs.queue");
    expect(payload.data.diagnostics.recent[0].traceId).toBe("job_trace_1");
    expect(payload.data.diagnostics.latestFailures[0].traceId).toBe("job_trace_1");
  });

  it("returns confirmation evidence without dispatching the job mutation", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeGovernedJobAction).mockResolvedValueOnce({
      action: "job:cancel",
      output: "Control review requires confirmation before execution.",
      requiresConfirmation: true,
    } as never);

    const response = await POST(new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "job:cancel", jobId: "job_1" }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.requiresConfirmation).toBe(true);
    expect(cancelBackgroundJob).not.toHaveBeenCalled();
  });
});
