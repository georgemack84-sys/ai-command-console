import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTamperDetectionUser, runTamperDetectionRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireTamperDetectionUser(); return apiSuccess(await runTamperDetectionRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Tamper Detection."); }
}
