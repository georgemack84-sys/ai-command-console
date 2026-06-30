import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainRequest, requirePreventativeRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePreventativeRecommendationUser();
    return apiSuccess(await explainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain preventative recommendations.");
  }
}
