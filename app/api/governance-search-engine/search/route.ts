import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceSearchEngineUser, runGovernanceSearchRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(await runGovernanceSearchRequest(request));
  } catch (error) {
    return apiError(error, "Unable to execute governance search.");
  }
}
