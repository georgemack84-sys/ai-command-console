import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, contractResponse, requireContinuousOptimizationCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load continuous optimization certification gate."); }
}
export async function POST(request: Request) {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(await certifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to certify continuous optimization."); }
}
