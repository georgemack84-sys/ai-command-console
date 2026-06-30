import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceIntegrityCertificationContractResponse, requireGovernanceIntegrityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(getGovernanceIntegrityCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity certification contract.");
  }
}
