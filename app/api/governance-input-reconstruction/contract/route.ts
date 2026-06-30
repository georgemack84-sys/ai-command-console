import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceInputReconstructionContractResponse, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(getGovernanceInputReconstructionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance input reconstruction contract.");
  }
}
