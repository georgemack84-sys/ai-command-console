import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternCertificationContractResponse, requirePatternCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternCertificationUser();
    return apiSuccess(getPatternCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern intelligence certification contract.");
  }
}
