import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessDependencySchedulerRequest, requireDependencySchedulerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDependencySchedulerUser();
    return apiSuccess(await readinessDependencySchedulerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate dependency readiness.");
  }
}
