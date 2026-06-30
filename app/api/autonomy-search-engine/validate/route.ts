import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomySearchUser, validateAutonomySearchRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomySearchUser(); return apiSuccess(await validateAutonomySearchRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Autonomy Search."); }
}
