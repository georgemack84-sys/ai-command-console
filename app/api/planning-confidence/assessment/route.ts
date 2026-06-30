import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessmentPlanningConfidenceRequest, requirePlanningConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningConfidenceUser();
    return apiSuccess(await assessmentPlanningConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build planning confidence assessment.");
  }
}
