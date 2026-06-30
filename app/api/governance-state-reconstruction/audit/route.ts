import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditGovernanceStateRequest, requireGovernanceStateReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceStateReconstructionUser();
    return apiSuccess(await auditGovernanceStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance state reconstruction audit log.");
  }
}
