import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendRecoveryRequest, requireDeadlockRaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeadlockRaceUser(); return apiSuccess(await recommendRecoveryRequest(request)); }
  catch (error) { return apiError(error, "Unable to recommend deadlock/race recovery."); }
}
