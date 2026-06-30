import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePlanningOptimizationUser, validatePlanningOptimizationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningOptimizationUser();
    return apiSuccess(await validatePlanningOptimizationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate optimized planning execution.");
  }
}
