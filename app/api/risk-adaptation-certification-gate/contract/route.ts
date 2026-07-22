import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskAdaptationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskAdaptationCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation certification contract.");
  }
}
