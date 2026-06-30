import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceIntegrityContractResponse, requireGovernanceIntegrityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntegrityContractUser();
    return apiSuccess(getGovernanceIntegrityContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity contract.");
  }
}
