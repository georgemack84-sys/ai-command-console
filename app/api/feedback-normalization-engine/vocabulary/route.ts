import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFeedbackNormalizationEngineUser, vocabularyResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireFeedbackNormalizationEngineUser();
    return apiSuccess(vocabularyResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback normalization vocabulary.");
  }
}
