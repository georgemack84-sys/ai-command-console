import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDependencySchedulerUser, validateDependencySchedulerRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDependencySchedulerUser();
    return apiSuccess(await validateDependencySchedulerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate dependency schedule.");
  }
}
