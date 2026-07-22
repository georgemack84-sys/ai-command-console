import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireHistoricalMaturityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireHistoricalMaturityUser(); return apiSuccess(await reportRequest(request)); }
  catch (error) { return apiError(error, "Unable to load historical maturity report."); }
}
