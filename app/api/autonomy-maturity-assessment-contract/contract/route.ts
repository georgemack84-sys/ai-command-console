import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractBundleResponse, contractRequest, requireAutonomyMaturityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyMaturityUser(); return apiSuccess(contractBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load autonomy maturity assessment contract."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyMaturityUser(); return apiSuccess(await contractRequest(request)); }
  catch (error) { return apiError(error, "Unable to build autonomy maturity assessment contract."); }
}
