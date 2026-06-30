import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerGovernanceIntegrityVerificationRequest, requireGovernanceIntegrityVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await ledgerGovernanceIntegrityVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity verification ledger record.");
  }
}
