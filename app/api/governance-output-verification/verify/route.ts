import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceOutputVerificationUser, verifyGovernanceOutputsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await verifyGovernanceOutputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to verify governance outputs.");
  }
}
