import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContingencyPlanningUser, visibilityContingencyPlanningRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(await visibilityContingencyPlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build contingency planning visibility surface.");
  }
}
