import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOperatorFeedbackContractUser, schemaResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOperatorFeedbackContractUser();
    return apiSuccess(schemaResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve operator feedback schema.");
  }
}
