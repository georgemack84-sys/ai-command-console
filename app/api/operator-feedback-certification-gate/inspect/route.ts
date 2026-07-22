import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireOperatorFeedbackCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackCertificationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect operator feedback certification.");
  }
}
