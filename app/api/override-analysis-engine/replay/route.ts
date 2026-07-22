import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayOverrideRequest, requireOverrideAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await replayOverrideRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay override analysis.");
  }
}
