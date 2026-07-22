import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDeadlockRaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeadlockRaceUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load deadlock race detection contract."); }
}
