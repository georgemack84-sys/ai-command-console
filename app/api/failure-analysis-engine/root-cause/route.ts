import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFailureAnalysisUser, rootCauseRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureAnalysisUser();
    return apiSuccess(await rootCauseRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct failure root cause.");
  }
}
