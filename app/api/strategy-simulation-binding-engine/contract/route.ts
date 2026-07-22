import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategySimulationBindingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategySimulationBindingUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy simulation binding contract.");
  }
}
