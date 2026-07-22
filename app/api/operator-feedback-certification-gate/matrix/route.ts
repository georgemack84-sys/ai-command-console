import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixRequest, requireOperatorFeedbackCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackCertificationUser();
    return apiSuccess(await matrixRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve operator feedback certification matrix.");
  }
}
