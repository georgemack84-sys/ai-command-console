import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, replayRequest, requireConstitutionalReplayValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalReplayValidationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional replay validation engine."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalReplayValidationUser(); return apiSuccess(await replayRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate constitutional replay."); }
}
