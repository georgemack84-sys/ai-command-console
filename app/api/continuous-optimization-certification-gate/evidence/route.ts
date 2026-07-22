import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireContinuousOptimizationCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(await evidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to load continuous optimization certification evidence."); }
}
