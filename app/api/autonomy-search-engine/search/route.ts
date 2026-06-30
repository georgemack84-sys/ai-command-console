import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomySearchUser, runAutonomySearchRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomySearchUser(); return apiSuccess(await runAutonomySearchRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Autonomy Search."); }
}
