import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireRiskAdaptationSimulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationSimulationUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation simulation metrics.");
  }
}
