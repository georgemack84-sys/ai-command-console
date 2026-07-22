import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireOptimizationDiscoveryUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireOptimizationDiscoveryUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect optimization opportunity discovery."); }
}
export async function POST(request: Request) {
  try { await requireOptimizationDiscoveryUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect optimization opportunity discovery."); }
}
