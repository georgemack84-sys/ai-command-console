import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireReplayIntegrityCertificationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayIntegrityCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Replay Integrity Certification."); }
}
export async function POST(request: Request) {
  try { await requireReplayIntegrityCertificationUser(); return apiSuccess({ validation: await validateRequest(request), observability: await inspectRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Replay Integrity Certification."); }
}
