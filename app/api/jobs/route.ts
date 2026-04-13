import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { cancelBackgroundJob, queueBackgroundJob, readBackgroundJob, readBackgroundJobs, retryBackgroundJob } from "@/src/server/jobs/background-jobs";
import type { SavedTriageView } from "@/src/server/services/summary-service";
import { trackEvent } from "@/src/server/observability/analytics";

const viewSchema = z.object({
  name: z.string(),
  filter: z.enum(["all", "blocked", "review", "publish", "complete"]),
  sort: z.enum(["urgency", "priority", "recent"]),
  freshnessHours: z.number().positive(),
});

const postSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("workspace:generate-insights"),
    workspaceId: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("workspace:failure-drill"),
    workspaceId: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("workspace:generate-summary"),
    workspaceId: z.string().min(1).optional(),
    view: viewSchema,
  }),
  z.object({
    type: z.literal("job:cancel"),
    jobId: z.string().min(1),
  }),
  z.object({
    type: z.literal("job:retry"),
    jobId: z.string().min(1),
  }),
]);

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");
    const requestedLimit = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, Math.floor(requestedLimit))) : 20;
    if (jobId) {
      const job = readBackgroundJob(jobId);
      if (!job) {
        throw new AppError(404, "job_not_found", "Job not found.");
      }
      return apiSuccess({ job });
    }

    return apiSuccess(readBackgroundJobs(limit));
  } catch (error) {
    return apiError(error, "Unable to load jobs.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const body = postSchema.parse(await request.json());

    if (body.type === "workspace:generate-insights") {
      const job = queueBackgroundJob(
        body.type,
        { workspaceId: body.workspaceId || user.workspaceId },
        { actorId: user.id, actorName: user.name },
      );
      trackEvent({
        event: "insight_generation_requested",
        actorId: user.id,
        workspaceId: body.workspaceId || user.workspaceId,
        properties: { jobId: job.id },
      });
      return apiSuccess({ job }, { status: 202 });
    }

    if (body.type === "workspace:failure-drill") {
      const job = queueBackgroundJob(
        body.type,
        { workspaceId: body.workspaceId || user.workspaceId },
        { actorId: user.id, actorName: user.name },
      );
      return apiSuccess({ job }, { status: 202 });
    }

    if (body.type === "workspace:generate-summary") {
      const job = queueBackgroundJob(
        body.type,
        { workspaceId: body.workspaceId || user.workspaceId, view: body.view as SavedTriageView },
        { actorId: user.id, actorName: user.name },
      );
      return apiSuccess({ job }, { status: 202 });
    }

    if (body.type === "job:cancel") {
      const job = cancelBackgroundJob(body.jobId);
      if (!job) {
        throw new AppError(404, "job_not_found", "Job not found.");
      }
      return apiSuccess({ job });
    }

    const job = retryBackgroundJob(body.jobId);
    if (!job) {
      throw new AppError(404, "job_not_found", "Job not found.");
    }
    return apiSuccess({ job });
  } catch (error) {
    return apiError(error, "Unable to manage job.");
  }
}
