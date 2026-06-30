import { apiError, apiSuccess } from "@/src/server/api/response";
import { plansRequest, requireRecoveryPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryPlanningUser();
    return apiSuccess(await plansRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate recovery plans.");
  }
}
