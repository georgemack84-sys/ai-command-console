import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, contractResponse, requireOptimizationImpactUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireOptimizationImpactUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load optimization impact analysis."); }
}
export async function POST(request: Request) {
  try { await requireOptimizationImpactUser(); return apiSuccess(await analyzeRequest(request)); }
  catch (error) { return apiError(error, "Unable to analyze optimization impact."); }
}
