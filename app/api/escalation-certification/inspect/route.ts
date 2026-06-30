import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectEscalationCertificationRequest, requireEscalationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await inspectEscalationCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect escalation certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await inspectEscalationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect escalation certification.");
  }
}
