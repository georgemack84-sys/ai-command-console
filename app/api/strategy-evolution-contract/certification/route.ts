import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireStrategyEvolutionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionContractUser();
    return apiSuccess(await certificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy evolution certification requirements.");
  }
}
