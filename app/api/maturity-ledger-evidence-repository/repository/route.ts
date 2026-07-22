import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerBundleResponse, repositoryRequest, requireMaturityLedgerUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityLedgerUser(); return apiSuccess(ledgerBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load maturity ledger evidence repository."); }
}
export async function POST(request: Request) {
  try { await requireMaturityLedgerUser(); return apiSuccess(await repositoryRequest(request)); }
  catch (error) { return apiError(error, "Unable to build maturity ledger evidence repository."); }
}
