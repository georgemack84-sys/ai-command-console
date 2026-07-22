import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContinuousOptimizationCertificationUser, testsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousOptimizationCertificationUser(); return apiSuccess(await testsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load continuous optimization certification tests."); }
}
