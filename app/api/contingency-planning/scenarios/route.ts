import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContingencyPlanningUser, scenariosContingencyPlanningRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(await scenariosContingencyPlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze contingency failure scenarios.");
  }
}
