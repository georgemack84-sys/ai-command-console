import { apiError, apiSuccess } from "@/src/server/api/response";
import { factorsPlanningConfidenceRequest, requirePlanningConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningConfidenceUser();
    return apiSuccess(await factorsPlanningConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate planning confidence factors.");
  }
}
