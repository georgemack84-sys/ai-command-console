import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyEvolutionContractUser, rollbackRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionContractUser();
    return apiSuccess(await rollbackRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy evolution rollback requirements.");
  }
}
