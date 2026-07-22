import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOperatorFeedbackCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOperatorFeedbackCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve operator feedback certification contract.");
  }
}
