import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendRequest, requireOperatorFeedbackLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackLedgerUser();
    return apiSuccess(await appendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append operator feedback ledger record.");
  }
}
