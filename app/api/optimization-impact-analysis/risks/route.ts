import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOptimizationImpactUser, risksRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireOptimizationImpactUser(); return apiSuccess(await risksRequest(request)); }
  catch (error) { return apiError(error, "Unable to load optimization risk assessments."); }
}
