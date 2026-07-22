import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireOperatorFeedbackLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackLedgerUser();
    return apiSuccess(await recordsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve operator feedback ledger records.");
  }
}
