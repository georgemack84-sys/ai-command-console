import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePlanningConfidenceUser, visibilityPlanningConfidenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningConfidenceUser();
    return apiSuccess(await visibilityPlanningConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build planning confidence visibility surface.");
  }
}
