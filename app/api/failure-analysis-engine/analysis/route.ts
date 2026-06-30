import { apiError, apiSuccess } from "@/src/server/api/response";
import { analysisRequest, requireFailureAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureAnalysisUser();
    return apiSuccess(await analysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze failure.");
  }
}
