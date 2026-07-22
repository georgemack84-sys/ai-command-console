import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOperatorFeedbackLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOperatorFeedbackLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve operator feedback ledger contract.");
  }
}
