import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceLineageExplorerUser, viewForRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireGovernanceLineageExplorerUser();
    if (request.url.includes("contract=true")) return apiSuccess(contractResponse());
    const view = viewForRequest(request);
    return apiSuccess({ explorer_id: view.explorer_id, schema_version: view.schema_version, read_only: view.read_only, advisory_only: view.advisory_only, tenant_isolated: view.tenant_isolated, authorization_enforced: view.authorization_enforced, explorer_hash: view.explorer_hash });
  } catch (error) { return apiError(error, "Unable to retrieve governance lineage metadata."); }
}
