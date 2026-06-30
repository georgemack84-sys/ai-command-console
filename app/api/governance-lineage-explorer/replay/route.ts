import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceLineageExplorerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceLineageExplorerUser(); const view = viewForRequest(request); return apiSuccess({ replay_refs: view.replay_refs, replay_consistent: view.replay_consistent }); } catch (error) { return apiError(error, "Unable to retrieve governance lineage replay references."); } }
