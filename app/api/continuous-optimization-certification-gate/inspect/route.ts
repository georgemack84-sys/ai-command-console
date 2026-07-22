import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireContinuousOptimizationCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect continuous optimization certification gate."); }
}
export async function POST(request: Request) {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect continuous optimization certification gate."); }
}
