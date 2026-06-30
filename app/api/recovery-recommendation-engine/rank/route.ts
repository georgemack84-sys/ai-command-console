import { apiError, apiSuccess } from "@/src/server/api/response";
import { rankRequest, requireRecoveryRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryRecommendationUser();
    return apiSuccess(await rankRequest(request));
  } catch (error) {
    return apiError(error, "Unable to rank recovery recommendations.");
  }
}
