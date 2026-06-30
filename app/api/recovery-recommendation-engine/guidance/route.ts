import { apiError, apiSuccess } from "@/src/server/api/response";
import { guidanceRequest, requireRecoveryRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryRecommendationUser();
    return apiSuccess(await guidanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load operator recovery guidance.");
  }
}
