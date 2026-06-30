import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceHashChainContractResponse, requireGovernanceHashChainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceHashChainUser();
    return apiSuccess(getGovernanceHashChainContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance hash chain contract.");
  }
}
