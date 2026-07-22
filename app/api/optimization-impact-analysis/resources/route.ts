import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOptimizationImpactUser, resourcesRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireOptimizationImpactUser(); return apiSuccess(await resourcesRequest(request)); }
  catch (error) { return apiError(error, "Unable to load optimization resource impact reports."); }
}
