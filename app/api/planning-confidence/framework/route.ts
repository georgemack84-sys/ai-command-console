import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPlanningConfidenceResponse, requirePlanningConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlanningConfidenceUser();
    return apiSuccess(getPlanningConfidenceResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve planning confidence framework.");
  }
}
