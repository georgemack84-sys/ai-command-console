import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, requireStrategyEvolutionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionCertificationUser();
    return apiSuccess(await certifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify strategy evolution.");
  }
}
