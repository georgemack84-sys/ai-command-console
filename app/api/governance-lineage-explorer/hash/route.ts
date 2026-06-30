import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceLineageExplorerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceLineageExplorerUser(); const view = viewForRequest(request); return apiSuccess({ explorer_id: view.explorer_id, graph_hash: view.graph_hash, explorer_hash: view.explorer_hash }); } catch (error) { return apiError(error, "Unable to hash governance lineage explorer."); } }
