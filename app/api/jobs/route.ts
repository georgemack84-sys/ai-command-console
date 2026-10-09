import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { readBackgroundJob, readBackgroundJobs } from "@/src/server/jobs/background-jobs";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { enforceRateLimit, getDefaultWindowMs, getJobsRateLimit } from "@/src/server/security/rate-limit";
import { executeGovernedJobAction } from "@/src/server/services/governed-job-action-service";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
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

    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    enforceRateLimit(`jobs:post:${user.id}`, { limit: getJobsRateLimit(), windowMs: getDefaultWindowMs() });
    const result = await executeGovernedJobAction(await request.json(), user);
    if (result.requiresConfirmation || result.simulated) {
      return apiSuccess(result);
    }
    const actionResult = result as unknown as { data: unknown; status?: number };
    return apiSuccess(actionResult.data, actionResult.status ? { status: actionResult.status } : undefined);
  } catch (error) {
    return apiError(error, "Unable to manage job.");
  }
}
