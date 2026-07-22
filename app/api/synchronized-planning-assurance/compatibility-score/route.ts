import { apiError, apiSuccess } from "@/src/server/api/response";
import { compatibilityScoreRequest, requireSynchronizedPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(await compatibilityScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to compute synchronized planning compatibility score.");
  }
}
