import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceIntegrityVerificationContractResponse, requireGovernanceIntegrityVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(getGovernanceIntegrityVerificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity verification contract.");
  }
}
