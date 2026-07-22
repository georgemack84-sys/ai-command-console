import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategySimulationBindingUser, riskRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategySimulationBindingUser();
    return apiSuccess(await riskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy simulation risk analysis.");
  }
}
