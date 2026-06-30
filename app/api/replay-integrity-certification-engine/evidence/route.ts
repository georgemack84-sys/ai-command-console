import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireReplayIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayIntegrityCertificationUser(); return apiSuccess(await evidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Replay Integrity evidence."); }
}
