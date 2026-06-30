import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceOutputVerificationUser, validateGovernanceOutputsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await validateGovernanceOutputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance output verification report.");
  }
}
