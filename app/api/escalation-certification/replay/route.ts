import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayEscalationCertificationRequest, requireEscalationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await replayEscalationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay escalation certification.");
  }
}
