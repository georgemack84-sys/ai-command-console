import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceSearchRequest, requireGovernanceSearchEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(await hashGovernanceSearchRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance search response.");
  }
}
