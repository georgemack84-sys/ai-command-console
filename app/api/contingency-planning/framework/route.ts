import { apiError, apiSuccess } from "@/src/server/api/response";
import { getContingencyPlanningResponse, requireContingencyPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(getContingencyPlanningResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve contingency planning framework.");
  }
}
