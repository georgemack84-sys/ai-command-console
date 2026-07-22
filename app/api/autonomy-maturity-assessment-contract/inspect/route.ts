import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAutonomyMaturityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyMaturityUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect autonomy maturity assessment contract."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyMaturityUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect autonomy maturity assessment contract."); }
}
