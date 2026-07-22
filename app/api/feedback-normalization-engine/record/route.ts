import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordRequest, requireFeedbackNormalizationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackNormalizationEngineUser();
    return apiSuccess(await recordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve normalized feedback record.");
  }
}
