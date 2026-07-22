import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireContinuousOptimizationCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(await decisionRequest(request)); }
  catch (error) { return apiError(error, "Unable to load continuous optimization certification decision."); }
}
