import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayDependencySchedulerRequest, requireDependencySchedulerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDependencySchedulerUser();
    return apiSuccess(await replayDependencySchedulerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay dependency schedule.");
  }
}
