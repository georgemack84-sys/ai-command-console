import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthLedgerContractForRequest, requireTruthLedgerCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireTruthLedgerCertificationUser();
    return apiSuccess(getTruthLedgerContractForRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load Truth Ledger certification contract.");
  }
}
