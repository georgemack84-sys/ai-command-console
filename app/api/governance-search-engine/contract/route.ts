import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceSearchEngineContractResponse, requireGovernanceSearchEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(getGovernanceSearchEngineContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance search engine contract.");
  }
}
