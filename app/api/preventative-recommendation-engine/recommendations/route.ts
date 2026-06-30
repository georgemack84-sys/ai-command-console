import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationsRequest, requirePreventativeRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePreventativeRecommendationUser();
    return apiSuccess(await recommendationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate preventative recommendations.");
  }
}
