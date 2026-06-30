import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayInvestigationWorkspaceUser, searchRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayInvestigationWorkspaceUser(); return apiSuccess(await searchRequest(request)); }
  catch (error) { return apiError(error, "Unable to load investigation search results."); }
}
