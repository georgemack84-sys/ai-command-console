import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/jobs/background-jobs", () => ({ queueBackgroundJob: vi.fn() }));
vi.mock("@/src/server/observability/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/src/server/services/insight-service", () => ({ generateWorkspaceInsights: vi.fn() }));

import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";
import { trackEvent } from "@/src/server/observability/analytics";
import { executeInsightGenerationAction } from "@/src/server/services/insight-generation-action-service";
import { generateWorkspaceInsights } from "@/src/server/services/insight-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "operator",
};

describe("insight generation action service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revalidates membership and generates insights synchronously", async () => {
    const insights = [{ id: "insight_1" }];
    vi.mocked(generateWorkspaceInsights).mockResolvedValue(insights as never);

    const result = await executeInsightGenerationAction({ action: "generate-direct", payload: {} }, actor);

    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: actor.id,
      userRole: actor.role,
      workspaceId: actor.workspaceId,
    });
    expect(generateWorkspaceInsights).toHaveBeenCalledWith(actor.workspaceId);
    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: "insight_generated",
      actorId: actor.id,
      workspaceId: actor.workspaceId,
      properties: { count: 1 },
    }));
    expect(result).toEqual({ data: { insights }, status: 201 });
  });

  it("queues admitted background generation with the original actor", async () => {
    const job = { id: "job_1" };
    vi.mocked(queueBackgroundJob).mockReturnValue(job as never);

    const result = await executeInsightGenerationAction({ action: "generate-queued", payload: {} }, actor);

    expect(queueBackgroundJob).toHaveBeenCalledWith(
      "workspace:generate-insights",
      { workspaceId: actor.workspaceId },
      { actorId: actor.id, actorName: actor.name },
      { admissionSource: "governed_insights_api" },
    );
    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: "insight_generation_requested",
      properties: { jobId: job.id },
    }));
    expect(result).toEqual({ data: { job }, status: 202 });
  });
});
