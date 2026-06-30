import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceStateReconstructionContractResponse, requireGovernanceStateReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceStateReconstructionUser();
    return apiSuccess(getGovernanceStateReconstructionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance state reconstruction contract.");
  }
}
