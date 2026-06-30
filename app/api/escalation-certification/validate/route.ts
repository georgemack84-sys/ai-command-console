import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEscalationCertificationUser, validateEscalationCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await validateEscalationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate escalation certification.");
  }
}
