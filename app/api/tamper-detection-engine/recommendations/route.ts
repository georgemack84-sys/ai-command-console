import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationsTamperDetectionRequest, requireTamperDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireTamperDetectionUser(); return apiSuccess(await recommendationsTamperDetectionRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Tamper Detection recommendations."); }
}
