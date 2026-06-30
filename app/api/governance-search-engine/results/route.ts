import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceSearchEngineUser, resultsGovernanceSearchRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(await resultsGovernanceSearchRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance search results.");
  }
}
