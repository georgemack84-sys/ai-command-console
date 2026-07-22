import { apiError, apiSuccess } from "@/src/server/api/response";
import { bindRequest, requireStrategySimulationBindingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategySimulationBindingUser();
    return apiSuccess(await bindRequest(request));
  } catch (error) {
    return apiError(error, "Unable to bind strategy simulation.");
  }
}
