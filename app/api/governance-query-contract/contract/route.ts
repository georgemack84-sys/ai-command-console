import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceQueryContractResponse, requireGovernanceQueryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceQueryContractUser();
    return apiSuccess(getGovernanceQueryContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance query contract.");
  }
}
