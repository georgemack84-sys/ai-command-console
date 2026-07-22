import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMaturityLedgerUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityLedgerUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect maturity ledger evidence repository."); }
}
export async function POST(request: Request) {
  try { await requireMaturityLedgerUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect maturity ledger evidence repository."); }
}
