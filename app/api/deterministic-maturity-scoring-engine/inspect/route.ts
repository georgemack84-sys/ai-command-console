import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireDeterministicMaturityScoringUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeterministicMaturityScoringUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect deterministic maturity scoring engine."); }
}
export async function POST(request: Request) {
  try { await requireDeterministicMaturityScoringUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect deterministic maturity scoring engine."); }
}
