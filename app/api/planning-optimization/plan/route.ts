import { apiError, apiSuccess } from "@/src/server/api/response";
import { planPlanningOptimizationRequest, requirePlanningOptimizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningOptimizationUser();
    return apiSuccess(await planPlanningOptimizationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to optimize planning execution.");
  }
}
