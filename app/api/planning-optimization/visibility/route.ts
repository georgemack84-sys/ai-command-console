import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePlanningOptimizationUser, visibilityPlanningOptimizationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningOptimizationUser();
    return apiSuccess(await visibilityPlanningOptimizationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build planning optimization visibility surface.");
  }
}
