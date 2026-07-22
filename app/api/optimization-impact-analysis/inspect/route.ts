import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireOptimizationImpactUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireOptimizationImpactUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect optimization impact analysis."); }
}
export async function POST(request: Request) {
  try { await requireOptimizationImpactUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect optimization impact analysis."); }
}
