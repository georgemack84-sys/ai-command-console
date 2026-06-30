import { apiError, apiSuccess } from "@/src/server/api/response";
import { confidenceRequest, requireFailureAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureAnalysisUser();
    return apiSuccess(await confidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to estimate failure analysis confidence.");
  }
}
