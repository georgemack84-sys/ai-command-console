import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveSimulationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveSimulationCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive simulation certification gate contract.");
  }
}
