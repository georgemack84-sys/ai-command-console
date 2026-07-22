import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceAdaptationLedgerUser, simulationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceAdaptationLedgerUser();
    return apiSuccess(await simulationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence adaptation simulation history.");
  }
}
