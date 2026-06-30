import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContingencyPlanningUser, validateContingencyPlanningRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(await validateContingencyPlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate contingency planning package.");
  }
}
