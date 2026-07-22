import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, requireOperatorFeedbackCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackCertificationUser();
    return apiSuccess(await certifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify operator feedback integration.");
  }
}
