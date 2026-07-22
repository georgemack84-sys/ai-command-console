import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, discoverRequest, requireOptimizationDiscoveryUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireOptimizationDiscoveryUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load optimization opportunity discovery."); }
}
export async function POST(request: Request) {
  try { await requireOptimizationDiscoveryUser(); return apiSuccess(await discoverRequest(request)); }
  catch (error) { return apiError(error, "Unable to discover optimization opportunities."); }
}
