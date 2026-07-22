import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireAutonomyMaturityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyMaturityUser(); return apiSuccess(await lifecycleRequest(request)); }
  catch (error) { return apiError(error, "Unable to list autonomy maturity lifecycle."); }
}
