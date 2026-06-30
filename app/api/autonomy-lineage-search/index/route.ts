import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageIndexRequest, requireAutonomyLineageSearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyLineageSearchUser(); return apiSuccess(await lineageIndexRequest(request)); }
  catch (error) { return apiError(error, "Unable to load lineage index."); }
}
