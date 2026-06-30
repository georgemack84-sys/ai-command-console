import { apiError, apiSuccess } from "@/src/server/api/response";
import { intakeContingencyPlanningRequest, requireContingencyPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(await intakeContingencyPlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build contingency planning intake.");
  }
}
