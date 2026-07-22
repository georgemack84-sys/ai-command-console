import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireFeedbackIntakeEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireFeedbackIntakeEngineUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback intake engine contract.");
  }
}
