import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityVerificationUser, validateGovernanceIntegrityVerificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await validateGovernanceIntegrityVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance integrity verification.");
  }
}
