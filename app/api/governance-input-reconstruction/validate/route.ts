import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceInputReconstructionUser, validateGovernanceInputsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await validateGovernanceInputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance input package.");
  }
}
