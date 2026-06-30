import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceSearchRequest, requireGovernanceSearchEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(await inspectGovernanceSearchRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance search engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceSearchEngineUser();
    return apiSuccess(await inspectGovernanceSearchRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance search engine.");
  }
}
