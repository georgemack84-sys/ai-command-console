import { apiError, apiSuccess } from "@/src/server/api/response";
import { forecastValidationRequest, requirePredictiveReplaySimulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictiveReplaySimulationUser();
    return apiSuccess(await forecastValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load forecast validation.");
  }
}
