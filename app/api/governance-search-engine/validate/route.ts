import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceSearchEngineUser, validateGovernanceSearchRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(await validateGovernanceSearchRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance search.");
  }
}
