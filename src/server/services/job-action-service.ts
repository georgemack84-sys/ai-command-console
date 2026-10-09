import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  cancelBackgroundJob,
  queueBackgroundJob,
  readBackgroundJob,
  retryBackgroundJob,
} from "@/src/server/jobs/background-jobs";
import { trackEvent } from "@/src/server/observability/analytics";
import type { SavedTriageView } from "@/src/server/services/summary-service";

const viewSchema = z.object({
  name: z.string(),
  filter: z.enum(["all", "blocked", "review", "publish", "complete"]),
  sort: z.enum(["urgency", "priority", "recent"]),
  freshnessHours: z.number().positive(),
});

const jobActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("workspace:generate-insights"), workspaceId: z.string().min(1).optional() }),
  z.object({ type: z.literal("workspace:failure-drill"), workspaceId: z.string().min(1).optional() }),
  z.object({
    type: z.literal("workspace:generate-summary"),
    workspaceId: z.string().min(1).optional(),
    view: viewSchema,
  }),
  z.object({ type: z.literal("job:cancel"), jobId: z.string().min(1) }),
  z.object({ type: z.literal("job:retry"), jobId: z.string().min(1) }),
]);

type JobActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

async function requireJobWorkspace(actor: JobActor, workspaceId: string) {
  await requireWorkspaceMember({ userId: actor.id, userRole: actor.role, workspaceId });
}

async function requireExistingJob(actor: JobActor, jobId: string) {
  const job = readBackgroundJob(jobId) as { payload?: { workspaceId?: unknown } } | null;
  if (!job) {
    throw new AppError(404, "job_not_found", "Job not found.");
  }
  const workspaceId = typeof job.payload?.workspaceId === "string" ? job.payload.workspaceId : actor.workspaceId;
  await requireJobWorkspace(actor, workspaceId);
  return job;
}

export async function executeJobAction(input: unknown, actor: JobActor) {
  const body = jobActionSchema.parse(input);

  if (body.type === "job:cancel" || body.type === "job:retry") {
    await requireExistingJob(actor, body.jobId);
    const job = body.type === "job:cancel" ? cancelBackgroundJob(body.jobId) : retryBackgroundJob(body.jobId);
    if (!job) {
      throw new AppError(404, "job_not_found", "Job not found.");
    }
    return { data: { job } };
  }

  const workspaceId = body.workspaceId || actor.workspaceId;
  await requireJobWorkspace(actor, workspaceId);
  const payload =
    body.type === "workspace:generate-summary"
      ? { workspaceId, view: body.view as SavedTriageView }
      : { workspaceId };
  const job = queueBackgroundJob(
    body.type,
    payload,
    { actorId: actor.id, actorName: actor.name },
    { admissionSource: "governed_jobs_api" },
  );

  if (body.type === "workspace:generate-insights") {
    trackEvent({
      event: "insight_generation_requested",
      actorId: actor.id,
      workspaceId,
      properties: { jobId: job.id },
    });
  }

  return { data: { job }, status: 202 };
}
