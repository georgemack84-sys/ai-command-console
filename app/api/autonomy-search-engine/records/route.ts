import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsAutonomySearchRequest, requireAutonomySearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomySearchUser(); return apiSuccess(await recordsAutonomySearchRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Autonomy Search records."); }
}
