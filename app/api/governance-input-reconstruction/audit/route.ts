import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditGovernanceInputsRequest, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await auditGovernanceInputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance input reconstruction audit log.");
  }
}
