import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDependencySchedulerResponse, requireDependencySchedulerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDependencySchedulerUser();
    return apiSuccess(getDependencySchedulerResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve dependency scheduler framework.");
  }
}
