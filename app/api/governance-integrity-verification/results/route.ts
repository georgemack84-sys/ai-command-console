import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityVerificationUser, resultsGovernanceIntegrityVerificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await resultsGovernanceIntegrityVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity verification results.");
  }
}
