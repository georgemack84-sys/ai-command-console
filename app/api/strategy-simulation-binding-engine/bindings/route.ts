import { apiError, apiSuccess } from "@/src/server/api/response";
import { bindingsRequest, requireStrategySimulationBindingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategySimulationBindingUser();
    return apiSuccess(await bindingsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy simulation bindings.");
  }
}
