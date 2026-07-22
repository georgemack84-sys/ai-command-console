import { apiError, apiSuccess } from "@/src/server/api/response";
import { indexesRequest, requireMaturityLedgerUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMaturityLedgerUser(); return apiSuccess(await indexesRequest(request)); }
  catch (error) { return apiError(error, "Unable to load maturity repository indexes."); }
}
