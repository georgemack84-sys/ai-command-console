import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyReplayRequest, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayCertificationUser(); return apiSuccess(await certifyReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to run replay certification."); }
}
