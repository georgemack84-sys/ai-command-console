import { apiError, apiSuccess } from "@/src/server/api/response";
import { constraintsPlanningOptimizationRequest, requirePlanningOptimizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningOptimizationUser();
    return apiSuccess(await constraintsPlanningOptimizationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load planning optimization constraints.");
  }
}
