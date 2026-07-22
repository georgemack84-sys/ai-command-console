import { apiError, apiSuccess } from "@/src/server/api/response";
import { historicalBundleResponse, historyRequest, requireHistoricalMaturityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireHistoricalMaturityUser(); return apiSuccess(historicalBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load historical maturity evolution."); }
}
export async function POST(request: Request) {
  try { await requireHistoricalMaturityUser(); return apiSuccess(await historyRequest(request)); }
  catch (error) { return apiError(error, "Unable to build historical maturity evolution."); }
}
