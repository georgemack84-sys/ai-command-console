import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOperatorFeedbackLedgerUser, simulationUsageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackLedgerUser();
    return apiSuccess(await simulationUsageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation usage.");
  }
}
