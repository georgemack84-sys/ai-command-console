import { apiError, apiSuccess } from "@/src/server/api/response";
import { mitigationAnalysisRequest, requirePredictiveReplaySimulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictiveReplaySimulationUser();
    return apiSuccess(await mitigationAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mitigation analysis.");
  }
}
