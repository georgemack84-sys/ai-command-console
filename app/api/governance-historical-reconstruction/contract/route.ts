import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceHistoricalReconstructionContractResponse, requireGovernanceHistoricalReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceHistoricalReconstructionUser();
    return apiSuccess(getGovernanceHistoricalReconstructionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance historical reconstruction contract.");
  }
}
