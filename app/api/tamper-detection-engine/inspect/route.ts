import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectTamperDetectionRequest, requireTamperDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireTamperDetectionUser(); return apiSuccess(await inspectTamperDetectionRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Tamper Detection."); }
}
export async function POST(request: Request) {
  try { await requireTamperDetectionUser(); return apiSuccess(await inspectTamperDetectionRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Tamper Detection."); }
}
