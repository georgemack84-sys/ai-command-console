import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRecoveryInterventionRecommendationRequest, requireRecoveryInterventionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryInterventionUser();
    return apiSuccess(await createRecoveryInterventionRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Recovery & Intervention recommendation.");
  }
}
