import { apiError, apiSuccess } from "@/src/server/api/response";
import { mismatchesRequest, requireConstitutionalReplayValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalReplayValidationUser(); return apiSuccess(await mismatchesRequest(request)); }
  catch (error) { return apiError(error, "Unable to load constitutional replay mismatches."); }
}
