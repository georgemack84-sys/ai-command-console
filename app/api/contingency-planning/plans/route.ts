import { apiError, apiSuccess } from "@/src/server/api/response";
import { plansContingencyPlanningRequest, requireContingencyPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireContingencyPlanningUser();
    return apiSuccess(await plansContingencyPlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build contingency recovery plans.");
  }
}
