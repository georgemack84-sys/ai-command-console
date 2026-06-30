import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyTamperDetectionRequest, requireTamperDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireTamperDetectionUser(); return apiSuccess(await classifyTamperDetectionRequest(request)); }
  catch (error) { return apiError(error, "Unable to classify tamper detection reason."); }
}
