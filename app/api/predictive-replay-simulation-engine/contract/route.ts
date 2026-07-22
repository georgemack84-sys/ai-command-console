import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePredictiveReplaySimulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePredictiveReplaySimulationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load predictive replay simulation contract.");
  }
}
