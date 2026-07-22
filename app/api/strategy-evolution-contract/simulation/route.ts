import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyEvolutionContractUser, simulationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionContractUser();
    return apiSuccess(await simulationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy evolution simulation requirements.");
  }
}
