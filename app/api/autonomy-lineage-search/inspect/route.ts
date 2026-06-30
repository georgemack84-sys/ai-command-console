import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomyLineageSearchRequest, requireAutonomyLineageSearchUser, validateAutonomyLineageSearchRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyLineageSearchUser(); return apiSuccess(await inspectAutonomyLineageSearchRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Lineage Search."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyLineageSearchUser(); return apiSuccess({ validation: await validateAutonomyLineageSearchRequest(request), observability: await inspectAutonomyLineageSearchRequest(request) }); }
  catch (error) { return apiError(error, "Unable to validate Autonomy Lineage Search."); }
}
