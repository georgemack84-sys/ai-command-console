import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixContingencyPlanningRequest, requireContingencyPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(await matrixContingencyPlanningRequest());
  } catch (error) {
    return apiError(error, "Unable to build contingency decision matrix.");
  }
}
