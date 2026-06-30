import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceIntegrityVerificationRequest, requireGovernanceIntegrityVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await inspectGovernanceIntegrityVerificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance integrity verification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityVerificationUser();
    return apiSuccess(await inspectGovernanceIntegrityVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance integrity verification.");
  }
}
