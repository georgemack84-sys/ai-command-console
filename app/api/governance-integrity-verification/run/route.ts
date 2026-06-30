import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityVerificationUser, runGovernanceIntegrityVerificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await runGovernanceIntegrityVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run governance integrity verification.");
  }
}
