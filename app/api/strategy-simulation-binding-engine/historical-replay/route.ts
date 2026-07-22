import { apiError, apiSuccess } from "@/src/server/api/response";
import { historicalReplayRequest, requireStrategySimulationBindingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategySimulationBindingUser();
    return apiSuccess(await historicalReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy simulation historical replay.");
  }
}
