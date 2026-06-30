import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPlanningOptimizationResponse, requirePlanningOptimizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlanningOptimizationUser();
    return apiSuccess(getPlanningOptimizationResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve planning optimization framework.");
  }
}
