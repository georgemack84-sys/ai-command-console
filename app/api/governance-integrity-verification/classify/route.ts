import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyGovernanceIntegrityVerificationRequest, requireGovernanceIntegrityVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await classifyGovernanceIntegrityVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify governance integrity verification failure.");
  }
}
