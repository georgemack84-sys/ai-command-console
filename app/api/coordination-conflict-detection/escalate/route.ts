import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalateRequest, requireCoordinationConflictUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationConflictUser(); return apiSuccess(await escalateRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate coordination conflict escalation recommendation."); }
}
