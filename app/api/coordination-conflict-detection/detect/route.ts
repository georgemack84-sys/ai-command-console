import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectRequest, requireCoordinationConflictUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationConflictUser(); return apiSuccess(await detectRequest(request)); }
  catch (error) { return apiError(error, "Unable to detect coordination conflicts."); }
}
