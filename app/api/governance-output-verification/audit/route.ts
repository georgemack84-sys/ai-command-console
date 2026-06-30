import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditGovernanceOutputsRequest, requireGovernanceOutputVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await auditGovernanceOutputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance output verification audit log.");
  }
}
