import { adaptationUsageRequest, requireOperatorFeedbackLedgerUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackLedgerUser();
    return apiSuccess(await adaptationUsageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation usage.");
  }
}
