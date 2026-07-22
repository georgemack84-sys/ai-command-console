import { apiError, apiSuccess } from "@/src/server/api/response";
import { baselinesRequest, requireOptimizationDiscoveryUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireOptimizationDiscoveryUser(); return apiSuccess(await baselinesRequest(request)); }
  catch (error) { return apiError(error, "Unable to load optimization performance baselines."); }
}
