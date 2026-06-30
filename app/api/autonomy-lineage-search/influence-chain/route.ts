import { apiError, apiSuccess } from "@/src/server/api/response";
import { influenceChainRequest, requireAutonomyLineageSearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyLineageSearchUser(); return apiSuccess(await influenceChainRequest(request)); }
  catch (error) { return apiError(error, "Unable to load influence chain."); }
}
