import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceLineageExplorerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceLineageExplorerUser(); return apiSuccess(viewForRequest(request).root_lineage); } catch (error) { return apiError(error, "Unable to retrieve governance root lineage."); } }
