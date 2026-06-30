import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceOutputsRequest, requireGovernanceOutputVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await hashGovernanceOutputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance output verification report.");
  }
}
