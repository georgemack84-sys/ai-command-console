import { apiError, apiSuccess } from "@/src/server/api/response";
import { accuracyRequest, requirePredictiveReplaySimulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictiveReplaySimulationUser();
    return apiSuccess(await accuracyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load predictive accuracy.");
  }
}
