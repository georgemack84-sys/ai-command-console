import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyOverrideRequest, requireOverrideAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await classifyOverrideRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify override.");
  }
}
