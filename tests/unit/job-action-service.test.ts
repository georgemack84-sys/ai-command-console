import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/jobs/background-jobs", () => ({
  cancelBackgroundJob: vi.fn(),
  queueBackgroundJob: vi.fn(),
  readBackgroundJob: vi.fn(),
  retryBackgroundJob: vi.fn(),
}));
vi.mock("@/src/server/observability/analytics", () => ({ trackEvent: vi.fn() }));

import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  cancelBackgroundJob,
  queueBackgroundJob,
  readBackgroundJob,
} from "@/src/server/jobs/background-jobs";
import { trackEvent } from "@/src/server/observability/analytics";
import { executeJobAction } from "@/src/server/services/job-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Operator",
  email: "operator@example.com",
  role: "operator" as const,
};

describe("job action service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates target membership and preserves queue metadata", async () => {
    vi.mocked(queueBackgroundJob).mockReturnValue({ id: "job_1", traceId: "trace_1" });

    const result = await executeJobAction({ type: "workspace:generate-insights", workspaceId: "workspace_2" }, actor);

    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "operator",
      workspaceId: "workspace_2",
    });
    expect(queueBackgroundJob).toHaveBeenCalledWith(
      "workspace:generate-insights",
      { workspaceId: "workspace_2" },
      { actorId: "user_1", actorName: "Operator" },
      { admissionSource: "governed_jobs_api" },
    );
    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: "workspace_2" }));
    expect(result).toEqual({ data: { job: { id: "job_1", traceId: "trace_1" } }, status: 202 });
  });

  it("authorizes cancellation against the job workspace before mutation", async () => {
    vi.mocked(readBackgroundJob).mockReturnValue({ id: "job_1", payload: { workspaceId: "workspace_2" } });
    vi.mocked(cancelBackgroundJob).mockReturnValue({ id: "job_1", status: "canceled" });

    const result = await executeJobAction({ type: "job:cancel", jobId: "job_1" }, actor);

    expect(requireWorkspaceMember).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: "workspace_2" }));
    expect(cancelBackgroundJob).toHaveBeenCalledWith("job_1");
    expect(result).toEqual({ data: { job: { id: "job_1", status: "canceled" } } });
  });

  it("does not mutate a job when workspace authorization fails", async () => {
    vi.mocked(readBackgroundJob).mockReturnValue({ id: "job_1", payload: { workspaceId: "workspace_2" } });
    vi.mocked(requireWorkspaceMember).mockRejectedValue(new Error("forbidden"));

    await expect(executeJobAction({ type: "job:cancel", jobId: "job_1" }, actor)).rejects.toThrow("forbidden");
    expect(cancelBackgroundJob).not.toHaveBeenCalled();
  });

  it("fails closed when the requested job does not exist", async () => {
    vi.mocked(readBackgroundJob).mockReturnValue(null);

    await expect(executeJobAction({ type: "job:retry", jobId: "missing" }, actor)).rejects.toMatchObject({
      status: 404,
      code: "job_not_found",
    });
  });
});
