import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashEscalationCertificationRequest, requireEscalationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await hashEscalationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash escalation certification.");
  }
}
