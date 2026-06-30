import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceReplayViewerUser, viewForRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireGovernanceReplayViewerUser();
    if (request.url.includes("contract=true")) return apiSuccess(contractResponse());
    const view = viewForRequest(request);
    return apiSuccess({ viewer_id: view.viewer_id, schema_version: view.schema_version, read_only: view.read_only, advisory_only: view.advisory_only, tenant_isolated: view.tenant_isolated, authorization_enforced: view.authorization_enforced, viewer_hash: view.viewer_hash });
  } catch (error) { return apiError(error, "Unable to retrieve governance replay metadata."); }
}
