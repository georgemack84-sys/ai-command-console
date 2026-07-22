import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOperatorFeedbackContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOperatorFeedbackContractUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve operator feedback contract.");
  }
}
