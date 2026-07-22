import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSharedGovernanceUser, validateReplayRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSharedGovernanceUser(); return apiSuccess(await validateReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate shared governance replay."); }
}
