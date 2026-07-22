import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOutcomeDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOutcomeDashboardUser();
    return apiSuccess(await sectionRequest(request, "replay_integration"));
  } catch (error) {
    return apiError(error, "Unable to retrieve outcome replay integration.");
  }
}
