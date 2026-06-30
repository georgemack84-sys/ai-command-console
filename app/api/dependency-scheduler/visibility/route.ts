import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDependencySchedulerUser, visibilityDependencySchedulerRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDependencySchedulerUser();
    return apiSuccess(await visibilityDependencySchedulerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build dependency scheduler visibility surface.");
  }
}
