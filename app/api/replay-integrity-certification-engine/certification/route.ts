import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireReplayIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayIntegrityCertificationUser(); return apiSuccess(await certificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Replay Integrity Certification."); }
}
