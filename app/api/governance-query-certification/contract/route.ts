import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceQueryCertificationContractResponse, requireGovernanceQueryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceQueryCertificationUser();
    return apiSuccess(getGovernanceQueryCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance query certification contract.");
  }
}
