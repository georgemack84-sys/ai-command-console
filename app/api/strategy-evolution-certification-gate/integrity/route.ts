import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireStrategyEvolutionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionCertificationUser();
    return apiSuccess(await integrityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy evolution integrity certification.");
  }
}
