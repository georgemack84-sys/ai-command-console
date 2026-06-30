import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceStateReconstructionUser, validateGovernanceStateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceStateReconstructionUser();
    return apiSuccess(await validateGovernanceStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance state package.");
  }
}
